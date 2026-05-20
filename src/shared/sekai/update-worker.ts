import {
  normalizeSekaiMasterFileName,
  normalizeSekaiMasterVersionInfo,
  resolveSekaiMasterFetchVersion,
  resolveSekaiMasterFileUrl,
  resolveSekaiMasterRepo,
  resolveSekaiMasterVersionUrl,
  resolveSekaiMusicMetasUrl,
} from "./data-sources"
import {
  clearSekaiRegionCache,
  readSekaiRegionCacheMeta,
  writeSekaiMasterFiles,
  writeSekaiMusicMetas,
  writeSekaiRegionCacheMeta,
} from "./cache"
import {
  SEKAI_DATA_DEFAULT_MASTER_FILES,
  type SekaiDataWorkerEvent,
  type SekaiDataWorkerRequest,
  type SekaiDataUpdatePhase,
} from "./worker-protocol"

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope

workerScope.onmessage = (event: MessageEvent<SekaiDataWorkerRequest>) => {
  void handleRequest(event.data)
}

async function handleRequest(request: SekaiDataWorkerRequest): Promise<void> {
  try {
    if (request.type === "clear-region") {
      postProgress(request.requestId, request.region, "clearing", 5)
      await clearSekaiRegionCache(request.region)
      postEvent({ type: "cleared", requestId: request.requestId, region: request.region })
      return
    }

    await ensureRegion(request)
  } catch (error) {
    postEvent({
      type: "error",
      requestId: request.requestId,
      region: request.region,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

async function ensureRegion(request: Extract<SekaiDataWorkerRequest, { type: "ensure-region" }>) {
  const region = request.region
  const files = normalizeFileList(request.files)

  postProgress(request.requestId, region, "checking", 5)
  const versionInfo = normalizeSekaiMasterVersionInfo(
    await fetchJson(resolveSekaiMasterVersionUrl(region)),
  )
  const fetchVersion = resolveSekaiMasterFetchVersion(region, versionInfo)
  const displayVersion = versionInfo.dataVersion
  const cachedMeta = await readSekaiRegionCacheMeta(region)
  const cacheHit = !request.force
    && cachedMeta?.master?.fetchVersion === fetchVersion
    && files.every((fileName) => cachedMeta.master?.files.includes(fileName))
    && cachedMeta.musicMetas != null

  if (cacheHit) {
    postEvent({
      type: "done",
      requestId: request.requestId,
      region,
      cacheHit: true,
      displayVersion: cachedMeta.master?.displayVersion ?? displayVersion,
      fetchVersion,
      files,
    })
    return
  }

  const masterFiles: Record<string, unknown> = {}
  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index]
    postProgress(request.requestId, region, "fetching-master", 10 + Math.round((index / files.length) * 55), {
      fileName,
      current: index + 1,
      total: files.length,
    })
    masterFiles[fileName] = await fetchJson(resolveSekaiMasterFileUrl(region, fileName, versionInfo))
  }

  postProgress(request.requestId, region, "fetching-music-metas", 72)
  const musicMetasUrl = resolveSekaiMusicMetasUrl(region)
  const musicMetas = await fetchJson(musicMetasUrl)

  postProgress(request.requestId, region, "writing-cache", 88)
  await writeSekaiMasterFiles(region, fetchVersion, masterFiles)
  await writeSekaiMusicMetas(region, musicMetas, musicMetasUrl, displayVersion)
  await writeSekaiRegionCacheMeta({
    region,
    master: {
      repo: resolveSekaiMasterRepo(region),
      dataVersion: versionInfo.dataVersion,
      displayVersion,
      fetchVersion,
      cdnVersion: versionInfo.cdnVersion,
      files,
      updatedAt: Date.now(),
    },
    musicMetas: {
      url: musicMetasUrl,
      pairedMasterDisplayVersion: displayVersion,
      updatedAt: Date.now(),
    },
  })

  postEvent({
    type: "done",
    requestId: request.requestId,
    region,
    cacheHit: false,
    displayVersion,
    fetchVersion,
    files,
  })
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-cache" })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.json()
}

function normalizeFileList(files: string[] | undefined): string[] {
  const rawFiles = files?.length ? files : [...SEKAI_DATA_DEFAULT_MASTER_FILES]
  return [...new Set(rawFiles.map(normalizeSekaiMasterFileName).filter(Boolean))]
}

function postProgress(
  requestId: string,
  region: SekaiDataWorkerRequest["region"],
  phase: SekaiDataUpdatePhase,
  progress: number,
  details: Partial<Extract<SekaiDataWorkerEvent, { type: "progress" }>> = {},
) {
  postEvent({
    type: "progress",
    requestId,
    region,
    phase,
    progress,
    ...details,
  })
}

function postEvent(event: SekaiDataWorkerEvent) {
  workerScope.postMessage(event)
}
