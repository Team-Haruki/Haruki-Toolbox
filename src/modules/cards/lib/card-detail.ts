import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { CatalogGacha } from "@/modules/gachas/lib/gacha-catalog"

export type CardDetailExtras = {
  cardSkillName: string | null
  gachaPhrase: string | null
}

export type CardEventSummary = {
  id: number
  name: string
  assetbundleName: string | null
  startAt: number | null
  aggregateAt: number | null
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

  const records = new Map<number, Omit<CardEventSummary, "id">>()
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (id != null && eventIds.includes(id)) {
      records.set(id, {
        name: normalizeCatalogString(record.name),
        assetbundleName: normalizeCatalogString(record.assetbundleName) || null,
        startAt: normalizeCatalogNumber(record.startAt),
        aggregateAt: normalizeCatalogNumber(record.aggregateAt),
      })
    }
  }

  return [...eventIds]
    .sort((a, b) => a - b)
    .map((id) => {
      const record = records.get(id)
      return {
        id,
        name: record?.name || `#${id}`,
        assetbundleName: record?.assetbundleName ?? null,
        startAt: record?.startAt ?? null,
        aggregateAt: record?.aggregateAt ?? null,
      }
    })
}

export type CardCostumeColor = {
  costume3dId: number
  colorId: number | null
  colorName: string
  assetbundleName: string
}

export type CardCostumeGroup = {
  costume3dGroupId: number
  name: string
  colors: CardCostumeColor[]
}

/**
 * Costume groups unlocked by a card, with one entry per body color variant.
 * Groups without body parts (e.g. hair-only unlocks) fall back to whatever
 * parts they have so the group still renders.
 */
export function resolveCardCostumeGroups(
  rawCardCostume3ds: unknown,
  rawCostume3ds: unknown,
  cardId: number,
): CardCostumeGroup[] {
  const linkedCostumeIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawCardCostume3ds)) {
    const linkedCardId = normalizeCatalogNumber(record.cardId)
    const costume3dId = normalizeCatalogNumber(record.costume3dId)
    if (linkedCardId === cardId && costume3dId != null) {
      linkedCostumeIds.add(costume3dId)
    }
  }
  if (linkedCostumeIds.size === 0) {
    return []
  }

  type CostumeRecord = {
    id: number
    costume3dGroupId: number
    partType: string
    colorId: number | null
    colorName: string
    name: string
    assetbundleName: string
  }
  const groupIds = new Set<number>()
  const recordsByGroup = new Map<number, CostumeRecord[]>()
  for (const record of normalizeCatalogRecords(rawCostume3ds)) {
    const id = normalizeCatalogNumber(record.id)
    const groupId = normalizeCatalogNumber(record.costume3dGroupId)
    if (id == null || groupId == null) {
      continue
    }

    const records = recordsByGroup.get(groupId) ?? []
    records.push({
      id,
      costume3dGroupId: groupId,
      partType: normalizeCatalogString(record.partType),
      colorId: normalizeCatalogNumber(record.colorId),
      colorName: normalizeCatalogString(record.colorName),
      name: normalizeCatalogString(record.name),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
    })
    recordsByGroup.set(groupId, records)
    if (linkedCostumeIds.has(id)) {
      groupIds.add(groupId)
    }
  }

  const groups: CardCostumeGroup[] = []
  for (const groupId of [...groupIds].sort((a, b) => a - b)) {
    const records = recordsByGroup.get(groupId) ?? []
    const bodies = records.filter((record) => record.partType === "body" && record.assetbundleName)
    const candidates = bodies.length > 0
      ? bodies
      : records.filter((record) => record.assetbundleName)
    if (candidates.length === 0) {
      continue
    }

    const seenColors = new Set<string>()
    const colors: CardCostumeColor[] = []
    for (const record of [...candidates].sort((a, b) => (a.colorId ?? a.id) - (b.colorId ?? b.id))) {
      if (seenColors.has(record.assetbundleName)) {
        continue
      }
      seenColors.add(record.assetbundleName)
      colors.push({
        costume3dId: record.id,
        colorId: record.colorId,
        colorName: record.colorName,
        assetbundleName: record.assetbundleName,
      })
    }

    groups.push({
      costume3dGroupId: groupId,
      name: candidates.find((record) => record.name)?.name || `#${groupId}`,
      colors,
    })
  }

  return groups
}

/** Gachas that pick up the card, ordered by start time. */
export function selectCardPickupGachas(
  gachas: readonly CatalogGacha[],
  cardId: number,
): CatalogGacha[] {
  return gachas
    .filter((gacha) => gacha.pickups.some((pickup) => pickup.cardId === cardId))
    .sort((a, b) => (a.startAt ?? 0) - (b.startAt ?? 0) || a.id - b.id)
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
