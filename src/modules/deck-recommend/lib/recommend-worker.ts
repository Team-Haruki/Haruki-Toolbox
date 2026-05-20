import {
  createSekaiDeckRecommend,
  type SekaiDeckRecommendWasm,
} from "haruki-sekai-deck-recommend-cpp"
import wasmUrl from "haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm?url"
import type { SekaiRegion } from "@/types"
import type { DeckRecommendWorkerEvent, DeckRecommendWorkerRequest } from "./worker-protocol"

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope
let enginePromise: Promise<SekaiDeckRecommendWasm> | null = null
const loadedDataKeys = new Map<SekaiRegion, string>()

workerScope.onmessage = (event: MessageEvent<DeckRecommendWorkerRequest>) => {
  void handleRequest(event.data)
}

async function handleRequest(request: DeckRecommendWorkerRequest) {
  try {
    if (request.type !== "recommend") {
      return
    }

    postEvent({ type: "progress", requestId: request.requestId, phase: "initializing" })
    const engine = await getEngine()
    const dataKey = `${request.masterVersion}:${Object.keys(request.masterData).sort().join(",")}`
    if (loadedDataKeys.get(request.region) !== dataKey) {
      postEvent({ type: "progress", requestId: request.requestId, phase: "loading-data" })
      engine.loadMasterData(request.region, request.masterData)
      engine.loadMusicMetas(request.region, request.musicMetas)
      loadedDataKeys.set(request.region, dataKey)
    }

    postEvent({ type: "progress", requestId: request.requestId, phase: "recommending" })
    const startedAt = performance.now()
    const result = engine.recommend(request.options)
    postEvent({
      type: "done",
      requestId: request.requestId,
      result,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    postEvent({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

function getEngine() {
  enginePromise ??= createSekaiDeckRecommend({ wasmUrl })
  return enginePromise
}

function postEvent(event: DeckRecommendWorkerEvent) {
  workerScope.postMessage(event)
}
