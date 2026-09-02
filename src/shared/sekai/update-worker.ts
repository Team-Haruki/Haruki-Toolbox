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
  SEKAI_DATA_OPTIONAL_MASTER_FILES,
  type SekaiDataWorkerEvent,
  type SekaiDataWorkerRequest,
  type SekaiDataUpdatePhase,
} from "./worker-protocol"
import type { SekaiMasterCacheState, SekaiMusicMetasCacheState } from "./types"

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope
const OPTIONAL_MASTER_FILE_SET = new Set<string>(SEKAI_DATA_OPTIONAL_MASTER_FILES)
const MASTER_FILE_FETCH_CONCURRENCY = 3

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
  const optionalFiles = new Set<string>([
    ...OPTIONAL_MASTER_FILE_SET,
    ...(request.optionalFiles ?? []).map(normalizeSekaiMasterFileName),
  ])
  const includeMusicMetas = request.musicMetas !== false

  postProgress(request.requestId, region, "checking", 5)
  const versionInfo = normalizeSekaiMasterVersionInfo(
    await fetchJson(resolveSekaiMasterVersionUrl(region)),
  )
  const fetchVersion = resolveSekaiMasterFetchVersion(region, versionInfo)
  const displayVersion = versionInfo.dataVersion
  const cachedMeta = await readSekaiRegionCacheMeta(region)
  const musicMetasBaseUrl = resolveSekaiMusicMetasUrl(region)
  const musicMetasRemoteState = includeMusicMetas
    ? await fetchMusicMetasRemoteState(musicMetasBaseUrl)
    : null
  const cachedMasterFiles = cachedMeta?.master?.fetchVersion === fetchVersion
    ? cachedMeta.master.files
    : []
  const masterCacheHit = !request.force
    && cachedMeta?.master?.fetchVersion === fetchVersion
    && files.every((fileName) => cachedMeta.master?.files.includes(fileName))
  const musicMetasCacheHit = musicMetasRemoteState == null
    || musicMetasCacheMatches(cachedMeta?.musicMetas, musicMetasBaseUrl, musicMetasRemoteState)
  const cacheHit = masterCacheHit
    && musicMetasCacheHit

  if (cacheHit) {
    postEvent({
      type: "done",
      requestId: request.requestId,
      region,
      cacheHit: true,
      dataVersion: versionInfo.dataVersion,
      cdnVersion: versionInfo.cdnVersion,
      displayVersion: cachedMeta.master?.displayVersion ?? displayVersion,
      fetchVersion,
      files: cachedMeta.master?.files ?? files,
      musicMetasUpdatedAt: cachedMeta.musicMetas?.updatedAt ?? null,
      musicMetasChecked: includeMusicMetas,
      updatedAt: resolveCacheUpdatedAt(cachedMeta.master ?? null, cachedMeta.musicMetas ?? null),
    })
    return
  }

  const filesToFetch = request.force
    ? files
    : files.filter((fileName) => !cachedMasterFiles.includes(fileName))

  // Optional files that failed transiently are neither written nor listed
  // as cached, so the next ensure requests them again.
  let skippedFiles: string[] = []
  if (!masterCacheHit) {
    const masterFiles = await fetchMasterFilesConcurrently({
      filesToFetch,
      optionalFiles,
      region,
      requestId: request.requestId,
      versionInfo,
    })
    skippedFiles = filesToFetch.filter((fileName) => !(fileName in masterFiles))

    if (Object.keys(masterFiles).length > 0) {
      await writeSekaiMasterFiles(region, fetchVersion, masterFiles)
    }
  }

  let musicMetas: unknown = null
  if (musicMetasRemoteState != null && !musicMetasCacheHit) {
    postProgress(request.requestId, region, "fetching-music-metas", 72)
    musicMetas = await fetchJson(resolveSekaiMusicMetasUrl(region, musicMetasRemoteState.cacheKey ?? Date.now()))
  }

  postProgress(request.requestId, region, "writing-cache", 88)
  const now = Date.now()
  const nextMasterMeta = resolveNextMasterMeta({
    cachedMaster: cachedMeta?.master ?? null,
    displayVersion,
    fetchVersion,
    files: files.filter((fileName) => !skippedFiles.includes(fileName)),
    filesToFetch,
    region,
    versionInfo,
    now,
  })
  const nextMusicMetasMeta = musicMetasRemoteState == null || (musicMetasCacheHit && cachedMeta?.musicMetas)
    ? cachedMeta?.musicMetas ?? null
    : {
        url: musicMetasBaseUrl,
        pairedMasterDisplayVersion: displayVersion,
        etag: musicMetasRemoteState.etag,
        lastModified: musicMetasRemoteState.lastModified,
        contentLength: musicMetasRemoteState.contentLength,
        updatedAt: now,
      }

  if (musicMetas != null && musicMetasRemoteState != null) {
    await writeSekaiMusicMetas(region, musicMetas, musicMetasBaseUrl, displayVersion, musicMetasRemoteState)
  }
  await writeSekaiRegionCacheMeta({
    region,
    master: nextMasterMeta,
    musicMetas: nextMusicMetasMeta,
  })

  postEvent({
    type: "done",
    requestId: request.requestId,
    region,
    cacheHit: false,
    dataVersion: versionInfo.dataVersion,
    cdnVersion: versionInfo.cdnVersion,
    displayVersion,
    fetchVersion,
    files: nextMasterMeta.files,
    musicMetasUpdatedAt: nextMusicMetasMeta?.updatedAt ?? null,
    musicMetasChecked: includeMusicMetas,
    updatedAt: resolveCacheUpdatedAt(nextMasterMeta, nextMusicMetasMeta),
  })
}

// Transient network failures ("Failed to fetch") and gateway hiccups are
// common on flaky CDN paths; retry briefly before surfacing an error. The
// master CDN also sits behind a WAF that answers bursts with a transient 403
// or an HTML challenge page (HTTP 200, text/html) — both clear on a paced
// retry, so they are treated as retryable rather than as hard failures.
const FETCH_RETRY_DELAYS_MS = [800, 1800, 3500]

/** ±30 % jitter so parallel file workers do not re-burst in lockstep. */
function jitter(delayMs: number): number {
  return Math.round(delayMs * (0.7 + Math.random() * 0.6))
}

function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 403
}

function isHtmlChallengeResponse(response: Response): boolean {
  if (!response.ok) {
    return false
  }
  const contentType = response.headers.get("content-type") ?? ""
  return /text\/html/i.test(contentType)
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt <= FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, jitter(FETCH_RETRY_DELAYS_MS[attempt - 1])))
    }
    try {
      const response = await fetch(url, init)
      if (isTransientStatus(response.status)) {
        lastError = new Error(`Failed to fetch ${url}: ${response.status}`)
        continue
      }
      if (isHtmlChallengeResponse(response)) {
        lastError = new Error(`Unexpected HTML response from ${url}`)
        continue
      }
      return response
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetchWithRetry(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.json()
}

/** Marker for an optional file that failed transiently: not persisted, retried next ensure. */
const SKIP_FILE = Symbol("skip-file")

async function fetchMasterFileJson(
  url: string,
  fileName: string,
  optionalFiles: ReadonlySet<string> = OPTIONAL_MASTER_FILE_SET,
): Promise<unknown | typeof SKIP_FILE> {
  const normalizedFileName = normalizeSekaiMasterFileName(fileName)
  const isOptionalFile = optionalFiles.has(normalizedFileName)
  let response: Response
  try {
    response = await fetchWithRetry(url, { cache: "no-store" })
  } catch (error) {
    // A transient failure must not be persisted as "this region has no such
    // file" for the whole master version; leave it out so the next ensure
    // fetches it again.
    if (isOptionalFile) {
      return SKIP_FILE
    }
    throw error
  }

  if (response.status === 404 && isOptionalFile) {
    return []
  }
  if (!response.ok) {
    if (isOptionalFile) {
      return SKIP_FILE
    }
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.json()
}

async function fetchMasterFilesConcurrently(input: {
  filesToFetch: string[]
  optionalFiles: ReadonlySet<string>
  region: SekaiDataWorkerRequest["region"]
  requestId: string
  versionInfo: ReturnType<typeof normalizeSekaiMasterVersionInfo>
}): Promise<Record<string, unknown>> {
  const { filesToFetch, optionalFiles, region, requestId, versionInfo } = input
  const masterFiles: Record<string, unknown> = {}
  let nextIndex = 0
  let completed = 0
  const total = filesToFetch.length
  const workerCount = Math.min(MASTER_FILE_FETCH_CONCURRENCY, total)

  if (total === 0) {
    return masterFiles
  }

  async function fetchNextFile() {
    while (nextIndex < total) {
      const index = nextIndex
      nextIndex += 1
      const fileName = filesToFetch[index]
      postProgress(requestId, region, "fetching-master", 10 + Math.round((completed / total) * 55), {
        fileName,
        current: completed + 1,
        total,
      })
      const data = await fetchMasterFileJson(
        resolveSekaiMasterFileUrl(region, fileName, versionInfo),
        fileName,
        optionalFiles,
      )
      if (data !== SKIP_FILE) {
        masterFiles[fileName] = data
      }
      completed += 1
      postProgress(requestId, region, "fetching-master", 10 + Math.round((completed / total) * 55), {
        fileName,
        current: completed,
        total,
      })
    }
  }

  await Promise.all(Array.from({ length: workerCount }, fetchNextFile))
  return masterFiles
}

type MusicMetasRemoteState = {
  etag: string | null
  lastModified: string | null
  contentLength: string | null
  cacheKey: string | null
}

async function fetchMusicMetasRemoteState(baseUrl: string): Promise<MusicMetasRemoteState> {
  const response = await fetchWithRetry(resolveMusicMetasProbeUrl(baseUrl), {
    method: "HEAD",
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`Failed to check ${baseUrl}: ${response.status}`)
  }

  const etag = response.headers.get("etag")
  const lastModified = response.headers.get("last-modified")
  const contentLength = response.headers.get("content-length")
  return {
    etag,
    lastModified,
    contentLength,
    cacheKey: etag ?? lastModified ?? contentLength,
  }
}

function musicMetasCacheMatches(
  cachedMeta: SekaiMusicMetasCacheState | null | undefined,
  url: string,
  remoteState: MusicMetasRemoteState,
): boolean {
  if (!cachedMeta || cachedMeta.url !== url) {
    return false
  }

  const checks: Array<["etag" | "lastModified" | "contentLength", string | null]> = [
    ["etag", remoteState.etag],
    ["lastModified", remoteState.lastModified],
    ["contentLength", remoteState.contentLength],
  ]

  return checks.some(([key, remoteValue]) => Boolean(remoteValue) && cachedMeta[key] === remoteValue)
}

function resolveMusicMetasProbeUrl(baseUrl: string): string {
  const separator = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${separator}t=${Date.now()}`
}

function normalizeFileList(files: string[] | undefined): string[] {
  const rawFiles = files?.length ? files : [...SEKAI_DATA_DEFAULT_MASTER_FILES]
  return [...new Set(rawFiles.map(normalizeSekaiMasterFileName).filter(Boolean))]
}

function resolveNextMasterMeta(input: {
  cachedMaster: SekaiMasterCacheState | null
  displayVersion: string
  fetchVersion: string
  files: string[]
  filesToFetch: string[]
  region: SekaiDataWorkerRequest["region"]
  versionInfo: ReturnType<typeof normalizeSekaiMasterVersionInfo>
  now: number
}): SekaiMasterCacheState {
  const {
    cachedMaster,
    displayVersion,
    fetchVersion,
    files,
    filesToFetch,
    region,
    versionInfo,
    now,
  } = input
  if (cachedMaster?.fetchVersion === fetchVersion) {
    return {
      ...cachedMaster,
      repo: resolveSekaiMasterRepo(region),
      dataVersion: versionInfo.dataVersion,
      displayVersion,
      fetchVersion,
      cdnVersion: versionInfo.cdnVersion,
      files: mergeFileLists(cachedMaster.files, files),
      updatedAt: filesToFetch.length > 0 ? now : cachedMaster.updatedAt,
    }
  }

  return {
    repo: resolveSekaiMasterRepo(region),
    dataVersion: versionInfo.dataVersion,
    displayVersion,
    fetchVersion,
    cdnVersion: versionInfo.cdnVersion,
    files,
    updatedAt: now,
  }
}

function mergeFileLists(first: readonly string[], second: readonly string[]): string[] {
  return [...new Set([...first, ...second].map(normalizeSekaiMasterFileName).filter(Boolean))]
}

function resolveCacheUpdatedAt(
  master: SekaiMasterCacheState | null,
  musicMetas: SekaiMusicMetasCacheState | null,
): number | null {
  const updatedAt = Math.max(master?.updatedAt ?? 0, musicMetas?.updatedAt ?? 0)
  return updatedAt > 0 ? updatedAt : null
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
