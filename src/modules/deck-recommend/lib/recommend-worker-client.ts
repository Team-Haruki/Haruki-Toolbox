import type { RecommendMusic, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import { createRequestId } from "@/lib/request-id"
import {
  createDeckRecommendDataKey,
  type DeckRecommendWorkerDataSource,
  type DeckRecommendWorkerEvent,
  type DeckRecommendWorkerMusicRequest,
  type DeckRecommendWorkerProgressPhase,
  type DeckRecommendWorkerRecommendBatchRequest,
  type DeckRecommendWorkerRecommendRequest,
  type DeckRecommendWorkerRequest,
  type DeckRecommendWorkerRequestWithoutId,
} from "./worker-protocol"
import { normalizeDeckRecommendWorkerError } from "./worker-error"

/**
 * The app-wide pool of recommendation engine workers.
 *
 * One worker holds one engine with one copy of the master data (~200 MB
 * resident), so the pool is sized by `worker-pool-policy` per device and
 * shared by every page that recommends (deck page, planner, song ranking).
 * Entry 0 doubles as the "shared" engine for single requests such as music
 * scoring. Workers survive page changes until an idle timer disposes them, so
 * coming back to the page does not pay the data load again.
 */
type PoolEntry = {
  worker: Worker
  ready: Promise<void>
  loadedDataKey: string | null
  dataLoads: Map<string, Promise<void>>
  activeRequests: number
}

const pool: PoolEntry[] = []
let idleDisposeTimer: ReturnType<typeof setTimeout> | null = null

// Loading master data into the engine parses tens of MB inside the worker
// and can far exceed 30s on a cold start or slower machines.
const LOAD_DATA_TIMEOUT_MS = 180000
const PRELOAD_TIMEOUT_MS = 60000
const DISPOSE_TIMEOUT_MS = 1000

export function createDeckRecommendWorker(): Worker {
  if (typeof Worker === "undefined") {
    throw new Error("Web Worker is unavailable")
  }

  return new Worker(new URL("./recommend-worker.ts", import.meta.url), { type: "module" })
}

export function getDeckRecommendWorkerPoolSize(): number {
  return pool.length
}

/**
 * Sizes the pool to exactly `size` engines (the page's execution mode and
 * algorithm selection decide the number) and waits until every kept engine
 * has instantiated its WASM module. Shrinking never removes a worker that
 * still has a request in flight.
 */
export async function ensureDeckRecommendWorkerPool(size: number): Promise<void> {
  cancelDeckRecommendWorkerPoolDisposal()
  const targetCount = Math.max(1, Math.floor(size))
  growPool(targetCount)

  const removable = pool.slice(targetCount).filter((entry) => entry.activeRequests === 0)
  for (const entry of removable) {
    pool.splice(pool.indexOf(entry), 1)
  }
  await Promise.allSettled(removable.map(disposePoolEntry))
  await Promise.all(pool.slice(0, targetCount).map((entry) => entry.ready))
}

/**
 * Makes sure at least `size` engines exist without releasing any extra ones
 * another page may be using (a song ranking needs one engine, the deck page
 * next to it may hold four).
 */
export async function growDeckRecommendWorkerPool(size: number): Promise<void> {
  cancelDeckRecommendWorkerPoolDisposal()
  const targetCount = Math.max(1, Math.floor(size))
  growPool(targetCount)
  await Promise.all(pool.slice(0, targetCount).map((entry) => entry.ready))
}

function growPool(targetCount: number) {
  while (pool.length < targetCount) {
    pool.push(createPoolEntry())
  }
}

/**
 * Makes the first `size` engines hold `source`. Each worker reads the tables
 * from IndexedDB itself; the page only ships the descriptor.
 */
export async function preloadDeckRecommendWorkerData(
  source: DeckRecommendWorkerDataSource,
  size: number,
  options: {
    isCurrent?: () => boolean
    onProgress?: (phase: DeckRecommendWorkerProgressPhase) => void
  } = {},
): Promise<void> {
  await growDeckRecommendWorkerPool(size)
  const isCurrent = options.isCurrent ?? (() => true)
  if (!isCurrent()) {
    return
  }

  const targetCount = Math.max(1, Math.min(Math.floor(size), pool.length))
  await Promise.all(pool.slice(0, targetCount).map((entry) => loadDataIntoEntry(entry, source, isCurrent, options.onProgress)))
}

export function recommendOnDeckRecommendWorker(
  index: number,
  input: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">,
  onEvent?: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  const entry = requirePoolEntry(index)
  return runWorkerRequest(entry, { type: "recommend", ...input }, {
    successType: "done",
    onEvent,
  }).then((event) => ({ result: event.result, elapsedMs: event.elapsedMs }))
}

export function recommendBatchOnDeckRecommendWorker(
  index: number,
  input: Omit<DeckRecommendWorkerRecommendBatchRequest, "type" | "requestId">,
  onEvent?: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ results: RecommendResult[]; elapsedMs: number }> {
  const entry = requirePoolEntry(index)
  return runWorkerRequest(entry, { type: "recommend-batch", ...input }, {
    successType: "batch-done",
    onEvent,
  }).then((event) => ({ results: event.results, elapsedMs: event.elapsedMs }))
}

export async function recommendMusicOnDeckRecommendWorker(
  input: Omit<DeckRecommendWorkerMusicRequest, "type" | "requestId">,
): Promise<RecommendMusic[]> {
  await growDeckRecommendWorkerPool(1)
  const entry = requirePoolEntry(0)
  const event = await runWorkerRequest(entry, { type: "recommend-music", ...input }, { successType: "music-done" })
  return event.results
}

export async function disposeDeckRecommendWorkerPool(): Promise<void> {
  cancelDeckRecommendWorkerPoolDisposal()
  const entries = pool.splice(0)
  await Promise.allSettled(entries.map(disposePoolEntry))
}

/**
 * Disposes the pool after `delayMs` of nobody needing it; `0` disposes right
 * away. A request still in flight postpones the disposal.
 */
export function scheduleDeckRecommendWorkerPoolDisposal(delayMs: number): void {
  cancelDeckRecommendWorkerPoolDisposal()
  if (pool.length === 0) {
    return
  }
  if (delayMs <= 0) {
    void disposeDeckRecommendWorkerPool()
    return
  }
  idleDisposeTimer = setTimeout(() => {
    idleDisposeTimer = null
    if (pool.some((entry) => entry.activeRequests > 0)) {
      scheduleDeckRecommendWorkerPoolDisposal(delayMs)
      return
    }
    void disposeDeckRecommendWorkerPool()
  }, delayMs)
}

export function cancelDeckRecommendWorkerPoolDisposal(): void {
  if (idleDisposeTimer != null) {
    clearTimeout(idleDisposeTimer)
    idleDisposeTimer = null
  }
}

function createPoolEntry(): PoolEntry {
  const worker = createDeckRecommendWorker()
  const entry: PoolEntry = {
    worker,
    ready: Promise.resolve(),
    loadedDataKey: null,
    dataLoads: new Map(),
    activeRequests: 0,
  }
  entry.ready = runWorkerRequest(entry, { type: "preload" }, {
    successType: "ready",
    timeoutMs: PRELOAD_TIMEOUT_MS,
  }).then(() => undefined)
  // A failed warm-up (WASM fetch blocked, out of memory) is reported by
  // whichever request awaits it; the broken worker leaves the pool so the
  // next attempt starts a fresh one instead of failing forever.
  entry.ready.catch(() => {
    const index = pool.indexOf(entry)
    if (index !== -1) {
      pool.splice(index, 1)
    }
    entry.worker.terminate()
  })
  return entry
}

async function disposePoolEntry(entry: PoolEntry): Promise<void> {
  try {
    await runWorkerRequest(entry, { type: "dispose" }, {
      successType: "disposed",
      timeoutMs: DISPOSE_TIMEOUT_MS,
      resolveOnTimeout: true,
    })
  } catch {
    // The worker is terminated either way.
  } finally {
    entry.worker.terminate()
  }
}

function requirePoolEntry(index: number): PoolEntry {
  const entry = pool[index]
  if (!entry) {
    throw new Error("deck recommend worker is not ready")
  }
  return entry
}

async function loadDataIntoEntry(
  entry: PoolEntry,
  source: DeckRecommendWorkerDataSource,
  isCurrent: () => boolean,
  onProgress?: (phase: DeckRecommendWorkerProgressPhase) => void,
): Promise<void> {
  const dataKey = createDeckRecommendDataKey(source)
  if (entry.loadedDataKey === dataKey) {
    return
  }

  let pending = entry.dataLoads.get(dataKey)
  if (!pending) {
    pending = (async () => {
      await entry.ready
      if (!isCurrent()) {
        return
      }
      await runWorkerRequest(entry, { type: "load-data", data: source }, {
        successType: "data-loaded",
        timeoutMs: LOAD_DATA_TIMEOUT_MS,
        onEvent: (event) => {
          if (event.type === "progress") {
            onProgress?.(event.phase)
          }
        },
      })
      entry.loadedDataKey = dataKey
    })().finally(() => {
      entry.dataLoads.delete(dataKey)
    })
    entry.dataLoads.set(dataKey, pending)
  }
  await pending
}

type SuccessEvent<TType extends DeckRecommendWorkerEvent["type"]> = Extract<DeckRecommendWorkerEvent, { type: TType }>

function runWorkerRequest<TType extends Exclude<DeckRecommendWorkerEvent["type"], "progress" | "error">>(
  entry: PoolEntry,
  request: DeckRecommendWorkerRequestWithoutId,
  options: {
    successType: TType
    timeoutMs?: number
    resolveOnTimeout?: boolean
    onEvent?: (event: DeckRecommendWorkerEvent) => void
  },
): Promise<SuccessEvent<TType>> {
  return new Promise<SuccessEvent<TType>>((resolve, reject) => {
    const requestId = createRequestId()
    const worker = entry.worker
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let finished = false

    const cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
      worker.removeEventListener("messageerror", handleMessageError)
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
    }
    const finish = (error?: Error, event?: SuccessEvent<TType>) => {
      if (finished) {
        return
      }
      finished = true
      entry.activeRequests = Math.max(0, entry.activeRequests - 1)
      cleanup()
      if (error) {
        reject(error)
        return
      }
      resolve(event as SuccessEvent<TType>)
    }
    const handleMessage = (messageEvent: MessageEvent<DeckRecommendWorkerEvent>) => {
      const event = messageEvent.data
      if (event.requestId !== requestId) {
        // Worker-level failures (deserialization, uncaught errors) are not
        // tied to a request but doom every request waiting on this worker.
        if (event.requestId === "worker" && event.type === "error") {
          finish(new Error(event.message))
        }
        return
      }

      options.onEvent?.(event)
      if (event.type === options.successType) {
        finish(undefined, event as SuccessEvent<TType>)
        return
      }
      if (event.type === "error") {
        finish(new Error(event.message))
      }
    }
    const handleError = (event: ErrorEvent) => {
      finish(new Error(event.message || "Deck recommend worker failed"))
    }
    // Fires when an event from the worker cannot be deserialized (for example
    // under memory pressure); without this the request would hang silently.
    const handleMessageError = () => {
      finish(new Error("Deck recommend worker message could not be deserialized"))
    }

    entry.activeRequests += 1
    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
    worker.addEventListener("messageerror", handleMessageError)
    if (options.timeoutMs != null) {
      timeoutId = setTimeout(() => {
        if (options.resolveOnTimeout) {
          finish(undefined, { type: options.successType, requestId } as unknown as SuccessEvent<TType>)
          return
        }
        finish(new Error(`Deck recommend worker ${request.type} timed out`))
      }, options.timeoutMs)
    }
    try {
      worker.postMessage({ ...request, requestId } satisfies DeckRecommendWorkerRequest)
    } catch (error) {
      finish(error instanceof Error ? error : new Error(normalizeDeckRecommendWorkerError(error)))
    }
  })
}
