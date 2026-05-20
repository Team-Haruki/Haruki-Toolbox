import { computed, ref } from "vue"
import { defineStore } from "pinia"
import type { SekaiRegion } from "@/types"
import { SEKAI_REGIONS } from "@/lib/sekai-region"
import { normalizeSekaiMasterFileName } from "@/shared/sekai/data-sources"
import { readSekaiRegionCacheMeta } from "@/shared/sekai/cache"
import { postSekaiDataWorkerRequest, subscribeSekaiDataWorker } from "@/shared/sekai/update-client"
import type { SekaiDataUpdatePhase, SekaiDataWorkerEvent } from "@/shared/sekai/worker-protocol"

export type SekaiDataRegionStatus = "idle" | "loading" | "ready" | "clearing" | "error"

export type SekaiDataRegionState = {
  region: SekaiRegion
  status: SekaiDataRegionStatus
  phase: SekaiDataUpdatePhase | null
  refreshing: boolean
  progress: number
  masterDisplayVersion: string | null
  masterFetchVersion: string | null
  musicMetasUpdatedAt: number | null
  files: string[]
  error: string | null
  updatedAt: number | null
  checkedAt: number | null
}

export type SekaiDataQueueItem = {
  id: string
  region: SekaiRegion
  status: "queued" | "running" | "done" | "error"
  phase: SekaiDataUpdatePhase
  progress: number
  fileName: string | null
  total: number | null
  current: number | null
  cacheHit: boolean | null
  error: string | null
  createdAt: number
  updatedAt: number
}

export const useSekaiDataStore = defineStore("sekai-data", () => {
  const regionStates = ref<Record<SekaiRegion, SekaiDataRegionState>>(createInitialRegionStates())
  const queue = ref<SekaiDataQueueItem[]>([])
  const latestQueueItems = computed(() => queue.value.slice(0, 8))
  let workerSubscribed = false
  const activeRequests = new Map<SekaiRegion, {
    files: string[]
    promise: Promise<void>
  }>()
  const requestResolvers = new Map<string, {
    resolve: () => void
    reject: (error: Error) => void
  }>()

  async function loadRegionCacheState(region: SekaiRegion) {
    try {
      const meta = await readSekaiRegionCacheMeta(region)
      if (!meta?.master) {
        updateRegionState(region, {
          status: "idle",
          masterDisplayVersion: null,
          masterFetchVersion: null,
          musicMetasUpdatedAt: null,
          files: [],
          updatedAt: null,
          checkedAt: Date.now(),
        })
        return
      }

      updateRegionState(region, {
        status: "ready",
        masterDisplayVersion: meta.master.displayVersion,
        masterFetchVersion: meta.master.fetchVersion,
        musicMetasUpdatedAt: meta.musicMetas?.updatedAt ?? null,
        files: meta.master.files,
        updatedAt: Math.max(meta.master.updatedAt, meta.musicMetas?.updatedAt ?? 0),
        checkedAt: Date.now(),
        error: null,
      })
    } catch (error) {
      updateRegionState(region, {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        checkedAt: Date.now(),
      })
    }
  }

  async function ensureRegionData(region: SekaiRegion, options: { force?: boolean; files?: readonly string[] } = {}) {
    await loadRegionCacheState(region)
    const requestedFiles = normalizeFileList(options.files)
    const activeRequest = activeRequests.get(region)
    if (
      !options.force
      && activeRequest
      && requestedFiles.every((fileName) => activeRequest.files.includes(fileName))
    ) {
      return activeRequest.promise
    }

    const hasCache = Boolean(regionStates.value[region].masterFetchVersion)
    startQueueItem(region, options.force ? "fetching-master" : "checking")
    let requestId = queue.value[0]?.id ?? `pending:${region}`
    let resolveRequest: () => void = () => {}
    let rejectRequest: (error: Error) => void = () => {}
    const promise = new Promise<void>((resolve, reject) => {
      resolveRequest = resolve
      rejectRequest = reject
    })
    activeRequests.set(region, { files: requestedFiles, promise })
    requestResolvers.set(requestId, { resolve: resolveRequest, reject: rejectRequest })
    try {
      ensureWorkerSubscription()
      const postedRequestId = postSekaiDataWorkerRequest({
        type: "ensure-region",
        region,
        force: options.force,
        files: requestedFiles,
      })
      requestResolvers.delete(requestId)
      requestId = postedRequestId
      requestResolvers.set(requestId, { resolve: resolveRequest, reject: rejectRequest })
      replaceLatestQueueId(region, requestId)
    } catch (error) {
      handleWorkerEvent({
        type: "error",
        requestId: queue.value[0]?.id ?? `pending:${region}`,
        region,
        message: error instanceof Error ? error.message : String(error),
      })
      return promise
    }
    updateRegionState(region, {
      status: hasCache ? "ready" : "loading",
      phase: options.force ? "fetching-master" : "checking",
      refreshing: true,
      progress: hasCache ? 5 : 0,
      error: null,
    })
    return promise
  }

  function refreshRegionData(region: SekaiRegion, files?: readonly string[]) {
    void ensureRegionData(region, { force: true, files })
  }

  function clearRegionData(region: SekaiRegion) {
    let requestId: string
    try {
      ensureWorkerSubscription()
      requestId = postSekaiDataWorkerRequest({
        type: "clear-region",
        region,
      })
    } catch (error) {
      updateRegionState(region, {
        status: "error",
        refreshing: false,
        error: error instanceof Error ? error.message : String(error),
      })
      return
    }

    queue.value.unshift(createQueueItem(requestId, region, "clearing"))
    trimQueue()
    updateRegionState(region, {
      status: "clearing",
      phase: "clearing",
      refreshing: true,
      progress: 0,
      error: null,
    })
  }

  function handleWorkerEvent(event: SekaiDataWorkerEvent) {
    if (event.type === "progress") {
      patchQueueItem(event.requestId, {
        status: "running",
        phase: event.phase,
        progress: event.progress,
        fileName: event.fileName ?? null,
        total: event.total ?? null,
        current: event.current ?? null,
      })
      updateRegionState(event.region, {
        phase: event.phase,
        refreshing: true,
        progress: event.progress,
      })
      return
    }

    if (event.type === "done") {
      resolveRequest(event.requestId, event.region)
      patchQueueItem(event.requestId, {
        status: "done",
        phase: "ready",
        progress: 100,
        cacheHit: event.cacheHit,
      })
      updateRegionState(event.region, {
        status: "ready",
        phase: "ready",
        refreshing: false,
        progress: 100,
        masterDisplayVersion: event.displayVersion,
        masterFetchVersion: event.fetchVersion,
        files: event.files,
        error: null,
        checkedAt: Date.now(),
        updatedAt: Date.now(),
      })
      return
    }

    if (event.type === "cleared") {
      resolveRequest(event.requestId, event.region)
      patchQueueItem(event.requestId, {
        status: "done",
        phase: "ready",
        progress: 100,
      })
      updateRegionState(event.region, createRegionState(event.region))
      return
    }

    rejectRequest(event.requestId, event.region, new Error(event.message))
    patchQueueItem(event.requestId, {
      status: "error",
      error: event.message,
    })
    updateRegionState(event.region, {
      status: "error",
      refreshing: false,
      error: event.message,
      checkedAt: Date.now(),
    })
  }

  function resolveRequest(requestId: string, region: SekaiRegion) {
    requestResolvers.get(requestId)?.resolve()
    requestResolvers.delete(requestId)
    activeRequests.delete(region)
  }

  function rejectRequest(requestId: string, region: SekaiRegion, error: Error) {
    requestResolvers.get(requestId)?.reject(error)
    requestResolvers.delete(requestId)
    activeRequests.delete(region)
  }

  function ensureWorkerSubscription() {
    if (workerSubscribed || typeof Worker === "undefined") {
      return
    }

    workerSubscribed = true
    subscribeSekaiDataWorker((event) => {
      handleWorkerEvent(event)
    })
  }

  function startQueueItem(region: SekaiRegion, phase: SekaiDataUpdatePhase) {
    queue.value.unshift(createQueueItem(`pending:${region}:${Date.now()}`, region, phase))
    trimQueue()
  }

  function trimQueue() {
    const maxItems = 20
    if (queue.value.length > maxItems) {
      queue.value.splice(maxItems)
    }
  }

  function replaceLatestQueueId(region: SekaiRegion, requestId: string) {
    const item = queue.value.find((candidate) => candidate.region === region && candidate.id.startsWith("pending:"))
    if (item) {
      item.id = requestId
      item.updatedAt = Date.now()
    }
  }

  function patchQueueItem(id: string, patch: Partial<SekaiDataQueueItem>) {
    const item = queue.value.find((candidate) => candidate.id === id)
    if (!item) {
      return
    }

    Object.assign(item, patch, { updatedAt: Date.now() })
  }

  function updateRegionState(region: SekaiRegion, patch: Partial<SekaiDataRegionState>) {
    regionStates.value = {
      ...regionStates.value,
      [region]: {
        ...regionStates.value[region],
        ...patch,
      },
    }
  }

  return {
    regionStates,
    queue,
    latestQueueItems,
    loadRegionCacheState,
    ensureRegionData,
    refreshRegionData,
    clearRegionData,
  }
})

function normalizeFileList(files: readonly string[] | undefined): string[] {
  return [...new Set((files ?? []).map(normalizeSekaiMasterFileName).filter(Boolean))]
}

function createInitialRegionStates(): Record<SekaiRegion, SekaiDataRegionState> {
  return SEKAI_REGIONS.reduce((acc, region) => {
    acc[region] = createRegionState(region)
    return acc
  }, {} as Record<SekaiRegion, SekaiDataRegionState>)
}

function createRegionState(region: SekaiRegion): SekaiDataRegionState {
  return {
    region,
    status: "idle",
    phase: null,
    refreshing: false,
    progress: 0,
    masterDisplayVersion: null,
    masterFetchVersion: null,
    musicMetasUpdatedAt: null,
    files: [],
    error: null,
    updatedAt: null,
    checkedAt: null,
  }
}

function createQueueItem(
  id: string,
  region: SekaiRegion,
  phase: SekaiDataUpdatePhase,
): SekaiDataQueueItem {
  const now = Date.now()
  return {
    id,
    region,
    status: "queued",
    phase,
    progress: 0,
    fileName: null,
    total: null,
    current: null,
    cacheHit: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  }
}
