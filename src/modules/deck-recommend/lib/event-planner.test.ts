import { describe, expect, it } from "bun:test"
import {
  buildEventPlannerBoostRows,
  EVENT_PLANNER_BOOST_LEVELS,
  parseEventPlannerPointInput,
  resolveEventPlannerDailyPoint,
  resolveEventPlannerRemainingPoint,
} from "./event-planner"

describe("parseEventPlannerPointInput", () => {
  it("parses plain integers", () => {
    expect(parseEventPlannerPointInput("25000")).toEqual({ value: 25_000, invalid: false })
    expect(parseEventPlannerPointInput("0")).toEqual({ value: 0, invalid: false })
  })

  it("parses suffixed values from the Go command", () => {
    expect(parseEventPlannerPointInput("1000w")).toEqual({ value: 10_000_000, invalid: false })
    expect(parseEventPlannerPointInput("120万")).toEqual({ value: 1_200_000, invalid: false })
    expect(parseEventPlannerPointInput("1.5亿")).toEqual({ value: 150_000_000, invalid: false })
    expect(parseEventPlannerPointInput("25k")).toEqual({ value: 25_000, invalid: false })
    expect(parseEventPlannerPointInput("2億")).toEqual({ value: 200_000_000, invalid: false })
  })

  it("treats w/k suffixes case-insensitively", () => {
    expect(parseEventPlannerPointInput("3W")).toEqual({ value: 30_000, invalid: false })
    expect(parseEventPlannerPointInput("1.5K")).toEqual({ value: 1_500, invalid: false })
  })

  it("strips separators and spaces", () => {
    expect(parseEventPlannerPointInput("1,000,000")).toEqual({ value: 1_000_000, invalid: false })
    expect(parseEventPlannerPointInput("1_000")).toEqual({ value: 1_000, invalid: false })
    expect(parseEventPlannerPointInput("1，000")).toEqual({ value: 1_000, invalid: false })
    expect(parseEventPlannerPointInput(" 12 000 w ")).toEqual({ value: 120_000_000, invalid: false })
  })

  it("rounds half up to an integer", () => {
    expect(parseEventPlannerPointInput("2.5")).toEqual({ value: 3, invalid: false })
    expect(parseEventPlannerPointInput("1.25k")).toEqual({ value: 1_250, invalid: false })
    expect(parseEventPlannerPointInput("0.00005万")).toEqual({ value: 1, invalid: false })
  })

  it("treats empty input as absent, not invalid", () => {
    expect(parseEventPlannerPointInput("")).toEqual({ value: null, invalid: false })
    expect(parseEventPlannerPointInput("   ")).toEqual({ value: null, invalid: false })
  })

  it("rejects invalid or negative input", () => {
    expect(parseEventPlannerPointInput("abc")).toEqual({ value: null, invalid: true })
    expect(parseEventPlannerPointInput("-100")).toEqual({ value: null, invalid: true })
    expect(parseEventPlannerPointInput("w")).toEqual({ value: null, invalid: true })
    expect(parseEventPlannerPointInput("1.2.3")).toEqual({ value: null, invalid: true })
    expect(parseEventPlannerPointInput("10万w")).toEqual({ value: null, invalid: true })
    expect(parseEventPlannerPointInput("1e5")).toEqual({ value: null, invalid: true })
  })
})

describe("resolveEventPlannerRemainingPoint", () => {
  it("subtracts current from target", () => {
    expect(resolveEventPlannerRemainingPoint(1_000_000, 250_000)).toBe(750_000)
  })

  it("clamps to zero when current exceeds target", () => {
    expect(resolveEventPlannerRemainingPoint(1_000_000, 1_200_000)).toBe(0)
    expect(resolveEventPlannerRemainingPoint(0, 0)).toBe(0)
  })
})

describe("buildEventPlannerBoostRows", () => {
  it("covers all boost levels 0-10 with the Go multipliers", () => {
    const rows = buildEventPlannerBoostRows(1_000, 100_000)
    expect(rows.map((row) => row.boost)).toEqual([...EVENT_PLANNER_BOOST_LEVELS])
    expect(rows.map((row) => row.multiplier)).toEqual([1, 5, 10, 15, 20, 25, 27, 29, 31, 33, 35])
  })

  it("computes point per play, plays and energy per boost", () => {
    const rows = buildEventPlannerBoostRows(1_000, 100_000)
    const byBoost = new Map(rows.map((row) => [row.boost, row]))

    expect(byBoost.get(0)).toEqual({ boost: 0, multiplier: 1, pointPerPlay: 1_000, plays: 100, energy: 0 })
    expect(byBoost.get(1)).toEqual({ boost: 1, multiplier: 5, pointPerPlay: 5_000, plays: 20, energy: 20 })
    expect(byBoost.get(3)).toEqual({ boost: 3, multiplier: 15, pointPerPlay: 15_000, plays: 7, energy: 21 })
    expect(byBoost.get(10)).toEqual({ boost: 10, multiplier: 35, pointPerPlay: 35_000, plays: 3, energy: 30 })
  })

  it("uses ceiling for partial plays", () => {
    const rows = buildEventPlannerBoostRows(999, 1_000)
    expect(rows[0].plays).toBe(2)
  })

  it("returns zero plays and energy when nothing remains", () => {
    for (const row of buildEventPlannerBoostRows(1_000, 0)) {
      expect(row.plays).toBe(0)
      expect(row.energy).toBe(0)
    }
  })

  it("returns zero plays when base point is not positive", () => {
    for (const row of buildEventPlannerBoostRows(0, 100_000)) {
      expect(row.plays).toBe(0)
      expect(row.energy).toBe(0)
    }
  })
})

describe("resolveEventPlannerDailyPoint", () => {
  const DAY = 86_400_000
  const startAt = 1_700_000_000_000
  const aggregateAt = startAt + 10 * DAY

  it("returns 0 for non-positive targets", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 0,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt,
      now: startAt + DAY,
    })).toBe(0)
    expect(resolveEventPlannerDailyPoint({
      targetPoint: -5,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt,
      now: startAt + DAY,
    })).toBe(0)
  })

  it("returns 0 when the event window is empty or inverted", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt: startAt,
      now: startAt + DAY,
    })).toBe(0)
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt: startAt - DAY,
      now: startAt + DAY,
    })).toBe(0)
  })

  it("spreads the full target over the full duration before the event starts", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 400_000,
      currentPointKnown: true,
      startAt,
      aggregateAt,
      now: startAt - DAY,
    })).toBe(100_000)
  })

  it("spreads the full target over the full duration after the event ended", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 400_000,
      currentPointKnown: true,
      startAt,
      aggregateAt,
      now: aggregateAt + DAY,
    })).toBe(100_000)
  })

  it("spreads the full target when the current point is unknown mid-event", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt,
      now: startAt + 5 * DAY,
    })).toBe(100_000)
  })

  it("spreads the remaining points over the remaining time mid-event", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 400_000,
      currentPointKnown: true,
      startAt,
      aggregateAt,
      now: startAt + 5 * DAY,
    })).toBe(120_000)
  })

  it("uses ceiling on fractional remaining days", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 0,
      currentPointKnown: true,
      startAt,
      aggregateAt,
      now: aggregateAt - DAY / 2,
    })).toBe(2_000_000)
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 100,
      currentPoint: 0,
      currentPointKnown: false,
      startAt,
      aggregateAt: startAt + 3 * DAY,
      now: startAt + DAY,
    })).toBe(Math.ceil(100 / 3))
  })

  it("returns 0 once the target is already reached mid-event", () => {
    expect(resolveEventPlannerDailyPoint({
      targetPoint: 1_000_000,
      currentPoint: 1_200_000,
      currentPointKnown: true,
      startAt,
      aggregateAt,
      now: startAt + 5 * DAY,
    })).toBe(0)
  })
})
