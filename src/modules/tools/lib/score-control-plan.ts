import {
  SCORE_CONTROL_BOOST_MULTIPLIERS,
  SCORE_CONTROL_MAX_SCORE,
  type ScoreControlRange,
} from "./score-control"

/**
 * Planning a gap: the player is at one event pt total and wants to stop at
 * another, exactly. A single game cannot usually do it, so the gap is split
 * into a few games, each a (deck bonus, Live Boost, score window) that earns a
 * known amount. Plans lean on games that need no playing at all: a score under
 * 20,000 leaves the score bonus at zero, so letting the song run earns exactly
 * `basic pt × (100 + bonus)% × boost multiplier`.
 */

/** Every 20,000 score adds 1% to the game's pt. */
export const SCORE_CONTROL_SCORE_STEP = 20_000

const MAX_SCORE_TIER = Math.floor(SCORE_CONTROL_MAX_SCORE / SCORE_CONTROL_SCORE_STEP)

/**
 * The highest score a plan will ask a player to stop at. Above it the window
 * depends on the deck's strength and on playing most of the song cleanly,
 * which is not something to build an exact total on.
 */
export const SCORE_CONTROL_PLAN_MAX_SCORE = 1_000_000

/** One game and what it earns. */
export type ScoreControlOutcome = ScoreControlRange & { point: number }

export type ScoreControlPlanStep = {
  /** How many times to play this game. */
  count: number
  outcome: ScoreControlOutcome
}

export type ScoreControlPlanTag = "fewestGames" | "leastEnergy" | "singleDeck"

export type ScoreControlPlan = {
  /** Games in playing order: the repeated one first, the finishing one last. */
  steps: ScoreControlPlanStep[]
  games: number
  /** Live Boost spent over the whole plan. */
  energy: number
  /** Different deck bonuses the plan needs, i.e. decks to build. */
  decks: number
  /** Every game can be left to run (score under 20,000). */
  idleOnly: boolean
  tags: ScoreControlPlanTag[]
}

export type ScoreControlPlanResult =
  | { status: "ok"; gap: number; plans: ScoreControlPlan[] }
  /** Already on the target. */
  | { status: "reached"; gap: 0 }
  /** Past the target: event pt never goes down. */
  | { status: "overshot"; gap: number }
  /** Less than the smallest game earns: one more game overshoots. */
  | { status: "tooClose"; gap: number; minPoint: number }
  /** More than the allowed games can cover: play normally first, down to `reach`. */
  | { status: "tooFar"; gap: number; reach: number }
  /** Within range, but no combination lands on it with these settings. */
  | { status: "none"; gap: number }

export type ScoreControlSettings = {
  basicPoint: number
  minEventBonus: number
  maxEventBonus: number
  /** Live Boost levels the player is willing to use. */
  boosts: readonly number[]
}

export type PlanScoreControlInput = ScoreControlSettings & {
  currentPoint: number
  targetPoint: number
  maxGames: number
  /** How many plans to return (default 5). */
  limit?: number
}

/** A game that needs no playing: any score under 20,000 will do. */
export function isIdleRange(range: Pick<ScoreControlRange, "scoreMin">): boolean {
  return range.scoreMin === 0
}

/**
 * Easier first: no playing at all, then the lowest score window (stopping
 * early is easier than landing a precise high score), then less Live Boost,
 * then the lower bonus (anyone can field a weaker deck; not everyone owns the
 * cards for a stronger one).
 */
export function compareScoreControlEase(a: ScoreControlRange, b: ScoreControlRange): number {
  return a.scoreMin - b.scoreMin || a.boost - b.boost || a.eventBonus - b.eventBonus
}

export function sortScoreControlRangesByEase<T extends ScoreControlRange>(ranges: readonly T[]): T[] {
  return [...ranges].sort(compareScoreControlEase)
}

function basePoint(tier: number, eventBonus: number, basicPoint: number): number {
  return Math.floor((100 + tier) * (100 + eventBonus) * basicPoint / 10_000)
}

/** The game that needs no playing for this deck and boost, or null when it earns nothing. */
function idleOutcome(eventBonus: number, boost: number, basicPoint: number): ScoreControlOutcome | null {
  const boostMultiplier = SCORE_CONTROL_BOOST_MULTIPLIERS[boost]
  const base = basePoint(0, eventBonus, basicPoint)
  if (!boostMultiplier || base <= 0) {
    return null
  }
  // Low-rate songs can hold the same pt across several score steps.
  let lastTier = 0
  while (lastTier < MAX_SCORE_TIER && basePoint(lastTier + 1, eventBonus, basicPoint) === base) {
    lastTier += 1
  }
  return {
    eventBonus,
    boost,
    boostMultiplier,
    scoreMin: 0,
    scoreMax: Math.min(SCORE_CONTROL_MAX_SCORE, (lastTier + 1) * SCORE_CONTROL_SCORE_STEP - 1),
    point: base * boostMultiplier,
  }
}

/**
 * The score window in which this deck and boost earn exactly `point`, or null
 * when no score does. Solved directly from the pt formula, so a planner can
 * ask it thousands of times.
 */
export function solveScoreControlOutcome(
  point: number,
  eventBonus: number,
  boost: number,
  basicPoint: number,
): ScoreControlOutcome | null {
  const boostMultiplier = SCORE_CONTROL_BOOST_MULTIPLIERS[boost]
  if (!boostMultiplier || point <= 0 || point % boostMultiplier !== 0) {
    return null
  }
  const base = point / boostMultiplier
  const perTier = (100 + eventBonus) * basicPoint
  // The lowest tier whose pt reaches `base`, then the last tier still on it.
  const firstTier = Math.max(0, Math.ceil((base * 10_000) / perTier) - 100)
  if (firstTier > MAX_SCORE_TIER || basePoint(firstTier, eventBonus, basicPoint) !== base) {
    return null
  }
  const lastTier = Math.min(MAX_SCORE_TIER, Math.ceil(((base + 1) * 10_000) / perTier) - 101)
  return {
    eventBonus,
    boost,
    boostMultiplier,
    scoreMin: firstTier * SCORE_CONTROL_SCORE_STEP,
    scoreMax: Math.min(SCORE_CONTROL_MAX_SCORE, (lastTier + 1) * SCORE_CONTROL_SCORE_STEP - 1),
    point,
  }
}

function normalizeBoosts(boosts: readonly number[]): number[] {
  return [...new Set(boosts)]
    .filter((boost) => SCORE_CONTROL_BOOST_MULTIPLIERS[boost] != null)
    .sort((a, b) => a - b)
}

/**
 * The least and the most one game can earn with these settings. The page
 * shows the range beside the single-game field, and uses the top to notice a
 * total that was typed where a single game's pt belongs.
 */
export function resolveScoreControlPointBounds(settings: ScoreControlSettings): { min: number; max: number } | null {
  const boosts = normalizeBoosts(settings.boosts)
  if (boosts.length === 0 || settings.basicPoint <= 0 || settings.maxEventBonus < settings.minEventBonus) {
    return null
  }
  const min = basePoint(0, settings.minEventBonus, settings.basicPoint) * SCORE_CONTROL_BOOST_MULTIPLIERS[boosts[0]!]!
  const max = basePoint(MAX_SCORE_TIER, settings.maxEventBonus, settings.basicPoint)
    * SCORE_CONTROL_BOOST_MULTIPLIERS[boosts[boosts.length - 1]!]!
  return min > 0 ? { min, max } : null
}

type Candidate = Omit<ScoreControlPlan, "tags">

/** Preference between two plans of the same shape: the easier games, then the weaker deck. */
function comparePlanDetail(a: Candidate, b: Candidate): number {
  for (let index = 0; index < Math.min(a.steps.length, b.steps.length); index += 1) {
    const order = compareScoreControlEase(a.steps[index]!.outcome, b.steps[index]!.outcome)
    if (order !== 0) {
      return order
    }
  }
  return 0
}

/** The default order: nothing to play, then fewer games, fewer decks, less Live Boost. */
function comparePlans(a: Candidate, b: Candidate): number {
  return Number(b.idleOnly) - Number(a.idleOnly)
    || a.games - b.games
    || a.decks - b.decks
    || a.energy - b.energy
    || comparePlanDetail(a, b)
}

function buildCandidate(main: ScoreControlOutcome, count: number, last: ScoreControlOutcome | null): Candidate {
  // A finishing game identical to the repeated one is just one more of it.
  const sameGame = last != null
    && last.eventBonus === main.eventBonus
    && last.boost === main.boost
    && last.scoreMin === main.scoreMin
  const finisher = sameGame ? null : last
  if (sameGame) {
    count += 1
  }
  const steps: ScoreControlPlanStep[] = [{ count, outcome: main }]
  if (finisher) {
    steps.push({ count: 1, outcome: finisher })
  }
  return {
    steps,
    games: count + (finisher ? 1 : 0),
    energy: main.boost * count + (finisher?.boost ?? 0),
    decks: finisher && finisher.eventBonus !== main.eventBonus ? 2 : 1,
    idleOnly: isIdleRange(main) && (!finisher || isIdleRange(finisher)),
  }
}

/**
 * Split the gap between two pt totals into at most `maxGames` games.
 *
 * Three shapes are searched, which between them cover what a player would
 * actually do: one game that lands on the gap; the same idle game repeated
 * with one finishing game on the same deck (any boost, any score window); and
 * the same idle game repeated with one idle finishing game on a second deck.
 * The repeated game is always an idle one: a plan that asks for the same
 * precise score five times is not a plan.
 *
 * The cheapest plan of each shape is kept, and the result names the ones
 * worth choosing between: the fewest games, the least Live Boost, a single
 * deck. Score windows above `SCORE_CONTROL_PLAN_MAX_SCORE` are never planned.
 */
export function planScoreControl(input: PlanScoreControlInput): ScoreControlPlanResult {
  const gap = Math.round(input.targetPoint - input.currentPoint)
  if (gap === 0) {
    return { status: "reached", gap: 0 }
  }
  if (gap < 0) {
    return { status: "overshot", gap }
  }

  const boosts = normalizeBoosts(input.boosts)
  const bounds = resolveScoreControlPointBounds(input)
  const maxGames = Math.max(1, Math.floor(input.maxGames))
  if (!bounds || boosts.length === 0) {
    return { status: "none", gap }
  }
  if (gap < bounds.min) {
    return { status: "tooClose", gap, minPoint: bounds.min }
  }

  // Every idle game the settings allow, and the easiest one for each pt value.
  const idleGames: ScoreControlOutcome[] = []
  const idleByPoint = new Map<number, ScoreControlOutcome>()
  for (let eventBonus = input.minEventBonus; eventBonus <= input.maxEventBonus; eventBonus += 1) {
    for (const boost of boosts) {
      const outcome = idleOutcome(eventBonus, boost, input.basicPoint)
      if (!outcome) {
        continue
      }
      idleGames.push(outcome)
      const known = idleByPoint.get(outcome.point)
      if (!known || compareScoreControlEase(outcome, known) < 0) {
        idleByPoint.set(outcome.point, outcome)
      }
    }
  }

  // The cheapest candidate per shape (games, decks, idle or not), so thousands
  // of near-identical plans collapse to the handful worth choosing between.
  const byShape = new Map<string, Candidate>()
  const consider = (candidate: Candidate) => {
    if (candidate.games > maxGames || candidate.steps.some((step) => step.outcome.scoreMin > SCORE_CONTROL_PLAN_MAX_SCORE)) {
      return
    }
    const shape = `${candidate.games}|${candidate.decks}|${candidate.idleOnly ? 1 : 0}`
    const known = byShape.get(shape)
    if (!known || (candidate.energy - known.energy || comparePlanDetail(candidate, known)) < 0) {
      byShape.set(shape, candidate)
    }
  }

  // One game, played to a score window if it has to be.
  for (let eventBonus = input.minEventBonus; eventBonus <= input.maxEventBonus; eventBonus += 1) {
    for (const boost of boosts) {
      const outcome = solveScoreControlOutcome(gap, eventBonus, boost, input.basicPoint)
      if (outcome) {
        consider(buildCandidate(outcome, 1, null))
      }
    }
  }

  let maxIdlePoint = 0
  for (const main of idleGames) {
    maxIdlePoint = Math.max(maxIdlePoint, main.point)
    for (let count = 1; count <= maxGames; count += 1) {
      const rest = gap - main.point * count
      if (rest < 0) {
        break
      }
      if (rest === 0) {
        if (count > 1) {
          consider(buildCandidate(main, count, null))
        }
        break
      }
      if (count === maxGames) {
        break
      }

      // Finish on the same deck: another boost, or a score window.
      let sameDeck: ScoreControlOutcome | null = null
      for (const boost of boosts) {
        const outcome = solveScoreControlOutcome(rest, main.eventBonus, boost, input.basicPoint)
        if (outcome && (!sameDeck || compareScoreControlEase(outcome, sameDeck) < 0)) {
          sameDeck = outcome
        }
      }
      if (sameDeck) {
        consider(buildCandidate(main, count, sameDeck))
      }

      // Finish with an idle game on a second deck.
      const otherDeck = idleByPoint.get(rest)
      if (otherDeck && otherDeck.eventBonus !== main.eventBonus) {
        consider(buildCandidate(main, count, otherDeck))
      }
    }
  }

  const candidates = [...byShape.values()].sort(comparePlans)
  if (candidates.length === 0) {
    return gap > maxIdlePoint * maxGames
      ? { status: "tooFar", gap, reach: maxIdlePoint * maxGames }
      : { status: "none", gap }
  }

  // The named picks come from the plans with nothing to play when there are
  // any: one game fewer is no bargain if it means landing a precise score.
  const idlePlans = candidates.filter((candidate) => candidate.idleOnly)
  const pool = idlePlans.length > 0 ? idlePlans : candidates
  const pick = (order: (a: Candidate, b: Candidate) => number, from: Candidate[] = pool) =>
    from.length > 0 ? [...from].sort((a, b) => order(a, b) || comparePlans(a, b))[0]! : null
  const tagged: Array<[ScoreControlPlanTag, Candidate | null]> = [
    ["fewestGames", pick((a, b) => a.games - b.games)],
    ["leastEnergy", pick((a, b) => a.energy - b.energy)],
    ["singleDeck", pick(() => 0, pool.filter((candidate) => candidate.decks === 1))],
  ]

  const limit = Math.max(1, input.limit ?? 5)
  const chosen: Candidate[] = []
  for (const candidate of [...tagged.map(([, plan]) => plan), ...candidates]) {
    if (candidate && !chosen.includes(candidate) && chosen.length < limit) {
      chosen.push(candidate)
    }
  }

  return {
    status: "ok",
    gap,
    plans: chosen.sort(comparePlans).map((candidate) => ({
      ...candidate,
      tags: tagged.filter(([, plan]) => plan === candidate).map(([tag]) => tag),
    })),
  }
}
