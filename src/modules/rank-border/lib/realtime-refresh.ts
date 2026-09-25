/**
 * Single-flight refresh scheduling for views fed by tracker `updated` pushes.
 *
 * - At most one refresh runs at a time. Requests that arrive meanwhile are
 *   merged into one follow-up run, so pushes never pile up requests.
 * - A realtime follow-up is skipped when the push carried a version and no
 *   newer version arrived while the previous run was fetching it. Pushes
 *   without a version (older trackers) always get their follow-up, which is
 *   the behaviour those servers were designed for.
 * - Realtime pushes that arrive while the document is hidden are only
 *   remembered; `resume()` (called when the tab becomes visible again) runs a
 *   single catch-up refresh.
 *
 * `run(version)` receives the latest announced version for realtime runs and
 * `null` for direct runs (initial load, manual refresh, parameter changes),
 * which keep using the unversioned request path.
 */
export type RealtimeRefreshTrigger = "direct" | "realtime"

export type RealtimeRefreshGateOptions = {
  run: (version: number | null) => Promise<void>
  isHidden?: () => boolean
  /** Called after a run that has no follow-up queued. */
  onIdle?: () => void
}

export type RealtimeRefreshGate = {
  /** Record an `updated` push and refresh unless the document is hidden. */
  notify: (version: number | null) => void
  /** Refresh now, or once more after the in-flight run. */
  request: (trigger: RealtimeRefreshTrigger) => Promise<void>
  /** Catch up after the document became visible again. */
  resume: () => Promise<void>
  /** Forget the announced version (the subscription changed or reconnected). */
  resetVersion: () => void
  readonly running: boolean
}

export function createRealtimeRefreshGate(options: RealtimeRefreshGateOptions): RealtimeRefreshGate {
  const isHidden = options.isHidden ?? isDocumentHidden
  let running: Promise<void> | null = null
  let pending: RealtimeRefreshTrigger | null = null
  let latestVersion: number | null = null

  function notify(version: number | null) {
    latestVersion = version
    if (isHidden()) {
      return
    }
    void request("realtime")
  }

  function request(trigger: RealtimeRefreshTrigger): Promise<void> {
    if (running) {
      pending = pending === "direct" || trigger === "direct" ? "direct" : "realtime"
      return running
    }
    return start(trigger)
  }

  function start(trigger: RealtimeRefreshTrigger): Promise<void> {
    const version = trigger === "realtime" ? latestVersion : null
    const current = (async () => {
      try {
        await options.run(version)
      } finally {
        running = null
        settle(version)
      }
    })()
    running = current
    return current
  }

  function settle(fetchedVersion: number | null) {
    const next = pending
    pending = null
    if (next === "direct") {
      void start("direct")
      return
    }
    // A hidden tab drops the realtime follow-up; resume() catches up later.
    if (next === "realtime" && !isHidden() && (fetchedVersion == null || latestVersion !== fetchedVersion)) {
      void start("realtime")
      return
    }
    options.onIdle?.()
  }

  function resume(): Promise<void> {
    if (isHidden()) {
      return Promise.resolve()
    }
    return request("realtime")
  }

  function resetVersion() {
    latestVersion = null
  }

  return {
    notify,
    request,
    resume,
    resetVersion,
    get running() {
      return running != null
    },
  }
}

export function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.hidden === true
}
