import { resolveSekaiLiveBoostMultiplier } from "@/shared/sekai/live-boost"

export const EVENT_PLANNER_BOOST_LEVELS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const EVENT_PLANNER_MS_PER_DAY = 86_400_000

const EVENT_PLANNER_NUMBER_SUFFIXES: Readonly<Record<string, number>> = {
  "亿": 1e8,
  "億": 1e8,
  "万": 1e4,
  "w": 1e4,
  "k": 1e3,
}

export type EventPlannerPointParseResult = {
  value: number | null
  invalid: boolean
}

/**
 * Parses human-friendly point inputs such as "1000w", "120万", "1.5亿", "25k".
 * Separators (`,` `_` `，` and spaces) are stripped; the result is rounded
 * half up to an integer. Empty input yields `{ value: null, invalid: false }`.
 */
export function parseEventPlannerPointInput(raw: string): EventPlannerPointParseResult {
  const compact = raw.replace(/[,_，\s]+/g, "")
  if (!compact) {
    return { value: null, invalid: false }
  }

  let multiplier = 1
  let body = compact
  const suffix = EVENT_PLANNER_NUMBER_SUFFIXES[compact.slice(-1).toLowerCase()]
  if (suffix != null) {
    multiplier = suffix
    body = compact.slice(0, -1)
  }

  if (!/^\d+(\.\d+)?$/.test(body)) {
    return { value: null, invalid: true }
  }

  const value = Number(body)
  if (!Number.isFinite(value) || value < 0) {
    return { value: null, invalid: true }
  }

  return { value: Math.round(value * multiplier), invalid: false }
}

export function resolveEventPlannerRemainingPoint(targetPoint: number, currentPoint: number): number {
  return Math.max(0, targetPoint - currentPoint)
}

export type EventPlannerBoostRow = {
  boost: number
  multiplier: number
  pointPerPlay: number
  plays: number
  energy: number
}

/**
 * Builds one row per live-boost level (0-10): point per play, plays needed to
 * cover `remainingPoint`, and total energy cost (`plays * boost`).
 */
export function buildEventPlannerBoostRows(basePoint: number, remainingPoint: number): EventPlannerBoostRow[] {
  return EVENT_PLANNER_BOOST_LEVELS.map((boost) => {
    const multiplier = resolveSekaiLiveBoostMultiplier(boost)
    const pointPerPlay = basePoint * multiplier
    const plays = remainingPoint > 0 && pointPerPlay > 0
      ? Math.ceil(remainingPoint / pointPerPlay)
      : 0
    return {
      boost,
      multiplier,
      pointPerPlay,
      plays,
      energy: plays * boost,
    }
  })
}

export type EventPlannerDailyPointInput = {
  targetPoint: number
  currentPoint: number
  currentPointKnown: boolean
  /** Event start timestamp in milliseconds. */
  startAt: number
  /** Event aggregate (ranking cutoff) timestamp in milliseconds. */
  aggregateAt: number
  now?: number
}

/**
 * Daily pacing ported from Go `eventPlannerDailyPoint`: while an event is live
 * and the current point is known, the remaining points are spread over the
 * remaining time; otherwise the full target is spread over the full duration.
 */
export function resolveEventPlannerDailyPoint(input: EventPlannerDailyPointInput): number {
  const now = input.now ?? Date.now()
  if (input.targetPoint <= 0 || input.aggregateAt <= input.startAt) {
    return 0
  }

  let point = input.targetPoint
  let periodStart = input.startAt
  if (input.currentPointKnown && input.startAt < now && now < input.aggregateAt) {
    point = Math.max(0, input.targetPoint - input.currentPoint)
    periodStart = now
  }

  const durationDays = (input.aggregateAt - periodStart) / EVENT_PLANNER_MS_PER_DAY
  if (durationDays <= 0) {
    return 0
  }

  return Math.ceil(point / durationDays)
}
