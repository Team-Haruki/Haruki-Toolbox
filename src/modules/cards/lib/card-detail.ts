import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export type CardDetailExtras = {
  cardSkillName: string | null
  gachaPhrase: string | null
}

export type CardEventSummary = {
  id: number
  name: string
}

/**
 * Fields the shared CatalogMasterCard normalizer intentionally drops but the
 * detail page still needs. `-` is the master data convention for "no phrase".
 */
export function extractCardDetailExtras(rawCards: unknown, cardId: number): CardDetailExtras {
  const record = normalizeCatalogRecords(rawCards)
    .find((candidate) => normalizeCatalogNumber(candidate.id) === cardId)
  return {
    cardSkillName: normalizeMasterText(record?.cardSkillName),
    gachaPhrase: normalizeMasterText(record?.gachaPhrase),
  }
}

export function buildCardEventIndex(rawEventCards: unknown): Map<number, number[]> {
  const index = new Map<number, number[]>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const cardId = normalizeCatalogNumber(record.cardId)
    const eventId = normalizeCatalogNumber(record.eventId)
    if (cardId == null || eventId == null) {
      continue
    }

    const eventIds = index.get(cardId)
    if (eventIds) {
      if (!eventIds.includes(eventId)) {
        eventIds.push(eventId)
      }
    } else {
      index.set(cardId, [eventId])
    }
  }

  return index
}

export function resolveCardEventSummaries(
  rawEvents: unknown,
  eventIds: readonly number[],
): CardEventSummary[] {
  if (eventIds.length === 0) {
    return []
  }

  const names = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (id != null && eventIds.includes(id)) {
      names.set(id, normalizeCatalogString(record.name))
    }
  }

  return [...eventIds]
    .sort((a, b) => a - b)
    .map((id) => ({ id, name: names.get(id) || `#${id}` }))
}

export function selectSameCharacterCards(
  cards: readonly CatalogMasterCard[],
  card: CatalogMasterCard,
  limit = 12,
): CatalogMasterCard[] {
  if (card.characterId == null) {
    return []
  }

  return cards
    .filter((candidate) => candidate.characterId === card.characterId && candidate.id !== card.id)
    .sort((a, b) => (b.releaseAt ?? 0) - (a.releaseAt ?? 0) || b.id - a.id)
    .slice(0, Math.max(0, limit))
}

function normalizeMasterText(value: unknown): string | null {
  const text = normalizeCatalogString(value)
  return text && text !== "-" ? text : null
}
