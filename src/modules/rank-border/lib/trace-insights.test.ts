import { describe, expect, it } from "bun:test"
import {
  listHolderRuns,
  resolveCushion,
  resolveMilestones,
  summarizeActivity,
  summarizeDays,
  summarizeGames,
  summarizeHolders,
  summarizeRankHistory,
  type InsightPoint,
} from "./trace-insights"

const p = (timestamp: number, score: number, rank = 1, userId: string | null = null): InsightPoint => ({ timestamp, score, rank, userId })

describe("summarizeGames", () => {
  it("counts each score increase as a game", () => {
    const summary = summarizeGames([p(0, 100), p(10, 150), p(20, 150), p(30, 250), p(40, 280)])
    expect(summary).toEqual({ games: 3, totalPt: 180, medianPt: 50, maxPt: 100, minPt: 30 })
  })

  it("takes the mean of the two middle games for an even count", () => {
    expect(summarizeGames([p(0, 0), p(1, 10), p(2, 40)]).medianPt).toBe(20)
  })

  it("is empty for a flat or short trace", () => {
    expect(summarizeGames([])).toEqual({ games: 0, totalPt: 0, medianPt: null, maxPt: null, minPt: null })
    expect(summarizeGames([p(0, 5), p(9, 5)]).games).toBe(0)
  })
})

describe("summarizeActivity", () => {
  it("splits sessions at pauses longer than the gap", () => {
    // Session 1: changes at 100..400; a 2000 s pause; session 2: 2400..2500.
    const trace = [p(0, 0), p(100, 1), p(250, 2), p(400, 3), p(2400, 4), p(2500, 5)]
    const summary = summarizeActivity(trace, 2600, 900)
    expect(summary).toEqual({
      sessions: 2,
      activeSeconds: 400,
      longestSessionSeconds: 300,
      longestRestSeconds: 2000,
      currentSessionStart: 2400,
      idleSeconds: 100,
      active: true,
    })
  })

  it("reports a player past the gap as idle", () => {
    const summary = summarizeActivity([p(0, 0), p(100, 1)], 5000, 900)
    expect(summary.active).toBe(false)
    expect(summary.idleSeconds).toBe(4900)
  })

  it("has nothing to say without a score change", () => {
    expect(summarizeActivity([p(0, 5)], 100)).toMatchObject({ sessions: 0, idleSeconds: null, active: false })
  })
})

describe("summarizeRankHistory", () => {
  it("finds the best and worst rank and counts changes", () => {
    const history = summarizeRankHistory([p(0, 0, 50), p(10, 1, 40), p(20, 2, 40), p(30, 3, 45), p(40, 4, 12)])
    expect(history).toEqual({ best: 12, bestAt: 40, worst: 50, changes: 3 })
  })

  it("is empty for no data", () => {
    expect(summarizeRankHistory([])).toEqual({ best: null, bestAt: null, worst: null, changes: 0 })
  })
})

describe("summarizeHolders", () => {
  it("counts holders and turnovers and dates the current hold", () => {
    const trace = [p(0, 1, 100, "a"), p(100, 2, 100, "a"), p(500, 3, 100, "b"), p(600, 4, 100, "a"), p(700, 5, 100, "a")]
    expect(summarizeHolders(trace, 1000)).toEqual({ holders: 2, turnovers: 2, heldSince: 600, longestHoldSeconds: 500 })
  })

  it("is null when no row names a holder", () => {
    expect(summarizeHolders([p(0, 1, 500), p(10, 2, 500)], 100)).toBeNull()
  })
})

describe("resolveMilestones", () => {
  it("lists the nearest lines above the score", () => {
    const lines = [{ rank: 1, score: 1000 }, { rank: 10, score: 600 }, { rank: 50, score: 400 }, { rank: 100, score: 300 }, { rank: 200, score: 100 }]
    expect(resolveMilestones(350, lines, 2)).toEqual([{ rank: 50, gap: 50 }, { rank: 10, gap: 250 }])
  })

  it("is empty at the top or without a score", () => {
    expect(resolveMilestones(2000, [{ rank: 1, score: 1000 }])).toEqual([])
    expect(resolveMilestones(null, [{ rank: 1, score: 1000 }])).toEqual([])
  })
})

describe("resolveCushion", () => {
  it("finds the nearest line below the score", () => {
    const lines = [{ rank: 10, score: 600 }, { rank: 50, score: 400 }, { rank: 100, score: 300 }]
    expect(resolveCushion(450, lines)).toEqual({ rank: 50, gap: 50 })
  })

  it("is null at the bottom or without a score", () => {
    expect(resolveCushion(100, [{ rank: 100, score: 300 }])).toBeNull()
    expect(resolveCushion(null, [{ rank: 100, score: 300 }])).toBeNull()
  })
})

describe("summarizeDays", () => {
  // Days are 1000 s long in this test.
  const dayOf = (timestamp: number) => Math.floor(timestamp / 1000) * 1000

  it("groups gains, games and play time by day", () => {
    const trace = [p(100, 0, 9), p(200, 50, 8), p(300, 80, 8), p(1100, 200, 5), p(1900, 260, 6)]
    expect(summarizeDays(trace, dayOf, 500)).toEqual([
      { dayStart: 0, gained: 80, games: 2, activeSeconds: 100, bestPt: 50, endRank: 8, endScore: 80 },
      { dayStart: 1000, gained: 180, games: 2, activeSeconds: 0, bestPt: 120, endRank: 6, endScore: 260 },
    ])
  })

  it("is empty for an empty trace", () => {
    expect(summarizeDays([], dayOf)).toEqual([])
  })
})

describe("listHolderRuns", () => {
  it("lists unbroken holds newest first", () => {
    const trace = [p(0, 1, 100, "a"), p(100, 2, 100, "a"), p(500, 3, 100, "b"), p(600, 4, 100, "a")]
    expect(listHolderRuns(trace)).toEqual([
      { userId: "a", from: 600, to: null, score: 4 },
      { userId: "b", from: 500, to: 600, score: 3 },
      { userId: "a", from: 0, to: 500, score: 1 },
    ])
    expect(listHolderRuns(trace, 1)).toHaveLength(1)
  })

  it("skips rows without a holder", () => {
    expect(listHolderRuns([p(0, 1, 500), p(10, 2, 500)])).toEqual([])
  })
})
