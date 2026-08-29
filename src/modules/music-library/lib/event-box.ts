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

type EventBoxCard = { characterId: number; rarity: string }
type EventBoxCandidate = { id: number; startAt: number }

function buildUnitByCharacter(rawGameCharacters: unknown): Map<number, string> {
  const map = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawGameCharacters)) {
    const id = normalizeCatalogNumber(record.id)
    const unit = normalizeCatalogString(record.unit)
    if (id && unit) {
      map.set(id, unit)
    }
  }
  return map
}

function buildEventBoxCardMap(rawCards: unknown): Map<number, EventBoxCard> {
  const map = new Map<number, EventBoxCard>()
  for (const record of normalizeCatalogRecords(rawCards)) {
    const id = normalizeCatalogNumber(record.id)
    const characterId = normalizeCatalogNumber(record.characterId)
    if (id && characterId) {
      map.set(id, { characterId, rarity: normalizeCatalogString(record.cardRarityType) })
    }
  }
  return map
}

function addEventCardUnit(
  unitsByEvent: Map<number, Set<string>>,
  eventId: number,
  unit: string | undefined,
): void {
  if (!unit || unit === "piapro") {
    return
  }
  const units = unitsByEvent.get(eventId) ?? new Set<string>()
  units.add(unit)
  unitsByEvent.set(eventId, units)
}

function collectEventCardInfo(
  rawEventCards: unknown,
  cardById: ReadonlyMap<number, EventBoxCard>,
  unitByCharacter: ReadonlyMap<number, string>,
) {
  const bannerCardByEvent = new Map<number, number>()
  const unitsByEvent = new Map<number, Set<string>>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const cardId = normalizeCatalogNumber(record.cardId)
    const card = cardId ? cardById.get(cardId) : undefined
    if (!eventId || !cardId || !card) {
      continue
    }

    addEventCardUnit(unitsByEvent, eventId, unitByCharacter.get(card.characterId))
    const existing = bannerCardByEvent.get(eventId)
    if (card.rarity === "rarity_4" && (existing == null || cardId < existing)) {
      bannerCardByEvent.set(eventId, cardId)
    }
  }
  return { bannerCardByEvent, unitsByEvent }
}

function listEventBoxCandidates(rawEvents: unknown): EventBoxCandidate[] {
  const events: EventBoxCandidate[] = []
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (id && normalizeCatalogString(record.eventType) !== "world_bloom") {
      events.push({ id, startAt: normalizeCatalogNumber(record.startAt) ?? 0 })
    }
  }
  return events.sort((a, b) => (a.startAt - b.startAt) || (a.id - b.id))
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
  const unitByCharacter = buildUnitByCharacter(rawGameCharacters)
  const cardById = buildEventBoxCardMap(rawCards)

  // eventId -> lowest 4★ cardId, plus the distinct non-VS units of all event
  // cards (two or more units means a mixed event, which is not a box).
  const { bannerCardByEvent, unitsByEvent } = collectEventCardInfo(
    rawEventCards,
    cardById,
    unitByCharacter,
  )
  const events = listEventBoxCandidates(rawEvents)

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
