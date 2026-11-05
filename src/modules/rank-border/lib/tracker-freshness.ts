/**
 * How old the tracker's latest sample is, bucketed for the status pill.
 *
 * The socket state says whether *we* are connected; it says nothing about
 * whether the collector upstream is still producing data. A tracker that
 * stopped two hours ago keeps answering with its last snapshot, so the age of
 * `status.timestamp` is the only honest freshness signal.
 */
export type TrackerFreshnessState =
  /** No sample timestamp yet. */
  | "unknown"
  /** Sampled within the stale threshold. */
  | "fresh"
  /** Older than `staleAfterSeconds`: show it, but say so. */
  | "stale"
  /** Older than `outdatedAfterSeconds`: the collector is most likely down. */
  | "outdated"
  /** The activity is over, so the data legitimately stopped moving. */
  | "ended"

export type TrackerFreshness = {
  state: TrackerFreshnessState
  /** Seconds since the sample, or null without a sample. */
  ageSeconds: number | null
}

/** The collector samples every 10 s; a few missed rounds are noise, five minutes is not. */
export const TRACKER_STALE_AFTER_SECONDS = 5 * 60
export const TRACKER_OUTDATED_AFTER_SECONDS = 30 * 60

export type ResolveTrackerFreshnessInput = {
  /** Unix seconds of the tracker's latest sample (`status.timestamp`). */
  statusTimestamp: number | null | undefined
  /** Unix seconds now. */
  now: number
  /** Unix seconds the ranked activity ends (event aggregate / chapter end). */
  activityEndAt?: number | null
  staleAfterSeconds?: number
  outdatedAfterSeconds?: number
}

export function resolveTrackerFreshness(input: ResolveTrackerFreshnessInput): TrackerFreshness {
  const {
    statusTimestamp,
    now,
    activityEndAt = null,
    staleAfterSeconds = TRACKER_STALE_AFTER_SECONDS,
    outdatedAfterSeconds = TRACKER_OUTDATED_AFTER_SECONDS,
  } = input

  if (typeof statusTimestamp !== "number" || !Number.isFinite(statusTimestamp) || statusTimestamp <= 0) {
    return { state: "unknown", ageSeconds: null }
  }

  const ageSeconds = Math.max(0, Math.floor(now - statusTimestamp))
  if (activityEndAt != null && now > activityEndAt) {
    return { state: "ended", ageSeconds }
  }
  if (ageSeconds >= outdatedAfterSeconds) {
    return { state: "outdated", ageSeconds }
  }
  if (ageSeconds >= staleAfterSeconds) {
    return { state: "stale", ageSeconds }
  }
  return { state: "fresh", ageSeconds }
}
