import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerRequest,
  DeckRecommendWorkerRequestWithoutId,
} from "./worker-protocol"

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
  request: DeckRecommendWorkerRequestWithoutId & { requestId?: string },
): string {
  const requestId = request.requestId ?? createRequestId()
  const workerRequest = { ...request, requestId } as DeckRecommendWorkerRequest
  ensureWorker().postMessage(workerRequest)
  return requestId
}

export function warmDeckRecommendWorker(): Promise<void> {
  return runLifecycleRequest("preload")
}

export function loadDeckRecommendWorkerData(
  input: Omit<DeckRecommendWorkerLoadDataRequest, "type" | "requestId">,
  onProgress?: (phase: Extract<DeckRecommendWorkerEvent, { type: "progress" }>["phase"]) => void,
): Promise<void> {
  return runLifecycleRequest("load-data", input, onProgress)
}

export async function disposeDeckRecommendWorker(): Promise<void> {
  const current = worker
  if (!current) {
    return
  }

  // Detach the shared worker before anything async happens: requests issued
  // from now on must get a fresh worker instead of posting to a dying one.
  worker = null
  // Requests already posted to the old worker would otherwise wait silently
  // until their timeout once it is terminated; fail them immediately instead.
  const detachedListeners = [...listeners]
  for (const listener of detachedListeners) {
    listener({
      type: "error",
      requestId: "worker",
      message: "deck recommend worker disposed",
    })
  }

  try {
    await requestDisposeOnWorker(current)
  } finally {
    current.terminate()
  }
}

function requestDisposeOnWorker(target: Worker): Promise<void> {
  return new Promise((resolve) => {
    const requestId = createRequestId()
    const finish = () => {
      clearTimeout(timeoutId)
      target.removeEventListener("message", handleMessage)
      resolve()
    }
    const handleMessage = (event: MessageEvent<DeckRecommendWorkerEvent>) => {
      if (event.data.type === "disposed" && event.data.requestId === requestId) {
        finish()
      }
    }
    const timeoutId = setTimeout(finish, 1000)
    target.addEventListener("message", handleMessage)
    try {
      target.postMessage({ type: "dispose", requestId })
    } catch {
      finish()
    }
  })
}

export function createDeckRecommendWorker(): Worker {
  if (typeof Worker === "undefined") {
    throw new Error("Web Worker is unavailable")
  }

  return new Worker(new URL("./recommend-worker.ts", import.meta.url), { type: "module" })
}

function ensureWorker(): Worker {
  if (typeof Worker === "undefined") {
    throw new Error("Web Worker is unavailable")
  }

  if (worker) {
    return worker
  }

  worker = createDeckRecommendWorker()
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
  // Fires when an event from the worker cannot be deserialized (for example
  // under memory pressure); without this the request would hang silently.
  worker.addEventListener("messageerror", () => {
    for (const listener of listeners) {
      listener({
        type: "error",
        requestId: "worker",
        message: "Deck recommend worker message could not be deserialized",
      })
    }
  })
  return worker
}

function runLifecycleRequest(
  type: "preload" | "load-data",
  input?: Omit<DeckRecommendWorkerLoadDataRequest, "type" | "requestId">,
  onProgress?: (phase: Extract<DeckRecommendWorkerEvent, { type: "progress" }>["phase"]) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    // Loading master data into the engine parses tens of MB inside the worker
    // and can far exceed 30s on a cold start or slower machines.
    const timeoutMs = type === "load-data" ? 180000 : 60000
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let unsubscribe: () => void = () => {}
    let finished = false

    const finish = (error?: Error) => {
      if (finished) {
        return
      }

      finished = true
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
      unsubscribe()
      if (error) {
        reject(error)
        return
      }

      resolve()
    }

    try {
      unsubscribe = subscribeDeckRecommendWorker((event) => {
        if (event.requestId !== requestId && event.requestId !== "worker") {
          return
        }

        if (event.type === "progress") {
          onProgress?.(event.phase)
          return
        }

        if (
          (type === "preload" && event.type === "ready")
          || (type === "load-data" && event.type === "data-loaded")
        ) {
          finish()
          return
        }

        if (event.type === "error") {
          finish(new Error(event.message))
        }
      })
      timeoutId = setTimeout(() => {
        finish(new Error(`Deck recommend worker ${type} timed out`))
      }, timeoutMs)
      postDeckRecommendWorkerRequest({ type, requestId, ...input } as DeckRecommendWorkerRequestWithoutId & { requestId: string })
    } catch (error) {
      finish(error instanceof Error ? error : new Error(normalizeWorkerClientErrorMessage(error)))
    }
  })
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeWorkerClientErrorMessage(error: unknown): string {
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
