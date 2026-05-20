import type { RecommendCard, RecommendDeck, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import {
  resolveCardAttrIconUrl,
  resolveCardFrameImageUrl,
  resolveMySekaiCanvasIconUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
  resolveTrainRankImageUrl,
} from "@/shared/sekai/data-sources"

export type DeckRecommendMasterCard = {
  id: number
  characterId: number | null
  cardRarityType: string
  attr: string
  prefix: string | null
  assetbundleName: string
}

export type CardThumbnailView = {
  cardId: number
  title: string | null
  rarity: string
  attr: string
  thumbnailUrl: string | null
  frameUrl: string | null
  attrIconUrl: string | null
  rareIconUrl: string | null
  rareCount: number
  trainRank: number
  trainRankUrl: string | null
  level: number
  afterTraining: boolean
  trainedArt: boolean
  hasCanvasBonus: boolean
  canvasIconUrl: string | null
}

export type DeckResultCardView = {
  card: RecommendCard
  masterCard: DeckRecommendMasterCard | null
  thumbnail: CardThumbnailView
}

export type DeckResultDeckView = {
  index: number
  deck: RecommendDeck
  cards: DeckResultCardView[]
}

export function buildDeckResultViews(
  result: RecommendResult | null,
  masterData: Record<string, unknown> | null,
  region: SekaiRegion,
): DeckResultDeckView[] {
  if (!result?.decks?.length) {
    return []
  }

  const cardMap = buildMasterCardMap(masterData?.cards)
  return result.decks.map((deck, index) => ({
    index,
    deck,
    cards: deck.cards.map((card) => {
      const masterCard = cardMap.get(card.card_id) ?? null
      return {
        card,
        masterCard,
        thumbnail: buildCardThumbnailView(card, masterCard, region),
      }
    }),
  }))
}

export function buildCardThumbnailView(
  card: RecommendCard,
  masterCard: DeckRecommendMasterCard | null,
  region: SekaiRegion,
): CardThumbnailView {
  const { displayAfterTraining, trainedArt } = resolveRecommendCardDisplayState(card)
  const rarity = masterCard?.cardRarityType ?? ""
  const attr = masterCard?.attr.toLowerCase() ?? ""
  const trainRank = Math.max(0, card.master_rank)
  const assetbundleName = masterCard?.assetbundleName.trim() ?? ""

  return {
    cardId: card.card_id,
    title: masterCard?.prefix ?? null,
    rarity,
    attr,
    thumbnailUrl: assetbundleName ? resolveSekaiCardThumbnailUrl(region, assetbundleName, trainedArt) : null,
    frameUrl: rarity ? resolveCardFrameImageUrl(rarity) : null,
    attrIconUrl: attr ? resolveCardAttrIconUrl(attr) : null,
    rareIconUrl: rarity === "rarity_birthday"
      ? resolveRareBirthdayImageUrl()
      : resolveRareStarImageUrl(displayAfterTraining),
    rareCount: resolveRareCount(rarity),
    trainRank,
    trainRankUrl: trainRank > 0 ? resolveTrainRankImageUrl(trainRank) : null,
    level: card.level,
    afterTraining: displayAfterTraining,
    trainedArt,
    hasCanvasBonus: card.has_canvas_bonus,
    canvasIconUrl: card.has_canvas_bonus ? resolveMySekaiCanvasIconUrl() : null,
  }
}

export function resolveRecommendCardDisplayState(card: Pick<RecommendCard, "after_training" | "default_image">) {
  const normalized = card.default_image.trim().toLowerCase()
  if (["special_training", "after_training", "card_after_training", "trained"].includes(normalized)) {
    return { displayAfterTraining: true, trainedArt: true }
  }

  if (["normal", "original", "before_training", "card_normal"].includes(normalized)) {
    return { displayAfterTraining: false, trainedArt: false }
  }

  return {
    displayAfterTraining: card.after_training,
    trainedArt: card.after_training,
  }
}

function buildMasterCardMap(rawCards: unknown): Map<number, DeckRecommendMasterCard> {
  const map = new Map<number, DeckRecommendMasterCard>()
  if (!Array.isArray(rawCards)) {
    return map
  }

  for (const rawCard of rawCards) {
    const card = normalizeMasterCard(rawCard)
    if (card) {
      map.set(card.id, card)
    }
  }

  return map
}

function normalizeMasterCard(rawCard: unknown): DeckRecommendMasterCard | null {
  if (!rawCard || typeof rawCard !== "object") {
    return null
  }

  const record = rawCard as Record<string, unknown>
  const id = normalizeNumber(record.id)
  if (!id) {
    return null
  }

  return {
    id,
    characterId: normalizeNumber(record.characterId),
    cardRarityType: normalizeString(record.cardRarityType),
    attr: normalizeString(record.attr),
    prefix: normalizeString(record.prefix) || null,
    assetbundleName: normalizeString(record.assetbundleName),
  }
}

function resolveRareCount(rarity: string): number {
  if (rarity === "rarity_birthday") {
    return 1
  }

  const match = rarity.match(/\d+/)
  return match ? Number(match[0]) : 0
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
  }

  return null
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
