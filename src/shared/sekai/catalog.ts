import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "./types"
import {
  resolveCardAttrIconUrl,
  resolveCardFrameImageUrl,
  resolveCharacterIconUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
} from "./data-sources"

export const SEKAI_UNITS = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "piapro",
] as const

export type SekaiUnit = (typeof SEKAI_UNITS)[number]

export const SEKAI_CARD_ATTRS = ["cute", "cool", "pure", "happy", "mysterious"] as const

export type SekaiCardAttr = (typeof SEKAI_CARD_ATTRS)[number]

export type CatalogCharacter = {
  id: number
  name: string
  unit: SekaiUnit | null
  iconUrl: string
}

export type CatalogMasterCard = {
  id: number
  characterId: number | null
  cardRarityType: string
  attr: string
  supportUnit: string
  prefix: string | null
  assetbundleName: string
  releaseAt: number | null
  skillId: number | null
  cardSupplyId: number | null
}

export type CatalogCardThumbnail = {
  cardId: number
  thumbnailUrl: string | null
  trainedThumbnailUrl: string | null
  frameUrl: string | null
  attrIconUrl: string | null
  rareIconUrl: string | null
  rareCount: number
  hasTrainedArt: boolean
}

/**
 * The minimal shape the shared `SekaiCardThumbnail` component renders. Both
 * `CatalogCardThumbnail` and deck-recommend's `CardThumbnailView` satisfy it.
 */
export type SekaiCardThumbnailView = {
  cardId: number
  title?: string | null
  thumbnailUrl: string | null
  trainedThumbnailUrl?: string | null
  frameUrl: string | null
  attrIconUrl: string | null
  rareIconUrl: string | null
  rareCount: number
  trainRankUrl?: string | null
  canvasIconUrl?: string | null
}

export function normalizeCatalogNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function normalizeCatalogString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeCatalogRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
}

export function buildCatalogCharacterMap(rawGameCharacters: unknown): Map<number, CatalogCharacter> {
  const map = new Map<number, CatalogCharacter>()
  for (const record of normalizeCatalogRecords(rawGameCharacters)) {
    const id = normalizeCatalogNumber(record.id)
    if (!id) {
      continue
    }

    const name = resolveCatalogCharacterName(record)
    if (!name) {
      continue
    }

    const unit = normalizeCatalogString(record.unit)
    map.set(id, {
      id,
      name,
      unit: isSekaiUnit(unit) ? unit : null,
      iconUrl: resolveCharacterIconUrl(id),
    })
  }

  return map
}

export function resolveCatalogCharacterName(record: Record<string, unknown>): string | null {
  const localized = [normalizeCatalogString(record.firstName), normalizeCatalogString(record.givenName)]
    .filter(Boolean)
    .join("")
  if (localized) {
    return localized
  }

  const english = [normalizeCatalogString(record.givenNameEnglish), normalizeCatalogString(record.firstNameEnglish)]
    .filter(Boolean)
    .join(" ")
  return english || null
}

export function buildCatalogUnitColorMap(rawGameCharacterUnits: unknown): Map<SekaiUnit, string> {
  const map = new Map<SekaiUnit, string>()
  for (const record of normalizeCatalogRecords(rawGameCharacterUnits)) {
    const unit = normalizeCatalogString(record.unit)
    const colorCode = normalizeCatalogString(record.colorCode)
    if (isSekaiUnit(unit) && colorCode && !map.has(unit)) {
      map.set(unit, colorCode)
    }
  }

  return map
}

/**
 * Builds each character's representative color from `gameCharacterUnits`.
 * Virtual singers have one entry per unit, so the entry matching the
 * character's own unit (piapro) wins over the unit-variant entries.
 */
export function buildCatalogCharacterColorMap(
  rawGameCharacterUnits: unknown,
  characterMap?: ReadonlyMap<number, CatalogCharacter>,
): Map<number, string> {
  const map = new Map<number, string>()
  const ownUnitResolved = new Set<number>()
  for (const record of normalizeCatalogRecords(rawGameCharacterUnits)) {
    const characterId = normalizeCatalogNumber(record.gameCharacterId)
    const colorCode = normalizeCatalogString(record.colorCode)
    if (!characterId || !colorCode || ownUnitResolved.has(characterId)) {
      continue
    }

    const unit = normalizeCatalogString(record.unit)
    const ownUnit = characterMap?.get(characterId)?.unit ?? null
    if (ownUnit != null && unit === ownUnit) {
      map.set(characterId, colorCode)
      ownUnitResolved.add(characterId)
      continue
    }

    if (!map.has(characterId)) {
      map.set(characterId, colorCode)
    }
  }

  return map
}

export function normalizeCatalogMasterCard(value: unknown): CatalogMasterCard | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (!id) {
    return null
  }

  return {
    id,
    characterId: normalizeCatalogNumber(record.characterId),
    cardRarityType: normalizeCatalogString(record.cardRarityType),
    attr: normalizeCatalogString(record.attr).toLowerCase(),
    supportUnit: normalizeCatalogString(record.supportUnit),
    prefix: normalizeCatalogString(record.prefix) || null,
    assetbundleName: normalizeCatalogString(record.assetbundleName),
    releaseAt: normalizeCatalogNumber(record.releaseAt),
    skillId: normalizeCatalogNumber(record.skillId),
    cardSupplyId: normalizeCatalogNumber(record.cardSupplyId),
  }
}

export function cardRarityHasTrainedArt(cardRarityType: string): boolean {
  return cardRarityType === "rarity_3" || cardRarityType === "rarity_4"
}

export function resolveCardRareCount(cardRarityType: string): number {
  if (cardRarityType === "rarity_birthday") {
    return 1
  }

  const match = cardRarityType.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function buildCatalogCardThumbnail(
  card: CatalogMasterCard,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference = "china",
): CatalogCardThumbnail {
  const hasTrainedArt = cardRarityHasTrainedArt(card.cardRarityType)
  const assetbundleName = card.assetbundleName
  return {
    cardId: card.id,
    thumbnailUrl: assetbundleName
      ? resolveSekaiCardThumbnailUrl(region, assetbundleName, false, assetEndpoint)
      : null,
    trainedThumbnailUrl: assetbundleName && hasTrainedArt
      ? resolveSekaiCardThumbnailUrl(region, assetbundleName, true, assetEndpoint)
      : null,
    frameUrl: card.cardRarityType ? resolveCardFrameImageUrl(card.cardRarityType) : null,
    attrIconUrl: card.attr ? resolveCardAttrIconUrl(card.attr) : null,
    rareIconUrl: card.cardRarityType === "rarity_birthday"
      ? resolveRareBirthdayImageUrl()
      : resolveRareStarImageUrl(false),
    rareCount: resolveCardRareCount(card.cardRarityType),
    hasTrainedArt,
  }
}

function isSekaiUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}
