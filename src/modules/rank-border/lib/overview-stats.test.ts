import { describe, expect, it } from "bun:test"
import {
  buildOverviewLineRows,
  findFastestHolder,
  projectFinalScore,
  resolveCatchUpSeconds,
  resolveEventProgress,
  resolveHourlySpeed,
  splitDuration,
  summarizeTopActivity,
  type OverviewPoint,
} from "./overview-stats"

const point = (rank: number, score: number, extra: Partial<OverviewPoint> = {}): OverviewPoint => ({
  rank, score, timestamp: 1000, growth: null, speed: null, ...extra,
})

describe("resolveHourlySpeed", () => {
  it("scales the window's growth to an hour", () => {
    expect(resolveHourlySpeed({ growth: 50_000, timeDiff: 1800 })).toBe(100_000)
    expect(resolveHourlySpeed({ growth: 0, timeDiff: 3600 })).toBe(0)
  })

  it("has no speed without a usable span", () => {
    expect(resolveHourlySpeed(null)).toBeNull()
    expect(resolveHourlySpeed({ growth: null, timeDiff: 3600 })).toBeNull()
    expect(resolveHourlySpeed({ growth: 100, timeDiff: 0 })).toBeNull()
    expect(resolveHourlySpeed({ growth: 100, timeDiff: null })).toBeNull()
  })
})

describe("resolveCatchUpSeconds", () => {
  it("is the gap over the closing speed", () => {
    expect(resolveCatchUpSeconds(100_000, 300_000, 200_000)).toBe(3600)
    expect(resolveCatchUpSeconds(50_000, 200_000, 0)).toBe(900)
  })

  it("is null when the chaser is not gaining or there is no gap", () => {
    expect(resolveCatchUpSeconds(100_000, 200_000, 200_000)).toBeNull()
    expect(resolveCatchUpSeconds(100_000, 100_000, 200_000)).toBeNull()
    expect(resolveCatchUpSeconds(0, 300_000, 200_000)).toBeNull()
    expect(resolveCatchUpSeconds(100_000, null, 200_000)).toBeNull()
    expect(resolveCatchUpSeconds(null, 300_000, 200_000)).toBeNull()
  })
})

describe("buildOverviewLineRows", () => {
  it("keeps the key seats and every border line, with gaps to the line above", () => {
    const rows = buildOverviewLineRows(
      [point(1, 1000), point(2, 900), point(4, 700), point(10, 500), point(100, 200)],
      [point(200, 150), point(500, 100)],
    )
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 10, 100, 200, 500])
    expect(rows.map((row) => row.gapToPrevious)).toEqual([null, 100, 400, 300, 50, 50])
    expect(rows.map((row) => row.previousRank)).toEqual([null, 1, 2, 10, 100, 200])
    expect(rows[0]!.shareOfTop).toBe(1)
    expect(rows[2]!.shareOfTop).toBe(0.5)
  })

  it("measures the gap against the line actually shown above", () => {
    // Seat 10 is missing: seat 20 is compared with seat 3.
    const rows = buildOverviewLineRows([point(3, 800), point(20, 300)], [])
    expect(rows[1]).toMatchObject({ rank: 20, gapToPrevious: 500, previousRank: 3 })
  })

  it("returns nothing for no data", () => {
    expect(buildOverviewLineRows([], [])).toEqual([])
  })
})

describe("summarizeTopActivity", () => {
  it("counts seats that changed within the threshold", () => {
    const rows = [
      { timestamp: 990, hasHolder: true },
      { timestamp: 100, hasHolder: true },
      { timestamp: null, hasHolder: true },
      { timestamp: 995, hasHolder: false },
    ]
    expect(summarizeTopActivity(rows, 1000, 60)).toEqual({ total: 3, active: 1 })
  })
})

describe("findFastestHolder", () => {
  it("picks the highest positive speed", () => {
    expect(findFastestHolder([
      { rank: 1, holderSpeed: 100 },
      { rank: 2, holderSpeed: 300 },
      { rank: 3, holderSpeed: null },
    ])).toEqual({ rank: 2, speed: 300 })
  })

  it("is null when nobody is gaining", () => {
    expect(findFastestHolder([{ rank: 1, holderSpeed: 0 }, { rank: 2, holderSpeed: null }])).toBeNull()
  })
})

describe("resolveEventProgress", () => {
  it("places now inside the period", () => {
    expect(resolveEventProgress(1000, 2000, 1250)).toEqual({ ratio: 0.25, elapsedSeconds: 250, remainingSeconds: 750, state: "running" })
  })

  it("clamps before the start and after the end", () => {
    expect(resolveEventProgress(1000, 2000, 500)).toMatchObject({ ratio: 0, state: "upcoming", remainingSeconds: 1000 })
    expect(resolveEventProgress(1000, 2000, 2500)).toMatchObject({ ratio: 1, state: "ended", remainingSeconds: 0 })
  })

  it("needs both ends", () => {
    expect(resolveEventProgress(null, 2000, 1500)).toBeNull()
    expect(resolveEventProgress(2000, 2000, 1500)).toBeNull()
  })
})

describe("splitDuration", () => {
  it("splits into days, hours and minutes", () => {
    expect(splitDuration(2 * 86400 + 3 * 3600 + 4 * 60 + 59)).toEqual({ days: 2, hours: 3, minutes: 4 })
    expect(splitDuration(59)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitDuration(-5)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })
})

describe("projectFinalScore", () => {
  it("holds the current speed for the time left", () => {
    expect(projectFinalScore(1_000_000, 120_000, 1800)).toBe(1_060_000)
  })

  it("has no projection without a speed or time left", () => {
    expect(projectFinalScore(1_000_000, null, 1800)).toBeNull()
    expect(projectFinalScore(1_000_000, 120_000, 0)).toBeNull()
    expect(projectFinalScore(null, 120_000, 1800)).toBeNull()
  })
})
