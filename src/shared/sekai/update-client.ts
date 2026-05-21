import type { SekaiRegion } from "@/types"
import type { SekaiDataWorkerEvent, SekaiDataWorkerRequest } from "./worker-protocol"

type SekaiDataWorkerListener = (event: SekaiDataWorkerEvent) => void

const listeners = new Set<SekaiDataWorkerListener>()
let worker: Worker | null = null

export function subscribeSekaiDataWorker(listener: SekaiDataWorkerListener): () => void {
  listeners.add(listener)
  ensureWorker()
  return () => {
    listeners.delete(listener)
  }
}

export function postSekaiDataWorkerRequest(
  request: Omit<SekaiDataWorkerRequest, "requestId"> & { requestId?: string },
): string {
  const requestId = request.requestId ?? createRequestId()
  const workerRequest = { ...request, requestId } as SekaiDataWorkerRequest
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

  worker = new Worker(new URL("./update-worker.ts", import.meta.url), { type: "module" })
  worker.addEventListener("message", (event: MessageEvent<SekaiDataWorkerEvent>) => {
    for (const listener of listeners) {
      listener(event.data)
    }
  })
  worker.addEventListener("error", (event) => {
    const errorEvent: SekaiDataWorkerEvent = {
      type: "error",
      requestId: "worker",
      region: "jp" satisfies SekaiRegion,
      message: event.message || "Master data worker failed",
    }
    for (const listener of listeners) {
      listener(errorEvent)
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
