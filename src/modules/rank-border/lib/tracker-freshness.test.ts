import { describe, expect, test } from "bun:test"
import {
  resolveTrackerFreshness,
  TRACKER_OUTDATED_AFTER_SECONDS,
  TRACKER_STALE_AFTER_SECONDS,
} from "./tracker-freshness"

const NOW = 1_800_000_000

describe("resolveTrackerFreshness", () => {
  test("is unknown without a usable sample timestamp", () => {
    expect(resolveTrackerFreshness({ statusTimestamp: null, now: NOW })).toEqual({ state: "unknown", ageSeconds: null })
    expect(resolveTrackerFreshness({ statusTimestamp: undefined, now: NOW })).toEqual({ state: "unknown", ageSeconds: null })
    expect(resolveTrackerFreshness({ statusTimestamp: 0, now: NOW })).toEqual({ state: "unknown", ageSeconds: null })
    expect(resolveTrackerFreshness({ statusTimestamp: Number.NaN, now: NOW })).toEqual({ state: "unknown", ageSeconds: null })
  })

  test("buckets the sample age at the stale and outdated thresholds", () => {
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - 12, now: NOW })).toEqual({ state: "fresh", ageSeconds: 12 })
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - TRACKER_STALE_AFTER_SECONDS + 1, now: NOW }).state).toBe("fresh")
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - TRACKER_STALE_AFTER_SECONDS, now: NOW }).state).toBe("stale")
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - TRACKER_OUTDATED_AFTER_SECONDS + 1, now: NOW }).state).toBe("stale")
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - TRACKER_OUTDATED_AFTER_SECONDS, now: NOW }).state).toBe("outdated")
    // The audit's repro: a snapshot two hours old must never read as live.
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - 7_200, now: NOW })).toEqual({ state: "outdated", ageSeconds: 7_200 })
  })

  test("honours custom thresholds", () => {
    const freshness = resolveTrackerFreshness({ statusTimestamp: NOW - 90, now: NOW, staleAfterSeconds: 60, outdatedAfterSeconds: 120 })
    expect(freshness.state).toBe("stale")
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - 130, now: NOW, staleAfterSeconds: 60, outdatedAfterSeconds: 120 }).state).toBe("outdated")
  })

  test("a clock slightly behind the sample is a fresh age of zero", () => {
    expect(resolveTrackerFreshness({ statusTimestamp: NOW + 5, now: NOW })).toEqual({ state: "fresh", ageSeconds: 0 })
  })

  test("an ended activity is never stale, whatever the sample age", () => {
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - 7_200, now: NOW, activityEndAt: NOW - 3_600 })).toEqual({ state: "ended", ageSeconds: 7_200 })
    // Still running: the end date in the future changes nothing.
    expect(resolveTrackerFreshness({ statusTimestamp: NOW - 7_200, now: NOW, activityEndAt: NOW + 3_600 }).state).toBe("outdated")
  })
})
