/**
 * Figures the overview derives from the data it already holds (the top 100,
 * the border lines and their growth over the selected window). Nothing here
 * fetches; it is plain arithmetic kept out of the components so it can be
 * unit tested.
 */

/** A growth window: how much the score moved and over how many seconds. */
export type GrowthSpan = { growth: number | null; timeDiff: number | null }

/**
 * pt per hour over a growth window, or null when the window has no usable
 * span (fewer than two samples, or a zero-length one).
 */
export function resolveHourlySpeed(span: GrowthSpan | null | undefined): number | null {
  if (span?.growth == null || !span.timeDiff || span.timeDiff <= 0) {
    return null
  }
  return Math.round((span.growth / span.timeDiff) * 3600)
}

/**
 * Seconds until the chaser closes `gap` at the two current speeds (pt/h).
 * null when there is nothing to close or the chaser is not gaining: an
 * estimate that never arrives is not shown as a time.
 */
export function resolveCatchUpSeconds(
  gap: number | null | undefined,
  chaserSpeed: number | null | undefined,
  leaderSpeed: number | null | undefined,
): number | null {
  if (gap == null || gap <= 0 || chaserSpeed == null || leaderSpeed == null) {
    return null
  }
  const closing = chaserSpeed - leaderSpeed
  if (closing <= 0) {
    return null
  }
  return Math.round((gap / closing) * 3600)
}

export type OverviewPoint = {
  rank: number
  score: number
  timestamp: number | null
  /** Growth of the seat or line itself over the window. */
  growth: number | null
  /** pt/h of the seat or line itself. */
  speed: number | null
}

export type OverviewLineRow = OverviewPoint & {
  /** pt this line is behind the line above it in the list (null for the first). */
  gapToPrevious: number | null
  /** Rank of the line above it in the list. */
  previousRank: number | null
  /** This line's score as a share of the first line's, 0–1. */
  shareOfTop: number | null
}

/** Seats inside the top 100 that players watch as lines. */
export const OVERVIEW_KEY_SEATS = [1, 2, 3, 10, 20, 30, 40, 50, 100] as const

/**
 * The line table: the key seats of the top 100 followed by every border
 * line, each with its distance to the line above. Points without a score
 * are left out, and the distance always refers to the line actually shown
 * above, so a missing seat does not produce a wrong gap.
 */
export function buildOverviewLineRows(
  seats: readonly OverviewPoint[],
  borders: readonly OverviewPoint[],
  keySeats: readonly number[] = OVERVIEW_KEY_SEATS,
): OverviewLineRow[] {
  const wanted = new Set(keySeats)
  const points = [
    ...seats.filter((point) => wanted.has(point.rank)),
    ...borders,
  ]
    .filter((point) => Number.isFinite(point.score))
    .sort((a, b) => a.rank - b.rank)

  const top = points[0]?.score ?? null
  return points.map((point, index) => {
    const previous = index > 0 ? points[index - 1]! : null
    return {
      ...point,
      gapToPrevious: previous ? previous.score - point.score : null,
      previousRank: previous?.rank ?? null,
      shareOfTop: top != null && top > 0 ? Math.min(1, Math.max(0, point.score / top)) : null,
    }
  })
}

export type TopActivity = {
  /** Seats with a holder. */
  total: number
  /** Seats whose score changed within the threshold. */
  active: number
}

/** A seat counts as active when its score changed within this many seconds. */
export const ACTIVE_SEAT_THRESHOLD_SECONDS = 15 * 60

/**
 * How many of the listed seats moved recently. A seat's timestamp is when
 * its row last changed, so an old one means the holder is resting.
 */
export function summarizeTopActivity(
  rows: readonly { timestamp: number | null; hasHolder: boolean }[],
  nowSecond: number,
  thresholdSeconds = ACTIVE_SEAT_THRESHOLD_SECONDS,
): TopActivity {
  let total = 0
  let active = 0
  for (const row of rows) {
    if (!row.hasHolder) {
      continue
    }
    total += 1
    if (row.timestamp != null && nowSecond - row.timestamp <= thresholdSeconds) {
      active += 1
    }
  }
  return { total, active }
}

export type FastestHolder = { rank: number; speed: number }

/** The seat whose current holder is gaining fastest (pt/h), if any is gaining. */
export function findFastestHolder(rows: readonly { rank: number; holderSpeed: number | null }[]): FastestHolder | null {
  let best: FastestHolder | null = null
  for (const row of rows) {
    if (row.holderSpeed != null && row.holderSpeed > 0 && (best == null || row.holderSpeed > best.speed)) {
      best = { rank: row.rank, speed: row.holderSpeed }
    }
  }
  return best
}

export type EventProgress = {
  /** 0–1 of the way from start to end. */
  ratio: number
  elapsedSeconds: number
  remainingSeconds: number
  state: "upcoming" | "running" | "ended"
}

/** Where `nowSecond` sits in the event's ranking period; null without both ends. */
export function resolveEventProgress(
  startAt: number | null | undefined,
  endAt: number | null | undefined,
  nowSecond: number,
): EventProgress | null {
  if (startAt == null || endAt == null || endAt <= startAt) {
    return null
  }
  const elapsed = nowSecond - startAt
  const total = endAt - startAt
  if (elapsed < 0) {
    return { ratio: 0, elapsedSeconds: 0, remainingSeconds: total, state: "upcoming" }
  }
  if (nowSecond >= endAt) {
    return { ratio: 1, elapsedSeconds: total, remainingSeconds: 0, state: "ended" }
  }
  return { ratio: elapsed / total, elapsedSeconds: elapsed, remainingSeconds: endAt - nowSecond, state: "running" }
}

export type DurationParts = { days: number; hours: number; minutes: number }

/** A span as whole days, hours and minutes, for "2 d 3 h" style labels. */
export function splitDuration(seconds: number): DurationParts {
  const total = Math.max(0, Math.floor(seconds / 60))
  return {
    days: Math.floor(total / 1440),
    hours: Math.floor((total % 1440) / 60),
    minutes: total % 60,
  }
}

/**
 * A naive end-of-event projection: the current score plus the current speed
 * held for the time left. null without a speed or once the event has ended.
 * It ignores the final rush, so the page labels it as a straight-line value.
 */
export function projectFinalScore(
  score: number | null | undefined,
  speed: number | null | undefined,
  remainingSeconds: number | null | undefined,
): number | null {
  if (score == null || speed == null || remainingSeconds == null || remainingSeconds <= 0 || speed < 0) {
    return null
  }
  return Math.round(score + (speed * remainingSeconds) / 3600)
}
