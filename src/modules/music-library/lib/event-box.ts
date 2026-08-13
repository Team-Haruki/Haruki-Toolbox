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
 * Community "N箱" (box) counting: a unit event's banner character is the
 * character of its lowest-id 4★ event card, and the box number is the ordinal
 * of that event among the character's banner events, ordered by startAt.
 * Mixed events (event cards spanning multiple non-VS units) and World Link
 * (world_bloom) events count as nobody's box.
 */
export function buildEventBoxMap(
  rawEvents: unknown,
  rawEventCards: unknown,
  rawCards: unknown,
  rawGameCharacters: unknown,
): Map<number, EventBoxInfo> {
  const unitByCharacter = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawGameCharacters)) {
    const id = normalizeCatalogNumber(record.id)
    const unit = normalizeCatalogString(record.unit)
    if (id && unit) {
      unitByCharacter.set(id, unit)
    }
  }

  const cardById = new Map<number, { characterId: number; rarity: string }>()
  for (const record of normalizeCatalogRecords(rawCards)) {
    const id = normalizeCatalogNumber(record.id)
    const characterId = normalizeCatalogNumber(record.characterId)
    if (id && characterId) {
      cardById.set(id, { characterId, rarity: normalizeCatalogString(record.cardRarityType) })
    }
  }

  // eventId -> lowest 4★ cardId, plus the distinct non-VS units of all event
  // cards (two or more units means a mixed event, which is not a box).
  const bannerCardByEvent = new Map<number, number>()
  const unitsByEvent = new Map<number, Set<string>>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const cardId = normalizeCatalogNumber(record.cardId)
    if (!eventId || !cardId) {
      continue
    }

    const card = cardById.get(cardId)
    if (card == null) {
      continue
    }

    const unit = unitByCharacter.get(card.characterId)
    if (unit && unit !== "piapro") {
      let units = unitsByEvent.get(eventId)
      if (!units) {
        units = new Set()
        unitsByEvent.set(eventId, units)
      }
      units.add(unit)
    }

    if (card.rarity !== "rarity_4") {
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
