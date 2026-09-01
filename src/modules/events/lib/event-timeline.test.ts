import { describe, expect, test } from "bun:test"
import { buildEventTimeline, resolveEventCountdownTarget } from "./event-timeline"

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2024, 0, 15)

const EVENT = {
  startAt: NOW - 5 * DAY,
  aggregateAt: NOW + 3 * DAY,
  rankingAnnounceAt: NOW + 3 * DAY + 600_000,
  distributionStartAt: NOW + 4 * DAY,
  closedAt: NOW + 5 * DAY,
}

describe("buildEventTimeline", () => {
  test("lists every known instant in order with reached flags", () => {
    const rows = buildEventTimeline(EVENT, NOW)
    expect(rows.map((row) => row.key)).toEqual(["start", "aggregate", "rankingAnnounce", "distributionStart", "closed"])
    expect(rows.map((row) => row.reached)).toEqual([true, false, false, false, false])
  })

  test("skips optional instants the dump does not carry", () => {
    const rows = buildEventTimeline({ ...EVENT, rankingAnnounceAt: null, distributionStartAt: null }, NOW)
    expect(rows.map((row) => row.key)).toEqual(["start", "aggregate", "closed"])
  })

  test("keeps the mandatory rows with null instants", () => {
    const rows = buildEventTimeline({ startAt: null, aggregateAt: null, rankingAnnounceAt: null, distributionStartAt: null, closedAt: null }, NOW)
    expect(rows).toEqual([
      { key: "start", at: null, reached: false },
      { key: "aggregate", at: null, reached: false },
      { key: "closed", at: null, reached: false },
    ])
  })
})

describe("resolveEventCountdownTarget", () => {
  test("counts to the start while upcoming", () => {
    expect(resolveEventCountdownTarget(EVENT, "upcoming")).toEqual({ kind: "start", targetMs: EVENT.startAt, startMs: null })
  })

  test("counts to the aggregation with progress while ongoing", () => {
    expect(resolveEventCountdownTarget(EVENT, "ongoing")).toEqual({ kind: "aggregate", targetMs: EVENT.aggregateAt, startMs: EVENT.startAt })
    expect(resolveEventCountdownTarget({ ...EVENT, aggregateAt: null }, "ongoing")).toEqual({ kind: "aggregate", targetMs: EVENT.closedAt, startMs: EVENT.startAt })
  })

  test("returns null when ended or without a target", () => {
    expect(resolveEventCountdownTarget(EVENT, "ended")).toBeNull()
    expect(resolveEventCountdownTarget({ ...EVENT, startAt: null }, "upcoming")).toBeNull()
  })
})
