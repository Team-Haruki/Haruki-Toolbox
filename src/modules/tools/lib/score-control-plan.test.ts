import { describe, expect, it } from "bun:test"
import { calculateScoreControlPoints, findScoreControlRanges, SCORE_CONTROL_MAX_SCORE } from "./score-control"
import {
  isIdleRange,
  planScoreControl,
  resolveScoreControlPointBounds,
  SCORE_CONTROL_PLAN_MAX_SCORE,
  solveScoreControlOutcome,
  sortScoreControlRangesByEase,
  type ScoreControlOutcome,
  type ScoreControlPlan,
} from "./score-control-plan"

const ALL_BOOSTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const settings = { basicPoint: 100, minEventBonus: 100, maxEventBonus: 435, boosts: ALL_BOOSTS }

/** The whole window earns the stated pt, and the scores just outside it do not. */
function expectOutcomeToHold(outcome: ScoreControlOutcome, basicPoint: number) {
  const earn = (score: number) => calculateScoreControlPoints(score, outcome.eventBonus, basicPoint, outcome.boost)
  expect(earn(outcome.scoreMin)).toBe(outcome.point)
  expect(earn(outcome.scoreMax)).toBe(outcome.point)
  if (outcome.scoreMin > 0) {
    expect(earn(outcome.scoreMin - 1)).not.toBe(outcome.point)
  }
  if (outcome.scoreMax < SCORE_CONTROL_MAX_SCORE) {
    expect(earn(outcome.scoreMax + 1)).not.toBe(outcome.point)
  }
}

function planTotal(plan: ScoreControlPlan) {
  return plan.steps.reduce((sum, step) => sum + step.count * step.outcome.point, 0)
}

describe("solveScoreControlOutcome", () => {
  it("agrees with the search-based solver", () => {
    for (const target of [505, 3000, 12345, 250]) {
      const searched = findScoreControlRanges({ targetPoint: target, basicPoint: 100, minEventBonus: 0, maxEventBonus: 435, limit: 0 })
      expect(searched.length).toBeGreaterThan(0)
      for (const range of searched) {
        expect(solveScoreControlOutcome(target, range.eventBonus, range.boost, 100)).toEqual({ ...range, point: target })
      }
    }
  })

  it("holds the same pt across steps on a low-rate song", () => {
    // basic pt 30, no bonus: 30 pt up to 3 steps of score, since 30 × 1.03 still floors to 30.
    const outcome = solveScoreControlOutcome(30, 0, 0, 30)!
    expect(outcome.scoreMin).toBe(0)
    expect(outcome.scoreMax).toBeGreaterThan(19_999)
    expectOutcomeToHold(outcome, 30)
  })

  it("is null when the deck and boost cannot earn the pt", () => {
    expect(solveScoreControlOutcome(3001, 200, 2, 100)).toBeNull()
    expect(solveScoreControlOutcome(50, 0, 0, 100)).toBeNull()
    expect(solveScoreControlOutcome(10_000_000, 435, 10, 100)).toBeNull()
  })
})

describe("resolveScoreControlPointBounds", () => {
  it("spans the idle minimum to the full-score maximum", () => {
    expect(resolveScoreControlPointBounds(settings)).toEqual({
      min: 200,
      max: calculateScoreControlPoints(SCORE_CONTROL_MAX_SCORE, 435, 100, 10),
    })
  })

  it("is null without a usable boost", () => {
    expect(resolveScoreControlPointBounds({ ...settings, boosts: [] })).toBeNull()
  })
})

describe("sortScoreControlRangesByEase", () => {
  it("puts idle games first, then lower scores and less boost", () => {
    const ranges = findScoreControlRanges({ targetPoint: 3000, basicPoint: 100, minEventBonus: 100, maxEventBonus: 435, limit: 0 })
    const sorted = sortScoreControlRangesByEase(ranges)
    expect(sorted.slice(0, 2).map((range) => [range.eventBonus, range.boost])).toEqual([[200, 2], [100, 3]])
    expect(sorted.slice(0, 2).every(isIdleRange)).toBe(true)
    expect(isIdleRange(sorted[2]!)).toBe(false)
  })
})

describe("planScoreControl", () => {
  const plan = (currentPoint: number, targetPoint: number, extra: Partial<Parameters<typeof planScoreControl>[0]> = {}) =>
    planScoreControl({ ...settings, currentPoint, targetPoint, maxGames: 5, ...extra })

  it("finds plans that add up to the gap exactly, within the settings", () => {
    for (const gap of [200, 777, 3000, 12_345, 39_393, 60_001]) {
      const result = plan(1_000_000, 1_000_000 + gap)
      expect(result.status).toBe("ok")
      if (result.status !== "ok") {
        continue
      }
      expect(result.plans.length).toBeGreaterThan(0)
      for (const candidate of result.plans) {
        expect(planTotal(candidate)).toBe(gap)
        expect(candidate.games).toBeLessThanOrEqual(5)
        expect(candidate.games).toBe(candidate.steps.reduce((sum, step) => sum + step.count, 0))
        expect(candidate.energy).toBe(candidate.steps.reduce((sum, step) => sum + step.count * step.outcome.boost, 0))
        for (const step of candidate.steps) {
          expect(step.outcome.eventBonus).toBeGreaterThanOrEqual(100)
          expect(step.outcome.eventBonus).toBeLessThanOrEqual(435)
          expectOutcomeToHold(step.outcome, 100)
        }
      }
    }
  })

  it("prefers a single idle game when one lands on the gap", () => {
    const result = plan(0, 3000)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      const first = result.plans[0]!
      expect(first.games).toBe(1)
      expect(first.idleOnly).toBe(true)
      expect(first.steps[0]!.outcome).toMatchObject({ eventBonus: 200, boost: 2, scoreMin: 0 })
      expect(first.tags).toContain("fewestGames")
    }
  })

  it("names the plan that spends no Live Boost and the one that needs one deck", () => {
    // Six idle games at 0 fire and a 400% deck are 6 × 500.
    const result = plan(0, 3000, { maxGames: 6 })
    if (result.status !== "ok") {
      throw new Error("expected plans")
    }
    const frugal = result.plans.find((candidate) => candidate.tags.includes("leastEnergy"))!
    expect(frugal.energy).toBe(0)
    expect(planTotal(frugal)).toBe(3000)
    const single = result.plans.find((candidate) => candidate.tags.includes("singleDeck"))!
    expect(single.decks).toBe(1)
  })

  it("merges a finishing game that repeats the main one, and never plans an unreachable score", () => {
    for (const gap of [777, 3000, 39_393, 61_234]) {
      const result = plan(0, gap, { maxGames: 10 })
      if (result.status !== "ok") {
        throw new Error("expected plans")
      }
      for (const candidate of result.plans) {
        const games = candidate.steps.map((step) => `${step.outcome.eventBonus}|${step.outcome.boost}|${step.outcome.scoreMin}`)
        expect(new Set(games).size).toBe(games.length)
        expect(candidate.steps.every((step) => step.outcome.scoreMin <= SCORE_CONTROL_PLAN_MAX_SCORE)).toBe(true)
      }
      // With an idle plan on the table, the named picks are idle ones.
      expect(result.plans.filter((candidate) => candidate.tags.length > 0).every((candidate) => candidate.idleOnly)).toBe(true)
    }
  })

  it("respects the allowed boosts and the game cap", () => {
    const result = plan(0, 2500, { boosts: [0], maxGames: 3 })
    // 0 fire earns at most 535 pt idle, so 3 games top out at 1605.
    expect(result).toEqual({ status: "tooFar", gap: 2500, reach: 1605 })
    const reachable = plan(0, 1500, { boosts: [0], maxGames: 3 })
    expect(reachable.status).toBe("ok")
    if (reachable.status === "ok") {
      expect(reachable.plans.every((candidate) => candidate.energy === 0 && candidate.games <= 3)).toBe(true)
    }
  })

  it("splits a gap no single game can earn", () => {
    // 23,154 has no single-game solution on a 100 pt song with a 100–435% deck.
    expect(findScoreControlRanges({ targetPoint: 23_154, basicPoint: 100, minEventBonus: 100, maxEventBonus: 435, limit: 0 })).toEqual([])
    const result = plan(0, 23_154)
    expect(result.status).toBe("ok")
    if (result.status === "ok") {
      expect(result.plans[0]!.idleOnly).toBe(true)
      expect(result.plans[0]!.games).toBeGreaterThan(1)
      expect(result.plans.every((candidate) => planTotal(candidate) === 23_154)).toBe(true)
    }
  })

  it("reports the states that have no plan", () => {
    expect(plan(500, 500)).toEqual({ status: "reached", gap: 0 })
    expect(plan(600, 500)).toEqual({ status: "overshot", gap: -100 })
    expect(plan(0, 150)).toEqual({ status: "tooClose", gap: 150, minPoint: 200 })
    expect(plan(0, 1_800_000)).toEqual({ status: "tooFar", gap: 1_800_000, reach: 18_725 * 5 })
  })
})
