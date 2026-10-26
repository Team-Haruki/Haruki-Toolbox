import {
  createSekaiDeckRecommend,
  type SekaiDeckRecommendWasm,
} from "haruki-sekai-deck-recommend-cpp"
import wasmUrl from "haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm?url"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile, readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { SEKAI_DATA_RECOMMEND_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import {
  createDeckRecommendDataKey,
  type DeckRecommendWorkerDataSource,
  type DeckRecommendWorkerEvent,
  type DeckRecommendWorkerRequest,
} from "./worker-protocol"
import { normalizeDeckRecommendWorkerError } from "./worker-error"
import type { DedicatedWorkerScope } from "@/lib/worker-scope"

const workerScope = globalThis as unknown as DedicatedWorkerScope<DeckRecommendWorkerRequest, DeckRecommendWorkerEvent>
let enginePromise: Promise<SekaiDeckRecommendWasm> | null = null
const loadedDataKeys = new Map<SekaiRegion, string>()
const dataLoads = new Map<string, Promise<void>>()

// The engine reads a few optional master tables that the toolbox intentionally
// does not ship (ingameNotes/ingameCombos are huge; the mysekai fixture bonus
// limits are niche). It degrades gracefully when they are
// absent but prints a "master data key not found" warning per key on every load,
// which floods the console. Filter only these known-optional keys so genuinely
// missing required tables still surface.
const IGNORED_MISSING_MASTER_KEYS = [
  "eventMysekaiFixtureGameCharacterPerformanceBonusLimits",
  "ingameCombos",
  "ingameNotes",
]

function isIgnoredEngineWarning(text: string): boolean {
  return text.includes("master data key not found")
    && IGNORED_MISSING_MASTER_KEYS.some((key) => text.includes(key))
}

workerScope.onmessage = (event: MessageEvent<DeckRecommendWorkerRequest>) => {
  void handleRequest(event.data)
}

// Fires when an incoming request cannot be deserialized (for example a large
// inline master data payload under memory pressure); report it instead of
// silently dropping the request and letting the caller wait for its timeout.
workerScope.onmessageerror = () => {
  postEvent({
    type: "error",
    requestId: "worker",
    message: "deck recommend worker request could not be deserialized",
  })
}

async function handleRequest(request: DeckRecommendWorkerRequest) {
  try {
    if (request.type === "preload") {
      await preloadEngine(request.requestId)
      return
    }

    if (request.type === "dispose") {
      await disposeEngine()
      postEvent({ type: "disposed", requestId: request.requestId })
      return
    }

    if (request.type === "load-data") {
      const result = await loadEngineData(request.data, request.requestId)
      postEvent({
        type: "data-loaded",
        requestId: request.requestId,
        elapsedMs: result.elapsedMs,
        cacheHit: result.cacheHit,
      })
      return
    }

    postEvent({ type: "progress", requestId: request.requestId, phase: "initializing" })
    const engine = await loadEngineData(request.data, request.requestId).then((result) => result.engine)

    postEvent({ type: "progress", requestId: request.requestId, phase: "recommending" })
    const startedAt = performance.now()
    if (request.type === "recommend-music") {
      const results = engine.recommendMusic(request.options, request.deck)
      postEvent({
        type: "music-done",
        requestId: request.requestId,
        results,
        elapsedMs: Math.round(performance.now() - startedAt),
      })
      return
    }

    if (request.type === "recommend-batch") {
      const results = engine.recommendBatch(request.optionsList)
      postEvent({
        type: "batch-done",
        requestId: request.requestId,
        results,
        elapsedMs: Math.round(performance.now() - startedAt),
      })
      return
    }

    const result = engine.recommend(request.options)
    const costMs = typeof result.cost_ms === "number" ? Math.round(result.cost_ms) : null
    postEvent({
      type: "done",
      requestId: request.requestId,
      result,
      elapsedMs: costMs ?? Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    postEvent({
      type: "error",
      requestId: request.requestId,
      message: normalizeDeckRecommendWorkerError(error),
    })
  }
}

async function loadEngineData(
  source: DeckRecommendWorkerDataSource,
  requestId: string,
): Promise<{ engine: SekaiDeckRecommendWasm; elapsedMs: number; cacheHit: boolean }> {
  const startedAt = performance.now()
  const engine = await getEngine()
  const dataKey = createDeckRecommendDataKey(source)
  const cacheHit = loadedDataKeys.get(source.region) === dataKey
  if (!cacheHit) {
    postEvent({ type: "progress", requestId, phase: "loading-data" })
    // Two requests racing for the same data (a preload and the run that
    // followed it) must parse and load the tables only once.
    let pending = dataLoads.get(dataKey)
    if (!pending) {
      pending = loadDataIntoEngine(engine, source, dataKey).finally(() => {
        dataLoads.delete(dataKey)
      })
      dataLoads.set(dataKey, pending)
    }
    await pending
  }

  return {
    engine,
    elapsedMs: Math.round(performance.now() - startedAt),
    cacheHit,
  }
}

async function loadDataIntoEngine(engine: SekaiDeckRecommendWasm, source: DeckRecommendWorkerDataSource, dataKey: string) {
  const { masterData, musicMetas } = await resolveWorkerData(source)
  engine.loadMasterData(source.region, masterData)
  engine.loadMusicMetas(source.region, musicMetas)
  loadedDataKeys.set(source.region, dataKey)
  // The parsed tables are only needed until the engine has copied them into
  // its own heap; nothing here keeps a reference afterwards.
}

async function resolveWorkerData(
  source: DeckRecommendWorkerDataSource,
): Promise<{ masterData: Record<string, unknown>; musicMetas: string | object }> {
  if (source.masterData && source.musicMetas != null) {
    return { masterData: source.masterData, musicMetas: source.musicMetas as string | object }
  }

  const [masterData, musicMetas] = await Promise.all([
    readSekaiMasterFiles(source.region, source.masterFileNames, source.masterVersion),
    readSekaiMusicMetas(source.region),
  ])
  if (musicMetas == null || (typeof musicMetas !== "object" && typeof musicMetas !== "string")) {
    throw new Error("music metas are not ready")
  }
  const missingFiles = SEKAI_DATA_RECOMMEND_MASTER_FILES.filter((fileName) => masterData[fileName] == null)
  if (missingFiles.length > 0) {
    throw new Error(`master data is missing: ${missingFiles.join(", ")}`)
  }
  if (source.honorRegion !== source.region) {
    const honors = await readSekaiMasterFile(source.honorRegion, "honors", source.honorMasterVersion ?? undefined)
    if (!honors) {
      throw new Error("account server honors master data is not ready")
    }
    masterData.honors = honors
  }
  return { masterData, musicMetas }
}

async function preloadEngine(requestId: string) {
  postEvent({ type: "progress", requestId, phase: "initializing" })
  const startedAt = performance.now()
  await getEngine()
  postEvent({
    type: "ready",
    requestId,
    elapsedMs: Math.round(performance.now() - startedAt),
  })
}

function getEngine() {
  enginePromise ??= createSekaiDeckRecommend({
    wasmUrl,
    moduleOptions: {
      printErr: (text: string) => {
        if (isIgnoredEngineWarning(text)) {
          return
        }
        console.warn(text)
      },
    },
  })
  return enginePromise
}

async function disposeEngine() {
  const currentEnginePromise = enginePromise
  enginePromise = null
  loadedDataKeys.clear()
  if (!currentEnginePromise) {
    return
  }

  const engine = await currentEnginePromise.catch(() => null)
  engine?.dispose()
}

function postEvent(event: DeckRecommendWorkerEvent) {
  workerScope.postMessage(event)
}
