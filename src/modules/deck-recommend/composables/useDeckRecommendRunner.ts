import { computed, ref } from "vue"
import type { RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useUserStore } from "@/shared/stores/user"
import { SEKAI_DATA_RECOMMEND_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { fetchDeckRecommendUserData } from "../api/recommend-data"
import {
  buildDeckRecommendOptions,
  resolveRecommendDataMode,
  type DeckRecommendAlgorithm,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
} from "../lib/recommend-options"
import {
  mergeDeckRecommendResults,
  type TaggedRecommendResult,
} from "../lib/recommend-results"
import {
  createDeckRecommendWorker,
  disposeDeckRecommendWorker,
  loadDeckRecommendWorkerData,
  postDeckRecommendWorkerRequest,
  subscribeDeckRecommendWorker,
  warmDeckRecommendWorker,
} from "../lib/recommend-worker-client"
import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerRequest,
  DeckRecommendWorkerRecommendRequest,
} from "../lib/worker-protocol"
import type { CardTrainingConfig } from "../lib/training-config"

export type DeckRecommendExecutionMode = "sequential" | "parallel"

export type DeckRecommendRunnerInput = {
  account: {
    server: SekaiRegion
    uid: string
  } | null
  dataRegion: SekaiRegion
  mode: DeckRecommendMode
  liveType: DeckRecommendLiveType
  algorithms: DeckRecommendAlgorithm[]
  executionMode: DeckRecommendExecutionMode
  eventId: string | null
  characterId: string | null
  musicId: string | null
  difficulty: string | null
  trainingConfig: CardTrainingConfig[]
}

export type DeckRecommendAlgorithmTiming = {
  algorithm: DeckRecommendAlgorithm
  elapsedMs: number
}

export function useDeckRecommendRunner() {
  const userStore = useUserStore()
  const sekaiDataStore = useSekaiDataStore()
  const running = ref(false)
  const phase = ref<Extract<DeckRecommendWorkerEvent, { type: "progress" }>["phase"] | "fetching-user-data" | "preparing-data" | null>(null)
  const error = ref<string | null>(null)
  const result = ref<TaggedRecommendResult | null>(null)
  const masterData = ref<Record<string, unknown> | null>(null)
  const elapsedMs = ref<number | null>(null)
  const dataElapsedMs = ref<number | null>(null)
  const engineDataElapsedMs = ref<number | null>(null)
  const recommendElapsedMs = ref<number | null>(null)
  const resultExecutionMode = ref<DeckRecommendExecutionMode | null>(null)
  const algorithmTimings = ref<DeckRecommendAlgorithmTiming[]>([])
  const preloadedDataKeys = new Set<string>()
  const dataPreloadPromises = new Map<string, Promise<void>>()
  const parallelWorkers: ParallelWorkerEntry[] = []

  const hasResult = computed(() => Boolean(result.value?.decks?.length))

  async function run(input: DeckRecommendRunnerInput) {
    if (!userStore.userId) {
      throw new Error("toolbox user is required")
    }
    if (!input.account) {
      throw new Error("game account is required")
    }

    running.value = true
    phase.value = "preparing-data"
    error.value = null
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = input.executionMode
    algorithmTimings.value = []

    try {
      const runStartedAt = performance.now()
      const dataStartedAt = performance.now()
      const [recommendData, userDataResponse] = await Promise.all([
        readRecommendCacheData(input.dataRegion),
        fetchUserData(input),
      ])
      dataElapsedMs.value = createElapsedMs(dataStartedAt)
      masterData.value = recommendData.masterData
      const algorithms = normalizeAlgorithms(input.algorithms)
      if (algorithms.length === 0) {
        throw new Error("at least one algorithm is required")
      }

      phase.value = "initializing"
      const shouldRunInParallel = input.executionMode === "parallel"
      const engineDataStartedAt = performance.now()
      if (shouldRunInParallel) {
        await ensureParallelRegionDataPreloaded(input.dataRegion, recommendData, algorithms.length)
      } else {
        await ensureRegionDataPreloaded(input.dataRegion, recommendData)
      }
      engineDataElapsedMs.value = createElapsedMs(engineDataStartedAt)

      const recommendStartedAt = performance.now()
      const workerInputs = algorithms.map((algorithm) => ({
        algorithm,
        request: {
          region: input.dataRegion,
          masterVersion: recommendData.masterVersion,
          musicMetasKey: recommendData.musicMetasKey,
          masterFileNames: recommendData.masterFileNames,
          options: buildDeckRecommendOptions({
            region: input.dataRegion,
            mode: input.mode,
            liveType: input.liveType,
            algorithm,
            musicId: input.musicId,
            musicDifficulty: input.difficulty,
            eventId: input.eventId,
            characterId: input.characterId,
            trainingConfig: input.trainingConfig,
            userData: userDataResponse.userData,
          }),
        },
      }))
      const handleWorkerEvent = (event: DeckRecommendWorkerEvent) => {
        if (event.type === "progress") {
          phase.value = event.phase
        }
      }
      const workerResults = shouldRunInParallel
        ? await runAlgorithmsInParallel(workerInputs, handleWorkerEvent, parallelWorkers)
        : await runAlgorithmsSequentially(workerInputs, handleWorkerEvent)

      result.value = mergeDeckRecommendResults(workerResults)
      algorithmTimings.value = workerResults.map(({ algorithm, elapsedMs }) => ({ algorithm, elapsedMs }))
      recommendElapsedMs.value = createElapsedMs(recommendStartedAt)
      elapsedMs.value = createElapsedMs(runStartedAt)
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : String(runError)
      error.value = message
      throw runError
    } finally {
      running.value = false
      phase.value = null
    }
  }

  function reset() {
    if (running.value) {
      return
    }

    phase.value = null
    error.value = null
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = null
    algorithmTimings.value = []
  }

  async function fetchUserData(input: DeckRecommendRunnerInput) {
    phase.value = "fetching-user-data"
    return fetchDeckRecommendUserData({
      toolboxUserId: userStore.userId || "",
      server: input.account?.server ?? input.dataRegion,
      gameUserId: input.account?.uid ?? "",
      mode: resolveRecommendDataMode(input.mode),
    })
  }

  async function preloadRegionData(region: SekaiRegion, isCurrent: () => boolean = () => true) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      return
    }

    const dataKey = createRecommendDataKey(
      region,
      regionState.masterFetchVersion,
      createMusicMetasKey(regionState.musicMetasUpdatedAt),
      SEKAI_DATA_RECOMMEND_MASTER_FILES,
    )
    if (preloadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = dataPreloadPromises.get(dataKey)
    if (runningPreload) {
      return runningPreload
    }

    const preloadPromise = (async () => {
      const recommendData = await readRecommendCacheData(region)
      const loadedDataKey = createRecommendDataKey(
        region,
        recommendData.masterVersion,
        recommendData.musicMetasKey,
        recommendData.masterFileNames,
      )
      if (loadedDataKey !== dataKey || !isCurrent()) {
        return
      }

      await loadRecommendDataIntoWorker(region, recommendData, dataKey, isCurrent)
    })().finally(() => {
      dataPreloadPromises.delete(dataKey)
    })

    dataPreloadPromises.set(dataKey, preloadPromise)
    return preloadPromise
  }

  async function preloadParallelEngines(count: number) {
    await ensureParallelWorkerPool(count)
  }

  async function preloadParallelRegionData(
    region: SekaiRegion,
    count: number,
    isCurrent: () => boolean = () => true,
  ) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      await ensureParallelWorkerPool(count)
      return
    }

    const recommendData = await readRecommendCacheData(region)
    await ensureParallelRegionDataPreloaded(region, recommendData, count, isCurrent)
  }

  async function ensureParallelRegionDataPreloaded(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    count: number,
    isCurrent: () => boolean = () => true,
  ) {
    await ensureParallelWorkerPool(count)
    const dataKey = createRecommendDataKey(
      region,
      recommendData.masterVersion,
      recommendData.musicMetasKey,
      recommendData.masterFileNames,
    )
    if (!isCurrent()) {
      return
    }

    await Promise.all(parallelWorkers.slice(0, normalizeParallelWorkerCount(count)).map((entry) =>
      loadRecommendDataIntoParallelWorker(entry, region, recommendData, dataKey, isCurrent),
    ))
  }

  async function ensureRegionDataPreloaded(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    isCurrent: () => boolean = () => true,
  ) {
    const dataKey = createRecommendDataKey(
      region,
      recommendData.masterVersion,
      recommendData.musicMetasKey,
      recommendData.masterFileNames,
    )
    if (preloadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = dataPreloadPromises.get(dataKey)
    if (runningPreload) {
      await runningPreload
      return
    }

    const preloadPromise = loadRecommendDataIntoWorker(region, recommendData, dataKey, isCurrent).finally(() => {
      dataPreloadPromises.delete(dataKey)
    })

    dataPreloadPromises.set(dataKey, preloadPromise)
    await preloadPromise
  }

  async function loadRecommendDataIntoWorker(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    dataKey: string,
    isCurrent: () => boolean,
  ) {
    if (!isCurrent()) {
      return
    }

    await loadDeckRecommendWorkerData({
      region,
      masterVersion: recommendData.masterVersion,
      musicMetasKey: recommendData.musicMetasKey,
      masterFileNames: recommendData.masterFileNames,
      masterData: recommendData.masterData,
      musicMetas: recommendData.musicMetas,
    })
    if (isCurrent()) {
      preloadedDataKeys.add(dataKey)
    }
  }

  async function loadRecommendDataIntoParallelWorker(
    entry: ParallelWorkerEntry,
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    dataKey: string,
    isCurrent: () => boolean,
  ) {
    if (entry.loadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = entry.dataLoadPromises.get(dataKey)
    if (runningPreload) {
      await runningPreload
      return
    }

    const preloadPromise = (async () => {
      await entry.warmPromise
      if (!isCurrent()) {
        return
      }

      await loadDataOnDedicatedWorker(entry.worker, {
        region,
        masterVersion: recommendData.masterVersion,
        musicMetasKey: recommendData.musicMetasKey,
        masterFileNames: recommendData.masterFileNames,
        masterData: recommendData.masterData,
        musicMetas: recommendData.musicMetas,
      })
      if (isCurrent()) {
        entry.loadedDataKeys.add(dataKey)
      }
    })().finally(() => {
      entry.dataLoadPromises.delete(dataKey)
    })

    entry.dataLoadPromises.set(dataKey, preloadPromise)
    await preloadPromise
  }

  async function ensureParallelWorkerPool(count: number) {
    const targetCount = normalizeParallelWorkerCount(count)
    while (parallelWorkers.length < targetCount) {
      parallelWorkers.push(createParallelWorkerEntry())
    }

    const extraWorkers = parallelWorkers.splice(targetCount)
    await Promise.allSettled(extraWorkers.map(disposeParallelWorkerEntry))
    await Promise.all(parallelWorkers.slice(0, targetCount).map((entry) => entry.warmPromise))
  }

  async function disposeParallelEngines() {
    const workers = parallelWorkers.splice(0)
    await Promise.allSettled(workers.map(disposeParallelWorkerEntry))
  }

  async function disposeEngines() {
    await Promise.allSettled([
      disposeDeckRecommendWorker(),
      disposeParallelEngines(),
    ])
  }

  return {
    running,
    phase,
    error,
    result,
    masterData,
    elapsedMs,
    dataElapsedMs,
    engineDataElapsedMs,
    recommendElapsedMs,
    resultExecutionMode,
    algorithmTimings,
    hasResult,
    preloadEngine: warmDeckRecommendWorker,
    preloadRegionData,
    preloadParallelEngines,
    preloadParallelRegionData,
    disposeEngine: disposeEngines,
    run,
    reset,
  }
}

type RecommendCacheData = {
  masterVersion: string
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData: Record<string, unknown>
  musicMetas: unknown
}

async function readRecommendCacheData(region: SekaiRegion): Promise<RecommendCacheData> {
  const sekaiDataStore = useSekaiDataStore()
  if (sekaiDataStore.regionStates[region].checkedAt == null) {
    await sekaiDataStore.loadRegionCacheState(region)
  }
  const regionState = sekaiDataStore.regionStates[region]
  if (!regionState.masterFetchVersion) {
    throw new Error("master data is not ready")
  }

  const [masterData, musicMetas] = await Promise.all([
    readSekaiMasterFiles(region, SEKAI_DATA_RECOMMEND_MASTER_FILES, regionState.masterFetchVersion),
    readSekaiMusicMetas(region),
  ])
  if (!musicMetas) {
    throw new Error("music metas are not ready")
  }

  const missingFiles = SEKAI_DATA_RECOMMEND_MASTER_FILES.filter((fileName) => masterData[fileName] == null)
  if (missingFiles.length > 0) {
    throw new Error(`master data is missing: ${missingFiles.join(", ")}`)
  }

  return {
    masterVersion: regionState.masterFetchVersion,
    musicMetasKey: createMusicMetasKey(regionState.musicMetasUpdatedAt),
    masterFileNames: [...SEKAI_DATA_RECOMMEND_MASTER_FILES],
    masterData,
    musicMetas,
  }
}

function createMusicMetasKey(updatedAt: number | null): string | null {
  return updatedAt == null ? null : String(updatedAt)
}

function createElapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt)
}

function createRecommendDataKey(
  region: SekaiRegion,
  masterVersion: string,
  musicMetasKey: string | null,
  masterFileNames: readonly string[],
): string {
  return [
    region,
    masterVersion,
    musicMetasKey ?? "unknown-music-metas",
    masterFileNames.slice().sort().join(","),
  ].join(":")
}

type AlgorithmWorkerInput = {
  algorithm: DeckRecommendAlgorithm
  request: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">
}

type AlgorithmWorkerResult = {
  algorithm: DeckRecommendAlgorithm
  result: RecommendResult
  elapsedMs: number
}

async function runAlgorithmsSequentially(
  workerInputs: readonly AlgorithmWorkerInput[],
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<AlgorithmWorkerResult[]> {
  const results: AlgorithmWorkerResult[] = []
  for (const { algorithm, request } of workerInputs) {
    const workerResult = await recommendWithSharedWorker(request, onEvent)
    results.push({
      algorithm,
      result: workerResult.result,
      elapsedMs: workerResult.elapsedMs,
    })
  }

  return results
}

function runAlgorithmsInParallel(
  workerInputs: readonly AlgorithmWorkerInput[],
  onEvent: (event: DeckRecommendWorkerEvent) => void,
  parallelWorkers: readonly ParallelWorkerEntry[],
): Promise<AlgorithmWorkerResult[]> {
  return Promise.all(workerInputs.map(async ({ algorithm, request }, index) => {
    const worker = parallelWorkers[index]
    if (!worker) {
      throw new Error("parallel recommend worker is not ready")
    }

    const workerResult = await recommendWithPooledWorker(worker, request, onEvent)
    return {
      algorithm,
      result: workerResult.result,
      elapsedMs: workerResult.elapsedMs,
    }
  }))
}

function normalizeAlgorithms(algorithms: readonly DeckRecommendAlgorithm[]): DeckRecommendAlgorithm[] {
  return [...new Set(algorithms)]
}

function recommendWithSharedWorker(
  input: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()

    const unsubscribe = subscribeDeckRecommendWorker((event) => {
      if (event.requestId !== requestId) {
        if (event.requestId === "worker" && event.type === "error") {
          unsubscribe?.()
          reject(new Error(event.message))
        }
        return
      }

      onEvent(event)
      if (event.type === "done") {
        unsubscribe?.()
        resolve({
          result: event.result,
          elapsedMs: event.elapsedMs,
        })
        return
      }

      if (event.type === "error") {
        unsubscribe?.()
        reject(new Error(event.message))
      }
    })

    postDeckRecommendWorkerRequest({
      type: "recommend",
      requestId,
      ...input,
    })
  })
}

function recommendWithPooledWorker(
  entry: ParallelWorkerEntry,
  input: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    const worker = entry.worker

    let cleanup = () => {}
    const handleMessage = (messageEvent: MessageEvent<DeckRecommendWorkerEvent>) => {
      const event = messageEvent.data
      if (event.requestId !== requestId) {
        return
      }

      onEvent(event)
      if (event.type === "done") {
        cleanup()
        resolve({
          result: event.result,
          elapsedMs: event.elapsedMs,
        })
        return
      }

      if (event.type === "error") {
        cleanup()
        reject(new Error(event.message))
      }
    }

    const handleError = (event: ErrorEvent) => {
      cleanup()
      reject(new Error(event.message || "Deck recommend worker failed"))
    }

    cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)

    entry.warmPromise
      .then(() => {
        worker.postMessage({
          type: "recommend",
          requestId,
          ...input,
        } satisfies DeckRecommendWorkerRecommendRequest)
      })
      .catch((error) => {
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      })
  })
}

type ParallelWorkerEntry = {
  worker: Worker
  warmPromise: Promise<void>
  loadedDataKeys: Set<string>
  dataLoadPromises: Map<string, Promise<void>>
}

function createParallelWorkerEntry(): ParallelWorkerEntry {
  const worker = createDeckRecommendWorker()
  return {
    worker,
    warmPromise: runDedicatedWorkerLifecycleRequest(worker, { type: "preload" }, "ready"),
    loadedDataKeys: new Set<string>(),
    dataLoadPromises: new Map<string, Promise<void>>(),
  }
}

async function disposeParallelWorkerEntry(entry: ParallelWorkerEntry): Promise<void> {
  try {
    await runDedicatedWorkerLifecycleRequest(entry.worker, { type: "dispose" }, "disposed", 1000)
  } finally {
    entry.worker.terminate()
  }
}

function loadDataOnDedicatedWorker(
  worker: Worker,
  input: Omit<DeckRecommendWorkerLoadDataRequest, "type" | "requestId">,
) {
  return runDedicatedWorkerLifecycleRequest(worker, { type: "load-data", ...input }, "data-loaded")
}

function runDedicatedWorkerLifecycleRequest(
  worker: Worker,
  request: Omit<DeckRecommendWorkerRequest, "requestId">,
  successType: Extract<DeckRecommendWorkerEvent["type"], "ready" | "data-loaded" | "disposed">,
  timeoutMs = 30000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let finished = false

    const cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
    }
    const finish = (error?: Error) => {
      if (finished) {
        return
      }

      finished = true
      cleanup()
      if (error) {
        reject(error)
        return
      }

      resolve()
    }
    const handleMessage = (messageEvent: MessageEvent<DeckRecommendWorkerEvent>) => {
      const event = messageEvent.data
      if (event.requestId !== requestId) {
        return
      }

      if (event.type === successType) {
        finish()
        return
      }

      if (event.type === "error") {
        finish(new Error(event.message))
      }
    }
    const handleError = (event: ErrorEvent) => {
      finish(new Error(event.message || "Deck recommend worker failed"))
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
    timeoutId = setTimeout(() => {
      if (successType === "disposed") {
        finish()
        return
      }

      finish(new Error(`Deck recommend worker ${request.type} timed out`))
    }, timeoutMs)
    worker.postMessage({
      ...request,
      requestId,
    } satisfies DeckRecommendWorkerRequest)
  })
}

function normalizeParallelWorkerCount(count: number): number {
  return Math.max(0, Math.floor(count))
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
