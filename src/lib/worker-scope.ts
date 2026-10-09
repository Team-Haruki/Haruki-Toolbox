/**
 * The part of `DedicatedWorkerGlobalScope` the app's module workers use.
 *
 * Workers are type-checked with the rest of the app against the DOM lib, and
 * the WebWorker lib cannot be loaded next to it (their globals conflict), so
 * the worker entry points describe their own `self` instead.
 */
export interface DedicatedWorkerScope<TRequest, TEvent> {
  onmessage: ((event: MessageEvent<TRequest>) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
  postMessage(message: TEvent): void
}
