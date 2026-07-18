import type { CatalogCharacter, CatalogMasterCard, SekaiCardAttr, SekaiUnit } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  resolveCardRareCount,
} from "@/shared/sekai/catalog"

export const CARD_RARITY_TYPES = [
  "rarity_1",
  "rarity_2",
  "rarity_3",
  "rarity_4",
  "rarity_birthday",
] as const

export type CardRarityType = (typeof CARD_RARITY_TYPES)[number]

export const CARD_SUPPLY_TYPES = [
  "normal",
  "birthday",
  "term_limited",
  "colorful_festival_limited",
  "bloom_festival_limited",
  "unit_event_limited",
  "collaboration_limited",
] as const

export type CardSupplyType = (typeof CARD_SUPPLY_TYPES)[number]

export const CARD_SORT_KEYS = ["releaseDesc", "rarityDesc", "idAsc"] as const

export type CardSortKey = (typeof CARD_SORT_KEYS)[number]

export type CardListFilters = {
  query: string
  characterIds: number[]
  units: SekaiUnit[]
  attrs: SekaiCardAttr[]
  rarities: CardRarityType[]
  supplyTypes: CardSupplyType[]
  year: number | null
}

export type CardFilterContext = {
  characterMap: Map<number, CatalogCharacter>
  supplyTypeMap: Map<number, string>
}

export function createDefaultCardFilters(): CardListFilters {
  return {
    query: "",
    characterIds: [],
    units: [],
    attrs: [],
    rarities: [],
    supplyTypes: [],
    year: null,
  }
}

export function isCardRarityType(value: string): value is CardRarityType {
  return (CARD_RARITY_TYPES as readonly string[]).includes(value)
}

export function isCardSupplyType(value: string): value is CardSupplyType {
  return (CARD_SUPPLY_TYPES as readonly string[]).includes(value)
}

export function buildCardSupplyTypeMap(rawCardSupplies: unknown): Map<number, string> {
  const map = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawCardSupplies)) {
    const id = normalizeCatalogNumber(record.id)
    const supplyType = normalizeCatalogString(record.cardSupplyType)
    if (id && supplyType) {
      map.set(id, supplyType)
    }
  }

  return map
}

export function resolveCardSupplyType(
  card: CatalogMasterCard,
  supplyTypeMap: Map<number, string>,
): CardSupplyType | null {
  if (card.cardSupplyId == null) {
    return null
  }

  const supplyType = supplyTypeMap.get(card.cardSupplyId)
  return supplyType && isCardSupplyType(supplyType) ? supplyType : null
}

/**
 * Resolves the unit a card belongs to. Virtual singer support cards
 * (supportUnit != "none") keep piapro as their owning unit here; unit
 * filtering additionally matches them via `cardMatchesUnit`.
 */
export function resolveCardUnit(
  card: CatalogMasterCard,
  characterMap: Map<number, CatalogCharacter>,
): SekaiUnit | null {
  if (card.characterId == null) {
    return null
  }

  return characterMap.get(card.characterId)?.unit ?? null
}

/**
 * Bot-compatible unit matching: a unit matches when the card's character
 * belongs to it, or when the card is a virtual singer support card for
 * that unit (supportUnit matches).
 */
export function cardMatchesUnit(
  card: CatalogMasterCard,
  unit: SekaiUnit,
  characterMap: Map<number, CatalogCharacter>,
): boolean {
  if (resolveCardUnit(card, characterMap) === unit) {
    return true
  }

  return card.supportUnit !== "none" && card.supportUnit === unit
}

export function cardMatchesQuery(card: CatalogMasterCard, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return (card.prefix ?? "").toLowerCase().includes(normalized)
}

export function resolveCardReleaseYear(releaseAt: number | null): number | null {
  if (releaseAt == null) {
    return null
  }

  return new Date(releaseAt).getFullYear()
}

export function collectCardReleaseYears(cards: readonly CatalogMasterCard[]): number[] {
  const years = new Set<number>()
  for (const card of cards) {
    const year = resolveCardReleaseYear(card.releaseAt)
    if (year != null) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}

export function isCardUnreleased(releaseAt: number | null, now = Date.now()): boolean {
  return releaseAt != null && releaseAt > now
}

export function filterCards(
  cards: readonly CatalogMasterCard[],
  filters: CardListFilters,
  context: CardFilterContext,
): CatalogMasterCard[] {
  return cards.filter((card) => {
    if (!cardMatchesQuery(card, filters.query)) {
      return false
    }

    if (filters.characterIds.length > 0
      && (card.characterId == null || !filters.characterIds.includes(card.characterId))) {
      return false
    }

    if (filters.units.length > 0
      && !filters.units.some((unit) => cardMatchesUnit(card, unit, context.characterMap))) {
      return false
    }

    if (filters.attrs.length > 0 && !(filters.attrs as readonly string[]).includes(card.attr)) {
      return false
    }

    if (filters.rarities.length > 0
      && !(filters.rarities as readonly string[]).includes(card.cardRarityType)) {
      return false
    }

    if (filters.supplyTypes.length > 0) {
      const supplyType = resolveCardSupplyType(card, context.supplyTypeMap)
      if (supplyType == null || !filters.supplyTypes.includes(supplyType)) {
        return false
      }
    }

    if (filters.year != null && resolveCardReleaseYear(card.releaseAt) !== filters.year) {
      return false
    }

    return true
  })
}

export function sortCards(
  cards: readonly CatalogMasterCard[],
  sortKey: CardSortKey,
): CatalogMasterCard[] {
  const sorted = [...cards]
  if (sortKey === "idAsc") {
    return sorted.sort((a, b) => a.id - b.id)
  }

  if (sortKey === "rarityDesc") {
    return sorted.sort((a, b) => {
      const rarityDiff = resolveCardRareCount(b.cardRarityType) - resolveCardRareCount(a.cardRarityType)
      if (rarityDiff !== 0) {
        return rarityDiff
      }

      return compareReleaseDesc(a, b)
    })
  }

  return sorted.sort(compareReleaseDesc)
}

export function countCardPages(total: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(total / pageSize))
}

export function paginateCards<T>(items: readonly T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) {
    return [...items]
  }

  const totalPages = countCardPages(items.length, pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

function compareReleaseDesc(a: CatalogMasterCard, b: CatalogMasterCard): number {
  const aRelease = a.releaseAt ?? Number.NEGATIVE_INFINITY
  const bRelease = b.releaseAt ?? Number.NEGATIVE_INFINITY
  if (aRelease !== bRelease) {
    return bRelease - aRelease
  }

  return b.id - a.id
}
