import type { CatalogCharacter, CatalogMasterCard, SekaiCardAttr, SekaiUnit } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  resolveCardRareCount,
} from "@/shared/sekai/catalog"
import { matchesCommandSearch } from "@/lib/search-match"

export const CARD_RARITY_TYPES = [
  "rarity_1",
  "rarity_2",
  "rarity_3",
  "rarity_4",
  "rarity_birthday",
] as const

export type CardRarityType = (typeof CARD_RARITY_TYPES)[number]

/** Display order of rarities (`cardRarities.seq`): birthday sits between 3★ and 4★. */
const CARD_RARITY_RANK: Record<CardRarityType, number> = {
  rarity_1: 1,
  rarity_2: 2,
  rarity_3: 3,
  rarity_birthday: 4,
  rarity_4: 5,
}

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

/** Legacy sort keys (kept for the gacha pool grid). The list page uses `CardSort` + direction. */
export const CARD_SORT_KEYS = ["releaseDesc", "rarityDesc", "idAsc"] as const

export type CardSortKey = (typeof CARD_SORT_KEYS)[number]

export const CARD_SORTS = ["release", "rarity", "id", "power"] as const

export type CardSort = (typeof CARD_SORTS)[number]

export type CardSortDirection = "asc" | "desc"

export type CardListFilters = {
  query: string
  characterIds: number[]
  units: SekaiUnit[]
  attrs: SekaiCardAttr[]
  rarities: CardRarityType[]
  supplyTypes: CardSupplyType[]
  /** Skill filter types (see `card-skill.ts`); empty means any. */
  skillTypes: string[]
  year: number | null
}

export type CardFilterContext = {
  characterMap: Map<number, CatalogCharacter>
  supplyTypeMap: Map<number, string>
  worldBloomCardIds?: ReadonlySet<number>
  /** skillId → skill filter type; cards whose skill is unknown never match a skill filter. */
  skillTypeBySkillId?: ReadonlyMap<number, string>
}

export function createDefaultCardFilters(): CardListFilters {
  return {
    query: "",
    characterIds: [],
    units: [],
    attrs: [],
    rarities: [],
    supplyTypes: [],
    skillTypes: [],
    year: null,
  }
}

export function isCardRarityType(value: string): value is CardRarityType {
  return (CARD_RARITY_TYPES as readonly string[]).includes(value)
}

export function isCardSupplyType(value: string): value is CardSupplyType {
  return (CARD_SUPPLY_TYPES as readonly string[]).includes(value)
}

export function isCardSort(value: unknown): value is CardSort {
  return typeof value === "string" && (CARD_SORTS as readonly string[]).includes(value)
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

/**
 * Card ids that belong to a World Link (world_bloom) event. The JP master
 * stopped tagging World Link cards as `unit_event_limited` from WL3 onward
 * (their cardSupplies row is plain `term_limited`), so membership is derived
 * from eventCards joined against the event type instead.
 */
export function buildWorldBloomCardIds(rawEvents: unknown, rawEventCards: unknown): Set<number> {
  const worldBloomEventIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (id != null && normalizeCatalogString(record.eventType) === "world_bloom") {
      worldBloomEventIds.add(id)
    }
  }

  const cardIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const cardId = normalizeCatalogNumber(record.cardId)
    if (eventId != null && cardId != null && worldBloomEventIds.has(eventId)) {
      cardIds.add(cardId)
    }
  }

  return cardIds
}

/**
 * Same as `buildWorldBloomCardIds` but fed from the canonical events index
 * (normalized events + per-event card links) instead of raw master rows.
 */
export function collectWorldBloomCardIds(
  events: readonly { id: number; eventType: string | null }[],
  cardLinksByEvent: ReadonlyMap<number, readonly { cardId: number }[]>,
): Set<number> {
  const cardIds = new Set<number>()
  for (const event of events) {
    if (event.eventType !== "world_bloom") {
      continue
    }
    for (const link of cardLinksByEvent.get(event.id) ?? []) {
      cardIds.add(link.cardId)
    }
  }
  return cardIds
}

export function resolveCardSupplyType(
  card: CatalogMasterCard,
  supplyTypeMap: Map<number, string>,
  worldBloomCardIds?: ReadonlySet<number>,
): CardSupplyType | null {
  if (card.cardSupplyId == null) {
    return null
  }

  const supplyType = supplyTypeMap.get(card.cardSupplyId)
  const resolved = supplyType && isCardSupplyType(supplyType) ? supplyType : null
  // WL3+ limited cards ship as term_limited; reclassify them under the
  // World Link limited bucket so the filter keeps matching every WL round.
  if (resolved === "term_limited" && worldBloomCardIds?.has(card.id)) {
    return "unit_event_limited"
  }

  return resolved
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

/** Searchable text parts of a card: title, skill name, character name and `#id`. */
export function buildCardSearchParts(card: CatalogMasterCard, characterName?: string | null): string[] {
  const parts = [card.prefix ?? "", card.skillName ?? "", characterName ?? "", `#${card.id}`]
  return parts.filter((part) => part !== "")
}

/**
 * Free-text match over the card's title, skill name, character name and id
 * with the shared command-search normalization (kana → romaji, Han →
 * pinyin, `#123` / `123` id forms).
 */
export function cardMatchesQuery(
  card: CatalogMasterCard,
  query: string,
  characterName?: string | null,
): boolean {
  const normalized = query.trim()
  if (!normalized) {
    return true
  }

  return matchesCommandSearch(buildCardSearchParts(card, characterName), normalized)
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

/** Removes unreleased cards when hiding is enabled; otherwise returns the input unchanged. */
export function excludeUnreleasedCards(
  cards: readonly CatalogMasterCard[],
  hide: boolean,
  now = Date.now(),
): readonly CatalogMasterCard[] {
  if (!hide) {
    return cards
  }

  return cards.filter((card) => !isCardUnreleased(card.releaseAt, now))
}

export function filterCards(
  cards: readonly CatalogMasterCard[],
  filters: CardListFilters,
  context: CardFilterContext,
): CatalogMasterCard[] {
  const skillTypes = filters.skillTypes ?? []
  return cards.filter((card) => {
    const characterName = card.characterId != null
      ? context.characterMap.get(card.characterId)?.name ?? null
      : null
    if (!cardMatchesQuery(card, filters.query, characterName)) {
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
      const supplyType = resolveCardSupplyType(card, context.supplyTypeMap, context.worldBloomCardIds)
      if (supplyType == null || !filters.supplyTypes.includes(supplyType)) {
        return false
      }
    }

    if (skillTypes.length > 0) {
      const skillType = card.skillId != null ? context.skillTypeBySkillId?.get(card.skillId) : undefined
      if (skillType == null || !skillTypes.includes(skillType)) {
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

export function resolveCardRarityRank(cardRarityType: string): number {
  return isCardRarityType(cardRarityType) ? CARD_RARITY_RANK[cardRarityType] : 0
}

/**
 * List-page sort: one key plus a direction. Cards without a release time or
 * power table sort last in both directions; ties fall back to the id.
 */
export function sortCardsBy(
  cards: readonly CatalogMasterCard[],
  sort: CardSort,
  direction: CardSortDirection,
  powerById?: ReadonlyMap<number, number>,
): CatalogMasterCard[] {
  const sign = direction === "asc" ? 1 : -1
  const sorted = [...cards]

  if (sort === "id") {
    return sorted.sort((a, b) => sign * (a.id - b.id))
  }

  if (sort === "rarity") {
    return sorted.sort((a, b) => {
      const diff = resolveCardRarityRank(a.cardRarityType) - resolveCardRarityRank(b.cardRarityType)
      return diff !== 0 ? sign * diff : compareReleaseDesc(a, b)
    })
  }

  if (sort === "power") {
    return sorted.sort((a, b) => {
      const aPower = powerById?.get(a.id) ?? null
      const bPower = powerById?.get(b.id) ?? null
      if (aPower == null || bPower == null) {
        if (aPower == null && bPower == null) {
          return compareReleaseDesc(a, b)
        }
        return aPower == null ? 1 : -1
      }
      return aPower !== bPower ? sign * (aPower - bPower) : compareReleaseDesc(a, b)
    })
  }

  return sorted.sort((a, b) => {
    if (a.releaseAt == null || b.releaseAt == null) {
      if (a.releaseAt == null && b.releaseAt == null) {
        return sign * (a.id - b.id)
      }
      return a.releaseAt == null ? 1 : -1
    }
    return a.releaseAt !== b.releaseAt ? sign * (a.releaseAt - b.releaseAt) : sign * (a.id - b.id)
  })
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
