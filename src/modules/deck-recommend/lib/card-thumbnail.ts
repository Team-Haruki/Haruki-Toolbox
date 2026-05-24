import type { RecommendCard, RecommendDeck, RecommendResult, WorldBloomSupportCard } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import {
  resolveCardAttrIconUrl,
  resolveCardFrameImageUrl,
  resolveMySekaiCanvasIconUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
  resolveTrainRankImageUrl,
} from "@/shared/sekai/data-sources"
import type { TaggedRecommendDeck, TaggedRecommendResult } from "./recommend-results"

export type DeckRecommendMasterCard = {
  id: number
  characterId: number | null
  characterName: string | null
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

export type DeckResultSupportCard = {
  card_id: number
  bonus: number
  skill_level: number
  master_rank: number
  level: number
  after_training: boolean
  default_image: string
}

export type DeckResultDeckSupportCard = WorldBloomSupportCard & {
  skill_level?: number
  master_rank?: number
  level?: number
  after_training?: boolean
  default_image?: string
}

export type DeckResultSupportCardView = {
  card: DeckResultSupportCard
  masterCard: DeckRecommendMasterCard | null
  thumbnail: CardThumbnailView
}

export type DeckResultDeckView = {
  index: number
  deck: RecommendDeck | TaggedRecommendDeck
  cards: DeckResultCardView[]
}

export function buildDeckResultViews(
  result: RecommendResult | TaggedRecommendResult | null,
  masterData: Record<string, unknown> | null,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference = "china",
): DeckResultDeckView[] {
  if (!result?.decks?.length) {
    return []
  }

  const cardMap = buildMasterCardMap(masterData?.cards, masterData?.gameCharacters)
  return result.decks.map((deck, index) => ({
    index,
    deck,
    cards: deck.cards.map((card) => {
      const masterCard = cardMap.get(card.card_id) ?? null
      return {
        card,
        masterCard,
        thumbnail: buildCardThumbnailView(card, masterCard, region, assetEndpoint),
      }
    }),
  }))
}

export function buildDeckSupportCardViews(
  cards: readonly DeckResultSupportCard[],
  masterData: Record<string, unknown> | null,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference = "china",
): DeckResultSupportCardView[] {
  const cardMap = buildMasterCardMap(masterData?.cards, masterData?.gameCharacters)
  return cards.map((card) => {
    const masterCard = cardMap.get(card.card_id) ?? null
    return {
      card,
      masterCard,
      thumbnail: buildCardThumbnailView({
        card_id: card.card_id,
        total_power: 0,
        base_power: 0,
        event_bonus_rate: card.bonus,
        master_rank: card.master_rank,
        level: card.level,
        skill_level: card.skill_level,
        skill_score_up: 0,
        skill_life_recovery: 0,
        episode1_read: false,
        episode2_read: false,
        after_training: card.after_training,
        default_image: card.default_image,
        has_canvas_bonus: false,
      }, masterCard, region, assetEndpoint),
    }
  })
}

export function resolveDeckSupportCards(
  deck: RecommendDeck,
): DeckResultSupportCard[] {
  return normalizeDeckSupportCards(deck)
}

export function buildCardThumbnailView(
  card: RecommendCard,
  masterCard: DeckRecommendMasterCard | null,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference = "china",
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
    thumbnailUrl: assetbundleName ? resolveSekaiCardThumbnailUrl(region, assetbundleName, trainedArt, assetEndpoint) : null,
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

type DeckRecommendMasterGameCharacter = {
  id?: number
  firstName?: string
  givenName?: string
  firstNameEnglish?: string
  givenNameEnglish?: string
}

function buildMasterCardMap(rawCards: unknown, rawGameCharacters: unknown): Map<number, DeckRecommendMasterCard> {
  const map = new Map<number, DeckRecommendMasterCard>()
  if (!Array.isArray(rawCards)) {
    return map
  }

  const characterNameMap = buildCharacterNameMap(rawGameCharacters)
  for (const rawCard of rawCards) {
    const card = normalizeMasterCard(rawCard, characterNameMap)
    if (card) {
      map.set(card.id, card)
    }
  }

  return map
}

function normalizeDeckSupportCards(deck: RecommendDeck): DeckResultSupportCard[] {
  const rawCards = (deck as RecommendDeck & { support_deck_cards?: unknown }).support_deck_cards
  if (!Array.isArray(rawCards)) {
    return []
  }

  const mainCardIds = new Set(deck.cards.map((card) => card.card_id))
  return rawCards
    .map((rawCard) => normalizeDeckSupportCard(rawCard))
    .filter((card): card is DeckResultSupportCard => card != null && !mainCardIds.has(card.card_id))
}

function normalizeDeckSupportCard(rawCard: unknown): DeckResultSupportCard | null {
  if (!rawCard || typeof rawCard !== "object") {
    return null
  }

  const card = rawCard as Partial<DeckResultDeckSupportCard>
  const cardId = normalizeNumber(card.card_id)
  if (!cardId) {
    return null
  }

  return {
    card_id: cardId,
    bonus: normalizeFiniteNumber(card.bonus, 0),
    skill_level: normalizePositiveNumber(card.skill_level) ?? 1,
    master_rank: normalizeNonNegativeNumber(card.master_rank) ?? 0,
    level: normalizePositiveNumber(card.level) ?? 1,
    after_training: card.after_training === true,
    default_image: normalizeString(card.default_image),
  }
}

function normalizeMasterCard(rawCard: unknown, characterNameMap: ReadonlyMap<number, string>): DeckRecommendMasterCard | null {
  if (!rawCard || typeof rawCard !== "object") {
    return null
  }

  const record = rawCard as Record<string, unknown>
  const id = normalizeNumber(record.id)
  if (!id) {
    return null
  }

  const characterId = normalizeNumber(record.characterId)
  return {
    id,
    characterId,
    characterName: characterId ? characterNameMap.get(characterId) ?? null : null,
    cardRarityType: normalizeString(record.cardRarityType),
    attr: normalizeString(record.attr),
    prefix: normalizeString(record.prefix) || null,
    assetbundleName: normalizeString(record.assetbundleName),
  }
}

function buildCharacterNameMap(rawGameCharacters: unknown): Map<number, string> {
  const map = new Map<number, string>()
  if (!Array.isArray(rawGameCharacters)) {
    return map
  }

  for (const rawCharacter of rawGameCharacters as DeckRecommendMasterGameCharacter[]) {
    const id = normalizeNumber(rawCharacter.id)
    const name = id ? resolveCharacterName(rawCharacter) : null
    if (id && name) {
      map.set(id, name)
    }
  }
  return map
}

function resolveCharacterName(character: DeckRecommendMasterGameCharacter): string | null {
  const localized = `${normalizeString(character.firstName)}${normalizeString(character.givenName)}`
  if (localized) {
    return localized
  }

  const english = [normalizeString(character.givenNameEnglish), normalizeString(character.firstNameEnglish)]
    .filter(Boolean)
    .join(" ")
  return english || null
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

function normalizePositiveNumber(value: unknown): number | null {
  const normalized = normalizeNumber(value)
  return normalized != null && normalized > 0 ? normalized : null
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  const normalized = normalizeNumber(value)
  return normalized != null && normalized >= 0 ? normalized : null
}

function normalizeFiniteNumber(value: unknown, fallback: number): number {
  const normalized = normalizeNumber(value)
  return normalized ?? fallback
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
