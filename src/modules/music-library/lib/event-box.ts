export type EventBoxInfo = {
  eventId: number
  characterId: number
  /** Ordinal of this event among the character's banner events ("N箱"). */
  boxNumber: number
}

type EventBoxCard = { characterId: number; rarity: string }
type EventBoxCandidate = { id: number; startAt: number }

/** Already-normalized inputs (the canonical catalog indexes). */
export type EventBoxCatalogInput = {
  events: readonly { id: number; eventType: string | null; startAt: number | null }[]
  /** eventId → event card links. */
  cardLinksByEvent: ReadonlyMap<number, readonly { cardId: number }[]>
  /** cardId → card (character + rarity). */
  cardsById: ReadonlyMap<number, { characterId: number | null; cardRarityType: string }>
  /** characterId → unit (null for unknown). */
  unitByCharacter: ReadonlyMap<number, string | null>
}

function addEventCardUnit(
  unitsByEvent: Map<number, Set<string>>,
  eventId: number,
  unit: string | null | undefined,
): void {
  if (!unit || unit === "piapro") {
    return
  }
  const units = unitsByEvent.get(eventId) ?? new Set<string>()
  units.add(unit)
  unitsByEvent.set(eventId, units)
}

function collectEventCardInfo(
  cardLinksByEvent: ReadonlyMap<number, readonly { cardId: number }[]>,
  cardById: ReadonlyMap<number, EventBoxCard>,
  unitByCharacter: ReadonlyMap<number, string | null>,
) {
  const bannerCardByEvent = new Map<number, number>()
  const unitsByEvent = new Map<number, Set<string>>()
  for (const [eventId, links] of cardLinksByEvent) {
    for (const { cardId } of links) {
      const card = cardById.get(cardId)
      if (!card) {
        continue
      }

      addEventCardUnit(unitsByEvent, eventId, unitByCharacter.get(card.characterId))
      const existing = bannerCardByEvent.get(eventId)
      if (card.rarity === "rarity_4" && (existing == null || cardId < existing)) {
        bannerCardByEvent.set(eventId, cardId)
      }
    }
  }
  return { bannerCardByEvent, unitsByEvent }
}

function assignEventBoxes(
  events: readonly EventBoxCandidate[],
  bannerCardByEvent: ReadonlyMap<number, number>,
  unitsByEvent: ReadonlyMap<number, Set<string>>,
  cardById: ReadonlyMap<number, EventBoxCard>,
): Map<number, EventBoxInfo> {
  const counters = new Map<number, number>()
  const map = new Map<number, EventBoxInfo>()
  for (const event of events) {
    if ((unitsByEvent.get(event.id)?.size ?? 0) >= 2) {
      continue
    }

    const bannerCardId = bannerCardByEvent.get(event.id)
    const characterId = bannerCardId != null ? cardById.get(bannerCardId)?.characterId ?? null : null
    if (characterId == null) {
      continue
    }

    const boxNumber = (counters.get(characterId) ?? 0) + 1
    counters.set(characterId, boxNumber)
    map.set(event.id, { eventId: event.id, characterId, boxNumber })
  }

  return map
}

/**
 * Community "N箱" (box) counting: a unit event's banner character is the
 * character of its lowest-id 4★ event card, and the box number is the ordinal
 * of that event among the character's banner events, ordered by startAt.
 * Mixed events (event cards spanning multiple non-VS units) and World Link
 * (world_bloom) events count as nobody's box.
 */
export function buildEventBoxMapFromCatalog(input: EventBoxCatalogInput): Map<number, EventBoxInfo> {
  const cardById = new Map<number, EventBoxCard>()
  for (const [id, card] of input.cardsById) {
    if (card.characterId != null) {
      cardById.set(id, { characterId: card.characterId, rarity: card.cardRarityType })
    }
  }

  // eventId -> lowest 4★ cardId, plus the distinct non-VS units of all event
  // cards (two or more units means a mixed event, which is not a box).
  const { bannerCardByEvent, unitsByEvent } = collectEventCardInfo(
    input.cardLinksByEvent,
    cardById,
    input.unitByCharacter,
  )
  const events = input.events
    .filter((event) => event.eventType !== "world_bloom")
    .map((event) => ({ id: event.id, startAt: event.startAt ?? 0 }))
    .sort((a, b) => (a.startAt - b.startAt) || (a.id - b.id))
  return assignEventBoxes(events, bannerCardByEvent, unitsByEvent, cardById)
}

/** musicId -> box info of its earliest linked event. */
export function buildMusicEventBoxMapFromLinks(
  eventIdsByMusic: ReadonlyMap<number, readonly number[]>,
  eventBoxMap: ReadonlyMap<number, EventBoxInfo>,
): Map<number, EventBoxInfo> {
  const map = new Map<number, EventBoxInfo>()
  for (const [musicId, eventIds] of eventIdsByMusic) {
    for (const eventId of eventIds) {
      const info = eventBoxMap.get(eventId)
      if (info == null) {
        continue
      }
      const existing = map.get(musicId)
      if (existing == null || info.eventId < existing.eventId) {
        map.set(musicId, info)
      }
    }
  }

  return map
}
