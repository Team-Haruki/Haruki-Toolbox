/**
 * Picks what the home page shows as "on in the game right now" out of the
 * master data: the event to feature, the limited gachas that are open and
 * the songs that were just added. Pure functions over normalized records.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export interface LiveEventLike {
  id: number
  startAt: number | null
  aggregateAt: number | null
  closedAt?: number | null
}

/**
 * - `running`: between start and the ranking cut-off.
 * - `upcoming`: not started yet.
 * - `ended`: past the cut-off (results and exchange period, or fully closed).
 */
export type LiveEventPhase = "running" | "upcoming" | "ended"

export interface FeaturedEvent<T extends LiveEventLike> {
  event: T
  phase: LiveEventPhase
  /** Start of the next event when the featured one is not it, null when unknown. */
  nextStartAt: number | null
}

export interface FeaturedEventOptions {
  /** Whether an event that has not started may be featured (the spoiler setting). */
  allowUpcoming: boolean
  /** How far ahead an upcoming event is still worth featuring. */
  upcomingWindowMs?: number
}

/**
 * The running event; between events the next one when it may be shown and is
 * near, otherwise the one that just ended.
 */
export function selectFeaturedEvent<T extends LiveEventLike>(
  events: readonly T[],
  now: number,
  options: FeaturedEventOptions,
): FeaturedEvent<T> | null {
  const dated = events.filter((event): event is T & { startAt: number } => event.startAt != null)
  const upcoming = dated
    .filter((event) => event.startAt > now)
    .sort((left, right) => left.startAt - right.startAt)
  const nextStartAt = upcoming[0]?.startAt ?? null

  const running = dated
    .filter((event) => event.startAt <= now && event.aggregateAt != null && now < event.aggregateAt)
    .sort((left, right) => right.startAt - left.startAt)[0]
  if (running) {
    return { event: running, phase: "running", nextStartAt }
  }

  const next = upcoming[0]
  const window = options.upcomingWindowMs ?? 7 * DAY_MS
  if (next && options.allowUpcoming && next.startAt - now <= window) {
    return { event: next, phase: "upcoming", nextStartAt: upcoming[1]?.startAt ?? null }
  }

  const last = dated
    .filter((event) => event.startAt <= now)
    .sort((left, right) => right.startAt - left.startAt)[0]
  return last ? { event: last, phase: "ended", nextStartAt } : null
}

export interface LiveGachaLike {
  id: number
  gachaType: string
  startAt: number | null
  endAt: number | null
}

/** Always-on pools for new or returning players: not news. */
const EVERGREEN_GACHA_TYPES = new Set(["beginner", "subeginner", "sureturn"])
/** A pool that stays open longer than this is a standing offer, not a current one. */
const LIVE_GACHA_MAX_DURATION_MS = 35 * DAY_MS

/** Open, time-limited gachas: pity ("ceil") pools first, then the most recently opened. */
export function selectLiveGachas<T extends LiveGachaLike>(gachas: readonly T[], now: number, limit: number): T[] {
  return gachas
    .filter((gacha): gacha is T & { startAt: number; endAt: number } =>
      gacha.startAt != null
      && gacha.endAt != null
      && gacha.startAt <= now
      && now < gacha.endAt
      && gacha.endAt - gacha.startAt <= LIVE_GACHA_MAX_DURATION_MS
      && !EVERGREEN_GACHA_TYPES.has(gacha.gachaType))
    .sort((left, right) =>
      Number(right.gachaType === "ceil") - Number(left.gachaType === "ceil")
      || right.startAt - left.startAt
      || right.id - left.id)
    .slice(0, limit)
}

export interface LiveSongLike {
  id: number
  publishedAt: number | null
}

/** Songs added within the window, newest first; unreleased ones are left out. */
export function selectRecentSongs<T extends LiveSongLike>(
  songs: readonly T[],
  now: number,
  limit: number,
  windowMs: number = 21 * DAY_MS,
): T[] {
  return songs
    .filter((song): song is T & { publishedAt: number } =>
      song.publishedAt != null && song.publishedAt <= now && now - song.publishedAt <= windowMs)
    .sort((left, right) => right.publishedAt - left.publishedAt || right.id - left.id)
    .slice(0, limit)
}

export interface DurationParts {
  unit: "days" | "hours" | "minutes"
  days: number
  hours: number
  minutes: number
}

/** A span broken down for a two-unit label ("3 天 4 小时"); negative spans count as zero. */
export function splitDuration(ms: number): DurationParts {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60
  return { unit: days > 0 ? "days" : hours > 0 ? "hours" : "minutes", days, hours, minutes }
}
