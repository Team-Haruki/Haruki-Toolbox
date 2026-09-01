import type { SekaiEventItem } from "@/modules/events"

export const GACHA_RELATED_EVENT_TOLERANCE_MS = 3 * 24 * 60 * 60 * 1000

export type GachaRelatedEventReason = "pickup" | "period"

export type GachaRelatedEvent = {
  event: SekaiEventItem
  reason: GachaRelatedEventReason
  /** Pickup cards that are also event cards (pickup matches only). */
  sharedCardIds: number[]
}

type EventCardLinkLike = { eventId: number }

/**
 * Events tied to a gacha: those whose event cards include a pickup, ranked
 * by how many pickups they share; otherwise events whose period overlaps
 * the gacha's within a ±3 day tolerance (limited to the closest few).
 */
export function resolveGachaRelatedEvents(
  gacha: { id: number; startAt: number | null; endAt: number | null; pickupCardIds: readonly number[] },
  events: readonly SekaiEventItem[],
  cardLinksByCard: ReadonlyMap<number, readonly EventCardLinkLike[]>,
  options: { toleranceMs?: number; limit?: number } = {},
): GachaRelatedEvent[] {
  const limit = options.limit ?? 3
  const sharedByEvent = new Map<number, Set<number>>()
  for (const cardId of gacha.pickupCardIds) {
    for (const link of cardLinksByCard.get(cardId) ?? []) {
      let shared = sharedByEvent.get(link.eventId)
      if (!shared) {
        shared = new Set()
        sharedByEvent.set(link.eventId, shared)
      }
      shared.add(cardId)
    }
  }

  if (sharedByEvent.size > 0) {
    const byId = new Map(events.map((event) => [event.id, event]))
    return [...sharedByEvent.entries()]
      .map(([eventId, shared]) => ({ event: byId.get(eventId) ?? null, shared }))
      .filter((entry): entry is { event: SekaiEventItem; shared: Set<number> } => entry.event != null)
      .sort((a, b) => b.shared.size - a.shared.size || (b.event.startAt ?? 0) - (a.event.startAt ?? 0))
      .slice(0, limit)
      .map((entry) => ({
        event: entry.event,
        reason: "pickup" as const,
        sharedCardIds: [...entry.shared].sort((a, b) => a - b),
      }))
  }

  if (gacha.startAt == null) {
    return []
  }
  const tolerance = options.toleranceMs ?? GACHA_RELATED_EVENT_TOLERANCE_MS
  const gachaStart = gacha.startAt
  const gachaEnd = gacha.endAt ?? gacha.startAt
  return events
    .filter((event) => {
      if (event.startAt == null) {
        return false
      }
      const eventEnd = event.aggregateAt ?? event.closedAt ?? event.startAt
      return event.startAt - tolerance <= gachaEnd && eventEnd + tolerance >= gachaStart
    })
    .sort((a, b) => Math.abs((a.startAt ?? 0) - gachaStart) - Math.abs((b.startAt ?? 0) - gachaStart))
    .slice(0, limit)
    .map((event) => ({ event, reason: "period" as const, sharedCardIds: [] }))
}
