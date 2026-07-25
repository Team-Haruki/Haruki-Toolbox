import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export type EventBoxInfo = {
  eventId: number
  characterId: number
  /** Ordinal of this event among the character's banner events ("N箱"). */
  boxNumber: number
}

/**
 * Community "N箱" (box) counting: a regular event's banner character is the
 * character of its lowest-id 4★ event card, and the box number is the ordinal
 * of that event among the character's banner events, ordered by startAt.
 * World Link (world_bloom) events feature a whole unit and count as nobody's
 * box.
 */
export function buildEventBoxMap(
  rawEvents: unknown,
  rawEventCards: unknown,
  rawCards: unknown,
): Map<number, EventBoxInfo> {
  const cardById = new Map<number, { characterId: number; rarity: string }>()
  for (const record of normalizeCatalogRecords(rawCards)) {
    const id = normalizeCatalogNumber(record.id)
    const characterId = normalizeCatalogNumber(record.characterId)
    if (id && characterId) {
      cardById.set(id, { characterId, rarity: normalizeCatalogString(record.cardRarityType) })
    }
  }

  // eventId -> lowest 4★ cardId among its event cards.
  const bannerCardByEvent = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const cardId = normalizeCatalogNumber(record.cardId)
    if (!eventId || !cardId) {
      continue
    }

    const card = cardById.get(cardId)
    if (card == null || card.rarity !== "rarity_4") {
      continue
    }

    const existing = bannerCardByEvent.get(eventId)
    if (existing == null || cardId < existing) {
      bannerCardByEvent.set(eventId, cardId)
    }
  }

  const events: Array<{ id: number; startAt: number }> = []
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (!id || normalizeCatalogString(record.eventType) === "world_bloom") {
      continue
    }

    events.push({ id, startAt: normalizeCatalogNumber(record.startAt) ?? 0 })
  }
  events.sort((a, b) => (a.startAt - b.startAt) || (a.id - b.id))

  const counters = new Map<number, number>()
  const map = new Map<number, EventBoxInfo>()
  for (const event of events) {
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

/** musicId -> box info of its earliest linked event. */
export function buildMusicEventBoxMap(
  rawEventMusics: unknown,
  eventBoxMap: ReadonlyMap<number, EventBoxInfo>,
): Map<number, EventBoxInfo> {
  const map = new Map<number, EventBoxInfo>()
  for (const record of normalizeCatalogRecords(rawEventMusics)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const eventId = normalizeCatalogNumber(record.eventId)
    if (!musicId || !eventId) {
      continue
    }

    const info = eventBoxMap.get(eventId)
    if (info == null) {
      continue
    }

    const existing = map.get(musicId)
    if (existing == null || info.eventId < existing.eventId) {
      map.set(musicId, info)
    }
  }

  return map
}
