import {
  createSekaiDeckRecommend,
  type SekaiDeckRecommendWasm,
} from "haruki-sekai-deck-recommend-cpp"
import wasmUrl from "haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm?url"
import type { SekaiRegion } from "@/types"
import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerMusicRequest,
  DeckRecommendWorkerRecommendBatchRequest,
  DeckRecommendWorkerRecommendRequest,
  DeckRecommendWorkerRequest,
} from "./worker-protocol"
import { normalizeDeckRecommendWorkerError } from "./worker-error"

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope
let enginePromise: Promise<SekaiDeckRecommendWasm> | null = null
const loadedDataKeys = new Map<SekaiRegion, string>()

// The engine reads a few optional master tables that the toolbox intentionally
// does not ship (ingameNotes/ingameCombos are huge; eventHonorBonuses and the
// mysekai fixture bonus limits are niche). It degrades gracefully when they are
// absent but prints a "master data key not found" warning per key on every load,
// which floods the console. Filter only these known-optional keys so genuinely
// missing required tables still surface.
const IGNORED_MISSING_MASTER_KEYS = [
  "eventHonorBonuses",
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
// master data payload under memory pressure); report it instead of silently
// dropping the request and letting the caller wait for its timeout.
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
      const result = await loadEngineData(request, request.requestId)
      postEvent({
        type: "data-loaded",
        requestId: request.requestId,
        elapsedMs: result.elapsedMs,
        cacheHit: result.cacheHit,
      })
      return
    }

    postEvent({ type: "progress", requestId: request.requestId, phase: "initializing" })
    const engine = await loadEngineData(request, request.requestId).then((result) => result.engine)

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
  request:
    | DeckRecommendWorkerLoadDataRequest
    | DeckRecommendWorkerRecommendRequest
    | DeckRecommendWorkerRecommendBatchRequest
    | DeckRecommendWorkerMusicRequest,
  requestId: string,
): Promise<{ engine: SekaiDeckRecommendWasm; elapsedMs: number; cacheHit: boolean }> {
  const startedAt = performance.now()
  const engine = await getEngine()
  const dataKey = createDataKey(request)
  const cacheHit = loadedDataKeys.get(request.region) === dataKey
  if (!cacheHit) {
    if (!request.masterData || request.musicMetas == null) {
      throw new Error("recommendation data is not preloaded")
    }

    postEvent({ type: "progress", requestId, phase: "loading-data" })
    engine.loadMasterData(request.region, request.masterData)
    engine.loadMusicMetas(request.region, request.musicMetas)
    loadedDataKeys.set(request.region, dataKey)
  }

  return {
    engine,
    elapsedMs: Math.round(performance.now() - startedAt),
    cacheHit,
  }
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

function createDataKey(
  request:
    | DeckRecommendWorkerLoadDataRequest
    | DeckRecommendWorkerRecommendRequest
    | DeckRecommendWorkerRecommendBatchRequest
    | DeckRecommendWorkerMusicRequest,
) {
  return [
    request.masterVersion,
    request.musicMetasKey ?? "unknown-music-metas",
    request.masterFileNames.slice().sort((left, right) => left.localeCompare(right)).join(","),
  ].join(":")
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
