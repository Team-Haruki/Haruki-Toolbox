import type { SekaiEventItem } from "@/modules/events/lib/event-filter"
import { resolveEventEndAt } from "@/modules/events/lib/event-list"

const DAY_MS = 24 * 60 * 60 * 1000

/** Period-overlap fallback tolerance on both ends of the event window. */
export const EVENT_GACHA_OVERLAP_MARGIN_MS = 3 * DAY_MS

export type RelatedGachaCandidate = {
  id: number
  startAt: number | null
  endAt: number | null
  pickupCardIds: readonly number[]
}

export type RelatedGachasResult<T> = {
  gachas: T[]
  /** How the gachas were matched; `none` when nothing relates. */
  matchedBy: "pickup" | "period" | "none"
}

/**
 * Gachas related to an event: those whose pickups include an event card,
 * else those whose run overlaps the event window (±3 days). Input order is
 * preserved (the gachas index is newest first).
 */
export function resolveEventRelatedGachas<T extends RelatedGachaCandidate>(
  event: Pick<SekaiEventItem, "startAt" | "aggregateAt" | "closedAt">,
  eventCardIds: ReadonlySet<number>,
  gachas: readonly T[],
): RelatedGachasResult<T> {
  if (eventCardIds.size > 0) {
    const byPickup = gachas.filter((gacha) => gacha.pickupCardIds.some((cardId) => eventCardIds.has(cardId)))
    if (byPickup.length > 0) {
      return { gachas: byPickup, matchedBy: "pickup" }
    }
  }

  const eventStart = event.startAt
  const eventEnd = resolveEventEndAt(event)
  if (eventStart == null || eventEnd == null) {
    return { gachas: [], matchedBy: "none" }
  }
  const windowStart = eventStart - EVENT_GACHA_OVERLAP_MARGIN_MS
  const windowEnd = eventEnd + EVENT_GACHA_OVERLAP_MARGIN_MS
  const byPeriod = gachas.filter((gacha) =>
    gacha.startAt != null
    && gacha.endAt != null
    && gacha.startAt <= windowEnd
    && gacha.endAt >= windowStart,
  )
  return byPeriod.length > 0
    ? { gachas: byPeriod, matchedBy: "period" }
    : { gachas: [], matchedBy: "none" }
}
