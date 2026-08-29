import type { SekaiRegion } from "@/types"
import { createRequestId } from "@/lib/request-id"
import type { SekaiDataWorkerEvent, SekaiDataWorkerRequest } from "./worker-protocol"

type SekaiDataWorkerListener = (event: SekaiDataWorkerEvent) => void

const listeners = new Set<SekaiDataWorkerListener>()
const pendingRequests = new Map<string, SekaiRegion>()
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
  pendingRequests.set(requestId, workerRequest.region)
  try {
    ensureWorker().postMessage(workerRequest)
  } catch (error) {
    pendingRequests.delete(requestId)
    throw error
  }
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
    if (event.data.type === "done" || event.data.type === "cleared" || event.data.type === "error") {
      pendingRequests.delete(event.data.requestId)
    }
    for (const listener of listeners) {
      listener(event.data)
    }
  })
  worker.addEventListener("error", (event) => {
    const failedRequests = [...pendingRequests]
    pendingRequests.clear()
    worker?.terminate()
    worker = null

    for (const [requestId, region] of failedRequests) {
      const errorEvent: SekaiDataWorkerEvent = {
        type: "error",
        requestId,
        region,
        message: event.message || "Master data worker failed",
      }
      for (const listener of listeners) {
        listener(errorEvent)
      }
    }
  })
  return worker
}
