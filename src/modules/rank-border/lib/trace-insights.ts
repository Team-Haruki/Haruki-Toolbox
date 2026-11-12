/**
 * What a trace says beyond its latest point: how the score was earned game
 * by game, when the player was active or resting, how the rank moved, and
 * who held a seat. A trace has one row per change, oldest first; nothing
 * here fetches, and every function accepts an empty trace.
 */

export type InsightPoint = {
  timestamp: number
  score: number
  rank: number
  userId?: string | null
}

export type GameSummary = {
  /** Score increases in the trace. On a fast-sampled board one increase is about one game. */
  games: number
  totalPt: number
  medianPt: number | null
  maxPt: number | null
  minPt: number | null
}

/**
 * The score increases between consecutive rows. Where the tracker samples
 * every few seconds each increase is one finished game; on a slowly sampled
 * line several games merge into one, which is why the page only shows this
 * for a player's own trace.
 */
export function summarizeGames(trace: readonly InsightPoint[]): GameSummary {
  const gains: number[] = []
  for (let index = 1; index < trace.length; index += 1) {
    const gain = trace[index]!.score - trace[index - 1]!.score
    if (gain > 0) {
      gains.push(gain)
    }
  }
  if (gains.length === 0) {
    return { games: 0, totalPt: 0, medianPt: null, maxPt: null, minPt: null }
  }

  const sorted = [...gains].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return {
    games: gains.length,
    totalPt: gains.reduce((sum, gain) => sum + gain, 0),
    medianPt: sorted.length % 2 === 1 ? sorted[middle]! : Math.round((sorted[middle - 1]! + sorted[middle]!) / 2),
    maxPt: sorted[sorted.length - 1]!,
    minPt: sorted[0]!,
  }
}

/** Two score changes further apart than this belong to different sessions. */
export const SESSION_GAP_SECONDS = 15 * 60

export type ActivitySummary = {
  /** Runs of play with no pause longer than the session gap. */
  sessions: number
  /** Seconds spent inside sessions. */
  activeSeconds: number
  longestSessionSeconds: number
  /** The longest pause between two score changes. */
  longestRestSeconds: number
  /** When the latest session began. */
  currentSessionStart: number | null
  /** Seconds since the last score change. */
  idleSeconds: number | null
  /** Still inside the session gap of the last score change. */
  active: boolean
}

/**
 * Sessions and pauses, read off the gaps between score changes. A pause can
 * also mean the tracker lost sight of the player (they left the tracked
 * ranks), so the page words it as "no score change", not "asleep".
 */
export function summarizeActivity(
  trace: readonly InsightPoint[],
  nowSecond: number,
  gapSeconds = SESSION_GAP_SECONDS,
): ActivitySummary {
  const changes: number[] = []
  for (let index = 1; index < trace.length; index += 1) {
    if (trace[index]!.score > trace[index - 1]!.score) {
      changes.push(trace[index]!.timestamp)
    }
  }
  if (changes.length === 0) {
    return { sessions: 0, activeSeconds: 0, longestSessionSeconds: 0, longestRestSeconds: 0, currentSessionStart: null, idleSeconds: null, active: false }
  }

  let sessions = 1
  let sessionStart = changes[0]!
  let activeSeconds = 0
  let longestSession = 0
  let longestRest = 0
  for (let index = 1; index < changes.length; index += 1) {
    const gap = changes[index]! - changes[index - 1]!
    if (gap > gapSeconds) {
      const length = changes[index - 1]! - sessionStart
      activeSeconds += length
      longestSession = Math.max(longestSession, length)
      longestRest = Math.max(longestRest, gap)
      sessions += 1
      sessionStart = changes[index]!
    }
  }
  const last = changes[changes.length - 1]!
  const lastLength = last - sessionStart
  activeSeconds += lastLength
  longestSession = Math.max(longestSession, lastLength)

  const idleSeconds = Math.max(0, nowSecond - last)
  return {
    sessions,
    activeSeconds,
    longestSessionSeconds: longestSession,
    longestRestSeconds: longestRest,
    currentSessionStart: sessionStart,
    idleSeconds,
    active: idleSeconds <= gapSeconds,
  }
}

export type RankHistory = {
  /** The best (lowest-numbered) rank in the trace. */
  best: number | null
  bestAt: number | null
  /** The worst (highest-numbered) rank in the trace. */
  worst: number | null
  /** How many times the rank changed between consecutive rows. */
  changes: number
}

export function summarizeRankHistory(trace: readonly InsightPoint[]): RankHistory {
  let best: number | null = null
  let bestAt: number | null = null
  let worst: number | null = null
  let changes = 0
  for (let index = 0; index < trace.length; index += 1) {
    const point = trace[index]!
    if (!Number.isFinite(point.rank) || point.rank <= 0) {
      continue
    }
    if (best == null || point.rank < best) {
      best = point.rank
      bestAt = point.timestamp
    }
    if (worst == null || point.rank > worst) {
      worst = point.rank
    }
    if (index > 0 && trace[index - 1]!.rank !== point.rank) {
      changes += 1
    }
  }
  return { best, bestAt, worst, changes }
}

export type HolderSummary = {
  /** Different players that held the seat. */
  holders: number
  /** Times the seat passed from one player to another. */
  turnovers: number
  /** When the current holder took the seat (the start of their latest unbroken hold). */
  heldSince: number | null
  /** The longest unbroken hold by one player, in seconds. */
  longestHoldSeconds: number
}

/**
 * Who held a seat, from the holder recorded on each row of the seat's own
 * trace. Rows without a holder (a border line outside the top 100) are
 * skipped; null when the trace names no holder at all.
 */
export function summarizeHolders(trace: readonly InsightPoint[], nowSecond: number): HolderSummary | null {
  const rows = trace.filter((point) => point.userId)
  if (rows.length === 0) {
    return null
  }

  const holders = new Set<string>()
  let turnovers = 0
  let holdStart = rows[0]!.timestamp
  let longestHold = 0
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!
    holders.add(row.userId!)
    if (index > 0 && rows[index - 1]!.userId !== row.userId) {
      turnovers += 1
      longestHold = Math.max(longestHold, row.timestamp - holdStart)
      holdStart = row.timestamp
    }
  }
  longestHold = Math.max(longestHold, Math.max(0, nowSecond - holdStart))
  return { holders: holders.size, turnovers, heldSince: holdStart, longestHoldSeconds: longestHold }
}

export type Milestone = {
  rank: number
  /** pt still needed to reach that line. */
  gap: number
}

/**
 * The next lines above a score, nearest first: how far it is to T100, T50,
 * T10… Only lines with a higher score count, and at most `limit` are kept.
 */
export function resolveMilestones(
  score: number | null | undefined,
  lines: readonly { rank: number; score: number }[],
  limit = 3,
): Milestone[] {
  if (score == null) {
    return []
  }
  return lines
    .filter((line) => line.score > score)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((line) => ({ rank: line.rank, gap: line.score - score }))
}

/** The nearest line below a score: how much room there is before being caught. */
export function resolveCushion(
  score: number | null | undefined,
  lines: readonly { rank: number; score: number }[],
): Milestone | null {
  if (score == null) {
    return null
  }
  let nearest: { rank: number; score: number } | null = null
  for (const line of lines) {
    if (line.score < score && (nearest == null || line.score > nearest.score)) {
      nearest = line
    }
  }
  return nearest ? { rank: nearest.rank, gap: score - nearest.score } : null
}

export type DaySummary = {
  /** Unix seconds of the day's local midnight. */
  dayStart: number
  /** pt earned during the day. */
  gained: number
  /** Score increases during the day. */
  games: number
  /** Seconds between score changes that were close enough to be one session. */
  activeSeconds: number
  /** The largest single increase of the day. */
  bestPt: number
  /** Rank and score at the day's last row. */
  endRank: number
  endScore: number
}

/**
 * One row per local day, oldest first. An increase belongs to the day it
 * landed in; the time since the previous increase counts as play time when it
 * is within the session gap. `dayOf` maps a timestamp to its local midnight
 * (injected so the grouping can be tested without a time zone).
 */
export function summarizeDays(
  trace: readonly InsightPoint[],
  dayOf: (timestamp: number) => number,
  gapSeconds = SESSION_GAP_SECONDS,
): DaySummary[] {
  const days = new Map<number, DaySummary>()
  let lastChangeAt: number | null = null
  for (let index = 0; index < trace.length; index += 1) {
    const point = trace[index]!
    const dayStart = dayOf(point.timestamp)
    let day = days.get(dayStart)
    if (!day) {
      day = { dayStart, gained: 0, games: 0, activeSeconds: 0, bestPt: 0, endRank: point.rank, endScore: point.score }
      days.set(dayStart, day)
    }
    day.endRank = point.rank
    day.endScore = point.score

    const gain = index > 0 ? point.score - trace[index - 1]!.score : 0
    if (gain <= 0) {
      continue
    }
    day.gained += gain
    day.games += 1
    day.bestPt = Math.max(day.bestPt, gain)
    if (lastChangeAt != null && point.timestamp - lastChangeAt <= gapSeconds) {
      day.activeSeconds += point.timestamp - lastChangeAt
    }
    lastChangeAt = point.timestamp
  }
  return [...days.values()].sort((a, b) => a.dayStart - b.dayStart)
}

export type HolderRun = {
  userId: string
  /** When this player took the seat. */
  from: number
  /** When the next player took it; null while they still hold it. */
  to: number | null
  /** The seat's score when they took it. */
  score: number
}

/** The seat's holders in order, one entry per unbroken hold, newest first, at most `limit`. */
export function listHolderRuns(trace: readonly InsightPoint[], limit = Number.POSITIVE_INFINITY): HolderRun[] {
  const runs: HolderRun[] = []
  for (const point of trace) {
    if (!point.userId) {
      continue
    }
    const last = runs[runs.length - 1]
    if (last?.userId === point.userId) {
      continue
    }
    if (last) {
      last.to = point.timestamp
    }
    runs.push({ userId: point.userId, from: point.timestamp, to: null, score: point.score })
  }
  return runs.reverse().slice(0, limit)
}
