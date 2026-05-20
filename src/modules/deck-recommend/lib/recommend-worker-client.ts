import type { DeckRecommendWorkerEvent, DeckRecommendWorkerRequest } from "./worker-protocol"

type Listener = (event: DeckRecommendWorkerEvent) => void

const listeners = new Set<Listener>()
let worker: Worker | null = null

export function subscribeDeckRecommendWorker(listener: Listener): () => void {
  listeners.add(listener)
  ensureWorker()
  return () => {
    listeners.delete(listener)
  }
}

export function postDeckRecommendWorkerRequest(
  request: Omit<DeckRecommendWorkerRequest, "requestId"> & { requestId?: string },
): string {
  const requestId = request.requestId ?? createRequestId()
  const workerRequest = { ...request, requestId } as DeckRecommendWorkerRequest
  ensureWorker().postMessage(workerRequest)
  return requestId
}

function ensureWorker(): Worker {
  if (typeof Worker === "undefined") {
    throw new Error("Web Worker is unavailable")
  }

  if (worker) {
    return worker
  }

  worker = new Worker(new URL("./recommend-worker.ts", import.meta.url), { type: "module" })
  worker.addEventListener("message", (event: MessageEvent<DeckRecommendWorkerEvent>) => {
    for (const listener of listeners) {
      listener(event.data)
    }
  })
  worker.addEventListener("error", (event) => {
    for (const listener of listeners) {
      listener({
        type: "error",
        requestId: "worker",
        message: event.message || "Deck recommend worker failed",
      })
    }
  })
  return worker
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
