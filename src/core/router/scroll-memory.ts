/**
 * Hand-off between the router's `scrollBehavior` and pages that restore
 * their own scroll position (`useCatalogScrollMemory`). Routes flagged with
 * `meta.scrollMemory` return `false` from `scrollBehavior`; the router only
 * records whether the arrival came with a saved position (back/forward or a
 * reload) so the page knows whether to restore or to start at the top.
 */

let pendingArrival: { restore: boolean } | null = null

export function recordScrollMemoryArrival(restore: boolean): void {
  pendingArrival = { restore }
}

/** Consumes the pending arrival; `null` when the page mounted without a routed navigation. */
export function consumeScrollMemoryArrival(): { restore: boolean } | null {
  const arrival = pendingArrival
  pendingArrival = null
  return arrival
}
