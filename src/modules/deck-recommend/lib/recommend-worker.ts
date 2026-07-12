import {
  createSekaiDeckRecommend,
  type SekaiDeckRecommendWasm,
} from "haruki-sekai-deck-recommend-cpp"
import wasmUrl from "haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm?url"
import type { SekaiRegion } from "@/types"
import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerRecommendBatchRequest,
  DeckRecommendWorkerRecommendRequest,
  DeckRecommendWorkerRequest,
} from "./worker-protocol"

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope
let enginePromise: Promise<SekaiDeckRecommendWasm> | null = null
const loadedDataKeys = new Map<SekaiRegion, string>()

workerScope.onmessage = (event: MessageEvent<DeckRecommendWorkerRequest>) => {
  void handleRequest(event.data)
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
      message: normalizeWorkerErrorMessage(error),
    })
  }
}

async function loadEngineData(
  request: DeckRecommendWorkerLoadDataRequest | DeckRecommendWorkerRecommendRequest | DeckRecommendWorkerRecommendBatchRequest,
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
  enginePromise ??= createSekaiDeckRecommend({ wasmUrl })
  return enginePromise
}

function createDataKey(
  request: DeckRecommendWorkerLoadDataRequest | DeckRecommendWorkerRecommendRequest | DeckRecommendWorkerRecommendBatchRequest,
) {
  return [
    request.masterVersion,
    request.musicMetasKey ?? "unknown-music-metas",
    request.masterFileNames.slice().sort().join(","),
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

function normalizeWorkerErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === "object" && error !== null) {
    const message = "message" in error && typeof error.message === "string" ? error.message : ""
    const name = error.constructor?.name
    if (message) {
      return name && name !== "Object" ? `${name}: ${message}` : message
    }
    if (name === "Exception") {
      return "wasm engine failed to execute recommendation"
    }
    if (name && name !== "Object") {
      return name
    }
  }

  return String(error)
}
