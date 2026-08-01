import { describe, expect, it } from "bun:test"
import {
  buildPlannerCalendar,
  buildPlannerMusicDurations,
  buildPlannerRectangleHourKeys,
  buildPlannerSongRanking,
  estimatePlaysPerHour,
  pickPlannerBrushColor,
  PLANNER_BRUSH_COLORS,
  PLANNER_REST_BRUSH_ID,
  resolvePlannerRemainingPoint,
  summarizePlannerCells,
  type PlannerBrush,
} from "./planner-calendar"

function makeBrush(overrides: Partial<PlannerBrush> = {}): PlannerBrush {
  return {
    id: "b1",
    name: "brush",
    color: PLANNER_BRUSH_COLORS[0],
    pointsPerHour: 100_000,
    musicId: 226,
    difficulty: "hard",
    eventPointPerPlay: 2500,
    playsPerHour: 40,
    deckCardIds: [],
    ...overrides,
  }
}

describe("buildPlannerCalendar", () => {
  it("splits the event window into day rows of aligned hours", () => {
    // 2026-07-01 15:30 → 2026-07-03 21:00 local time.
    const start = new Date(2026, 6, 1, 15, 30).getTime()
    const end = new Date(2026, 6, 3, 21, 0).getTime()
    const days = buildPlannerCalendar(start, end)
    expect(days).toHaveLength(3)
    // First day starts at the 15:00 cell (partial first hour stays paintable).
    expect(days[0].hours[0].hourOfDay).toBe(15)
    expect(days[0].hours).toHaveLength(9)
    expect(days[1].hours).toHaveLength(24)
    // Last day ends with the 20:00 cell (21:00 is the cutoff).
    expect(days[2].hours.at(-1)?.hourOfDay).toBe(20)
  })

  it("returns empty for invalid windows", () => {
    expect(buildPlannerCalendar(100, 100)).toEqual([])
    expect(buildPlannerCalendar(Number.NaN, 100)).toEqual([])
  })
})

describe("buildPlannerRectangleHourKeys", () => {
  // 2026-07-01 15:30 → 2026-07-03 21:00 local time (day 0 starts at 15:00).
  const days = buildPlannerCalendar(
    new Date(2026, 6, 1, 15, 30).getTime(),
    new Date(2026, 6, 3, 21, 0).getTime(),
  )

  it("selects the inclusive day/hour rectangle regardless of drag direction", () => {
    const forward = buildPlannerRectangleHourKeys(
      days,
      { dayIndex: 0, hourOfDay: 16 },
      { dayIndex: 1, hourOfDay: 18 },
    )
    expect(forward).toHaveLength(6)
    expect(forward).toContain(String(new Date(2026, 6, 1, 16).getTime()))
    expect(forward).toContain(String(new Date(2026, 6, 2, 18).getTime()))
    const backward = buildPlannerRectangleHourKeys(
      days,
      { dayIndex: 1, hourOfDay: 18 },
      { dayIndex: 0, hourOfDay: 16 },
    )
    expect(new Set(backward)).toEqual(new Set(forward))
  })

  it("skips hours missing from partial first/last days", () => {
    // 8:00–10:00 across all three days: day 0 only starts at 15:00.
    const keys = buildPlannerRectangleHourKeys(
      days,
      { dayIndex: 0, hourOfDay: 8 },
      { dayIndex: 2, hourOfDay: 10 },
    )
    expect(keys).toHaveLength(6)
    expect(keys).toContain(String(new Date(2026, 6, 2, 8).getTime()))
    expect(keys).toContain(String(new Date(2026, 6, 3, 10).getTime()))
  })

  it("returns a single cell for a click without drag", () => {
    expect(buildPlannerRectangleHourKeys(
      days,
      { dayIndex: 1, hourOfDay: 0 },
      { dayIndex: 1, hourOfDay: 0 },
    )).toEqual([String(new Date(2026, 6, 2, 0).getTime())])
  })
})

describe("summarizePlannerCells", () => {
  const brushes = [
    makeBrush(),
    makeBrush({ id: PLANNER_REST_BRUSH_ID, pointsPerHour: 0 }),
  ]

  it("totals points and hours per brush, skipping unknown brushes", () => {
    const summary = summarizePlannerCells(
      { a: "b1", b: "b1", c: PLANNER_REST_BRUSH_ID, d: "ghost" },
      brushes,
    )
    expect(summary.plannedPoints).toBe(200_000)
    expect(summary.plannedHours).toBe(2)
    expect(summary.restHours).toBe(1)
    expect(summary.hoursByBrush.get("b1")).toBe(2)
  })
})

describe("resolvePlannerRemainingPoint", () => {
  it("subtracts current and planned points, clamping at zero", () => {
    expect(resolvePlannerRemainingPoint({ targetPoint: 1_000_000, currentPoint: 200_000, plannedPoints: 300_000 }))
      .toBe(500_000)
    expect(resolvePlannerRemainingPoint({ targetPoint: 100, currentPoint: 90, plannedPoints: 50 })).toBe(0)
    expect(resolvePlannerRemainingPoint({ targetPoint: null, currentPoint: 0, plannedPoints: 0 })).toBeNull()
  })
})

describe("pickPlannerBrushColor", () => {
  it("prefers unused palette colors", () => {
    expect(pickPlannerBrushColor([])).toBe(PLANNER_BRUSH_COLORS[0])
    expect(pickPlannerBrushColor([makeBrush({ color: PLANNER_BRUSH_COLORS[0] })]))
      .toBe(PLANNER_BRUSH_COLORS[1])
  })
})

describe("song ranking", () => {
  it("estimates plays per hour with cycle overhead", () => {
    expect(estimatePlaysPerHour(90)).toBe(30)
    expect(estimatePlaysPerHour(150)).toBe(20)
    expect(estimatePlaysPerHour(null)).toBe(30)
  })

  it("builds a points-per-hour ranking joined with titles and durations", () => {
    const durations = buildPlannerMusicDurations([
      { music_id: 1, difficulty: "hard", music_time: 90 },
      { music_id: 2, difficulty: "hard", music_time: 150 },
    ])
    const titles = new Map([[1, "Song A"], [2, "Song B"], [3, "Song C"]])
    const ranking = buildPlannerSongRanking(
      [
        { music_id: 1, difficulty: "hard", live_score: 100, event_point: 2000 },
        { music_id: 2, difficulty: "hard", live_score: 300, event_point: 2600 },
        // No event point → skipped.
        { music_id: 3, difficulty: "hard", live_score: 100, event_point: null },
        // Unknown title → skipped.
        { music_id: 99, difficulty: "hard", live_score: 100, event_point: 9999 },
      ],
      titles,
      durations,
    )
    expect(ranking.map((row) => row.musicId)).toEqual([1, 2])
    expect(ranking[0]).toMatchObject({ pointsPerHour: 60_000, playsPerHour: 30 })
    expect(ranking[1]).toMatchObject({ pointsPerHour: 52_000, playsPerHour: 20 })
  })
})
