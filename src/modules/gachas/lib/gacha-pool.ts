import { matchesCommandSearch } from "@/lib/search-match"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import { dedupGachaPickupCardIds, type CatalogGacha } from "@/modules/gachas/lib/gacha-catalog"
import { resolveGachaRarityOrder, sortGachaRarities } from "@/modules/gachas/lib/gacha-rates"

export type GachaPoolCard = {
  card: CatalogMasterCard
  characterName: string | null
  /** Fraction of one pull (all lotteries); null when the card has no weight. */
  rate: number | null
  isWish: boolean
  isPickup: boolean
  unreleased: boolean
}

export type GachaPoolGroup = {
  rarity: string
  cards: GachaPoolCard[]
}

export type GachaPoolFilter = {
  query: string
  characterIds: number[]
  rarities: string[]
}

export function createDefaultGachaPoolFilter(): GachaPoolFilter {
  return { query: "", characterIds: [], rarities: [] }
}

type PoolContext = {
  cardsById: ReadonlyMap<number, CatalogMasterCard>
  characterMap: ReadonlyMap<number, CatalogCharacter>
  /** cardId → fraction per pull (see `buildGachaCardRateMap`). */
  cardRates: ReadonlyMap<number, number> | null
  nowMs: number
  pickupIds: ReadonlySet<number>
  wishIds: ReadonlySet<number>
}

function toPoolCard(cardId: number, ctx: PoolContext): GachaPoolCard | null {
  const card = ctx.cardsById.get(cardId)
  if (!card) {
    return null
  }
  return {
    card,
    characterName: card.characterId != null ? ctx.characterMap.get(card.characterId)?.name ?? null : null,
    rate: ctx.cardRates?.get(card.id) ?? null,
    isWish: ctx.wishIds.has(card.id),
    isPickup: ctx.pickupIds.has(card.id),
    unreleased: isUnreleasedContent(card.releaseAt, ctx.nowMs),
  }
}

function buildContext(
  gacha: Pick<CatalogGacha, "details" | "pickups">,
  cardsById: ReadonlyMap<number, CatalogMasterCard>,
  characterMap: ReadonlyMap<number, CatalogCharacter>,
  cardRates: ReadonlyMap<number, number> | null,
  nowMs: number,
): PoolContext {
  return {
    cardsById,
    characterMap,
    cardRates,
    nowMs,
    pickupIds: new Set(gacha.pickups.map((pickup) => pickup.cardId)),
    wishIds: new Set(gacha.details.filter((detail) => detail.isWish).map((detail) => detail.cardId)),
  }
}

/** Distinct pool cards, pickups first, then rarity high→low and newest id first. */
export function buildGachaPoolCards(
  gacha: Pick<CatalogGacha, "details" | "pickups">,
  cardsById: ReadonlyMap<number, CatalogMasterCard>,
  characterMap: ReadonlyMap<number, CatalogCharacter>,
  cardRates: ReadonlyMap<number, number> | null,
  nowMs: number,
): GachaPoolCard[] {
  const ctx = buildContext(gacha, cardsById, characterMap, cardRates, nowMs)
  const seen = new Set<number>()
  const cards: GachaPoolCard[] = []
  for (const detail of gacha.details) {
    if (seen.has(detail.cardId)) {
      continue
    }
    seen.add(detail.cardId)
    const entry = toPoolCard(detail.cardId, ctx)
    if (entry) {
      cards.push(entry)
    }
  }
  return cards.sort((a, b) => (
    Number(b.isPickup) - Number(a.isPickup)
    || resolveGachaRarityOrder(b.card.cardRarityType) - resolveGachaRarityOrder(a.card.cardRarityType)
    || b.card.id - a.card.id
  ))
}

/** Pickup cards in master-data order (deduped), with the same per-card shape as the pool. */
export function buildGachaPickupCards(
  gacha: Pick<CatalogGacha, "details" | "pickups">,
  cardsById: ReadonlyMap<number, CatalogMasterCard>,
  characterMap: ReadonlyMap<number, CatalogCharacter>,
  cardRates: ReadonlyMap<number, number> | null,
  nowMs: number,
): GachaPoolCard[] {
  const ctx = buildContext(gacha, cardsById, characterMap, cardRates, nowMs)
  const cards: GachaPoolCard[] = []
  for (const cardId of dedupGachaPickupCardIds(gacha.pickups)) {
    const entry = toPoolCard(cardId, ctx)
    if (entry) {
      cards.push(entry)
    }
  }
  return cards
}

export function filterGachaPoolCards(cards: readonly GachaPoolCard[], filter: GachaPoolFilter): GachaPoolCard[] {
  const query = filter.query.trim()
  const characters = filter.characterIds.length > 0 ? new Set(filter.characterIds) : null
  const rarities = filter.rarities.length > 0 ? new Set(filter.rarities) : null
  return cards.filter((entry) => {
    if (characters && (entry.card.characterId == null || !characters.has(entry.card.characterId))) {
      return false
    }
    if (rarities && !rarities.has(entry.card.cardRarityType)) {
      return false
    }
    if (query) {
      const parts = [entry.card.prefix ?? "", entry.characterName ?? "", `#${entry.card.id}`, entry.card.skillName ?? ""]
      if (!matchesCommandSearch(parts, query)) {
        return false
      }
    }
    return true
  })
}

export function groupGachaPoolByRarity(cards: readonly GachaPoolCard[]): GachaPoolGroup[] {
  const byRarity = new Map<string, GachaPoolCard[]>()
  for (const entry of cards) {
    const group = byRarity.get(entry.card.cardRarityType)
    if (group) {
      group.push(entry)
    } else {
      byRarity.set(entry.card.cardRarityType, [entry])
    }
  }
  return sortGachaRarities(byRarity.keys()).map((rarity) => ({ rarity, cards: byRarity.get(rarity) ?? [] }))
}

/** Character ids present in the pool, ascending. */
export function collectGachaPoolCharacterIds(cards: readonly GachaPoolCard[]): number[] {
  const ids = new Set<number>()
  for (const entry of cards) {
    if (entry.card.characterId != null) {
      ids.add(entry.card.characterId)
    }
  }
  return [...ids].sort((a, b) => a - b)
}

/** Rarities present in the pool, highest first. */
export function collectGachaPoolRarities(cards: readonly GachaPoolCard[]): string[] {
  return sortGachaRarities(cards.map((entry) => entry.card.cardRarityType))
}
