import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  SEKAI_CARD_ATTRS,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import { CARD_RARITY_TYPES, isCardRarityType, isCardUnreleased, type CardRarityType } from "./card-filter"

/** Normalized entry from the user's suite `userCards` record. */
export type UserCardRecord = {
  cardId: number
  level: number
  masterRank: number
  skillLevel: number
  specialTrainingStatus: string
  defaultImage: string
}

export const CARD_OWNERSHIP_FILTERS = ["all", "owned", "missing"] as const

export type CardOwnershipFilter = (typeof CARD_OWNERSHIP_FILTERS)[number]

export const CARD_BOX_GROUP_MODES = ["character", "attr", "all"] as const

export type CardBoxGroupMode = (typeof CARD_BOX_GROUP_MODES)[number]

export type CardBoxGroup<K> = {
  key: K
  cards: CatalogMasterCard[]
  owned: number
  total: number
}

export type RarityBucket = {
  owned: number
  total: number
}

export type CharacterDistributionRow = {
  characterId: number
  owned: number
  total: number
  percent: number
  rarityBuckets: Record<CardRarityType, RarityBucket>
}

export type AttrDistributionRow = {
  attr: string
  owned: number
  total: number
  percent: number
}

export type CollectionSummary = {
  owned: number
  total: number
  percent: number
}

/** Tolerantly parses the raw suite `userCards` value into typed records. */
export function normalizeUserCards(raw: unknown): UserCardRecord[] {
  const records: UserCardRecord[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const cardId = normalizeCatalogNumber(record.cardId)
    if (!cardId) {
      continue
    }

    records.push({
      cardId,
      level: normalizeCatalogNumber(record.level) ?? 0,
      masterRank: normalizeCatalogNumber(record.masterRank) ?? 0,
      skillLevel: normalizeCatalogNumber(record.skillLevel) ?? 0,
      specialTrainingStatus: normalizeCatalogString(record.specialTrainingStatus),
      defaultImage: normalizeCatalogString(record.defaultImage),
    })
  }

  return records
}

export function buildOwnedCardMap(userCards: readonly UserCardRecord[]): Map<number, UserCardRecord> {
  const map = new Map<number, UserCardRecord>()
  for (const record of userCards) {
    map.set(record.cardId, record)
  }

  return map
}

export function isCardTrained(record: Pick<UserCardRecord, "specialTrainingStatus">): boolean {
  return record.specialTrainingStatus === "done"
}

/** Keeps only cards already released on the server (releaseAt <= now, or unknown). */
export function filterReleasedCards(
  cards: readonly CatalogMasterCard[],
  now = Date.now(),
): CatalogMasterCard[] {
  return cards.filter((card) => !isCardUnreleased(card.releaseAt, now))
}

export function applyOwnershipFilter(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
  filter: CardOwnershipFilter,
): CatalogMasterCard[] {
  if (filter === "owned") {
    return cards.filter((card) => ownedMap.has(card.id))
  }

  if (filter === "missing") {
    return cards.filter((card) => !ownedMap.has(card.id))
  }

  return [...cards]
}

/**
 * Groups cards into per-character sections (characterId ascending, input order
 * preserved inside each group). Cards without a character land under key 0.
 */
export function groupCardsByCharacter(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
): CardBoxGroup<number>[] {
  const groups = new Map<number, CardBoxGroup<number>>()
  for (const card of cards) {
    const key = card.characterId ?? 0
    let group = groups.get(key)
    if (!group) {
      group = { key, cards: [], owned: 0, total: 0 }
      groups.set(key, group)
    }

    group.cards.push(card)
    group.total += 1
    if (ownedMap.has(card.id)) {
      group.owned += 1
    }
  }

  return [...groups.values()].sort((a, b) => a.key - b.key)
}

/** Groups cards into per-attribute sections following the canonical attr order. */
export function groupCardsByAttr(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
): CardBoxGroup<string>[] {
  const groups = new Map<string, CardBoxGroup<string>>()
  for (const card of cards) {
    const key = card.attr || "unknown"
    let group = groups.get(key)
    if (!group) {
      group = { key, cards: [], owned: 0, total: 0 }
      groups.set(key, group)
    }

    group.cards.push(card)
    group.total += 1
    if (ownedMap.has(card.id)) {
      group.owned += 1
    }
  }

  const order = new Map<string, number>(SEKAI_CARD_ATTRS.map((attr, index) => [attr, index]))
  return [...groups.values()].sort(
    (a, b) => (order.get(a.key) ?? SEKAI_CARD_ATTRS.length) - (order.get(b.key) ?? SEKAI_CARD_ATTRS.length),
  )
}

function createRarityBuckets(): Record<CardRarityType, RarityBucket> {
  const buckets = {} as Record<CardRarityType, RarityBucket>
  for (const rarity of CARD_RARITY_TYPES) {
    buckets[rarity] = { owned: 0, total: 0 }
  }

  return buckets
}

/**
 * Port of the bot's card box distribution: per-character owned/total with
 * per-rarity buckets. Owned cardIds missing from masterdata are ignored.
 */
export function buildCharacterDistribution(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
): CharacterDistributionRow[] {
  const rows = new Map<number, CharacterDistributionRow>()
  for (const card of cards) {
    const key = card.characterId ?? 0
    let row = rows.get(key)
    if (!row) {
      row = { characterId: key, owned: 0, total: 0, percent: 0, rarityBuckets: createRarityBuckets() }
      rows.set(key, row)
    }

    const owned = ownedMap.has(card.id)
    row.total += 1
    if (owned) {
      row.owned += 1
    }

    if (isCardRarityType(card.cardRarityType)) {
      const bucket = row.rarityBuckets[card.cardRarityType]
      bucket.total += 1
      if (owned) {
        bucket.owned += 1
      }
    }
  }

  const sorted = [...rows.values()].sort((a, b) => a.characterId - b.characterId)
  for (const row of sorted) {
    row.percent = computeCollectionPercent(row.owned, row.total)
  }

  return sorted
}

/** Per-attribute owned/total rows following the canonical attr order. */
export function buildAttrDistribution(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
): AttrDistributionRow[] {
  const rows = new Map<string, AttrDistributionRow>()
  for (const card of cards) {
    const key = card.attr || "unknown"
    let row = rows.get(key)
    if (!row) {
      row = { attr: key, owned: 0, total: 0, percent: 0 }
      rows.set(key, row)
    }

    row.total += 1
    if (ownedMap.has(card.id)) {
      row.owned += 1
    }
  }

  const order = new Map<string, number>(SEKAI_CARD_ATTRS.map((attr, index) => [attr, index]))
  const sorted = [...rows.values()].sort(
    (a, b) => (order.get(a.attr) ?? SEKAI_CARD_ATTRS.length) - (order.get(b.attr) ?? SEKAI_CARD_ATTRS.length),
  )
  for (const row of sorted) {
    row.percent = computeCollectionPercent(row.owned, row.total)
  }

  return sorted
}

export function summarizeCollection(
  cards: readonly CatalogMasterCard[],
  ownedMap: ReadonlyMap<number, UserCardRecord>,
): CollectionSummary {
  let owned = 0
  for (const card of cards) {
    if (ownedMap.has(card.id)) {
      owned += 1
    }
  }

  return { owned, total: cards.length, percent: computeCollectionPercent(owned, cards.length) }
}

/** Percentage with one decimal place; 0 when there is nothing to collect. */
export function computeCollectionPercent(owned: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.round((owned / total) * 1000) / 10
}
