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

/** Representative color per card attribute (approximate in-game palette). */
export const SEKAI_CARD_ATTR_COLORS: Record<string, string> = {
  cute: "#FF6BA1",
  cool: "#4270F5",
  pure: "#46C74C",
  happy: "#FFA928",
  mysterious: "#B24BDD",
}

export type SekaiCardAttr = (typeof SEKAI_CARD_ATTRS)[number]

/**
 * Representative unit colors (from `unitProfiles.colorCode`) used when the
 * master-driven unit color map is not loaded, e.g. logo fallbacks in shared
 * components.
 */
export const SEKAI_UNIT_FALLBACK_COLORS: Record<SekaiUnit, string> = {
  light_sound: "#4455DD",
  idol: "#88DD44",
  street: "#EE1166",
  theme_park: "#FF9900",
  school_refusal: "#884499",
  piapro: "#33CCBB",
}

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
  /** `cardSkillName` — searchable and shown on tiles. */
  skillName?: string | null
  /** `initialSpecialTrainingStatus === "done"`: the card only has trained art. */
  trainedByDefault?: boolean
}

export type CatalogCardThumbnail = {
  cardId: number
  thumbnailUrl: string | null
  trainedThumbnailUrl: string | null
  frameUrl: string | null
  attrIconUrl: string | null
  rareIconUrl: string | null
  trainedRareIconUrl: string | null
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
  trainedRareIconUrl?: string | null
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

/**
 * Appends normalized records onto `target` one by one. tw/kr/cn ship
 * resourceBoxDetails as a single flat array with 100k+ rows; spreading it
 * into `push(...)` passes every row as a call argument and overflows the
 * ~512KB stacks of mobile browser engines.
 */
export function appendCatalogRecords(target: Record<string, unknown>[], value: unknown): void {
  for (const record of normalizeCatalogRecords(value)) {
    target.push(record)
  }
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

/** Fixed representative color per game character, keyed by gameCharacterId. */
export const SEKAI_CHARACTER_COLORS: Record<number, string> = {
  1: "#33AAEE",
  2: "#FFDD44",
  3: "#EE6666",
  4: "#BBDD22",
  5: "#FFCCAA",
  6: "#99CCFF",
  7: "#FFAACC",
  8: "#99EEDD",
  9: "#FF6699",
  10: "#00BBDD",
  11: "#FF7722",
  12: "#0077DD",
  13: "#FFBB00",
  14: "#FF66BB",
  15: "#33DD99",
  16: "#BB88EE",
  17: "#BB6688",
  18: "#8888CC",
  19: "#CCAA88",
  20: "#DDAACC",
  21: "#33CCBB",
  22: "#FFCC11",
  23: "#FFEE11",
  24: "#FFBBCC",
  25: "#DD4444",
  26: "#3366CC",
}

/** The character's representative color, or null for unknown character ids. */
export function resolveSekaiCharacterColor(characterId: number | null | undefined): string | null {
  if (characterId == null) {
    return null
  }

  return SEKAI_CHARACTER_COLORS[characterId] ?? null
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
    skillName: normalizeCatalogString(record.cardSkillName) || null,
    trainedByDefault: normalizeCatalogString(record.initialSpecialTrainingStatus) === "done",
  }
}

/** Appends `value` to the list stored under `key`, creating the list on first use. */
export function pushCatalogGroup<K, V>(groups: Map<K, V[]>, key: K, value: V): void {
  const group = groups.get(key)
  if (group) {
    group.push(value)
  } else {
    groups.set(key, [value])
  }
}

/** Cards whose only artwork is the trained one (`initialSpecialTrainingStatus: done`). */
export function cardShowsOnlyTrainedArt(card: Pick<CatalogMasterCard, "cardRarityType" | "trainedByDefault">): boolean {
  return card.trainedByDefault === true && cardRarityHasTrainedArt(card.cardRarityType)
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
  // Trained-by-default cards (`initialSpecialTrainingStatus: done`) ship no
  // `_normal` thumbnail at all, so the untrained slot also resolves to the
  // trained art. Consumers that never pass `trained` (gacha / event / home
  // tiles) then still get an image that exists.
  const trainedOnly = cardShowsOnlyTrainedArt(card)
  const assetbundleName = card.assetbundleName
  return {
    cardId: card.id,
    thumbnailUrl: assetbundleName
      ? resolveSekaiCardThumbnailUrl(region, assetbundleName, trainedOnly, assetEndpoint)
      : null,
    trainedThumbnailUrl: assetbundleName && hasTrainedArt
      ? resolveSekaiCardThumbnailUrl(region, assetbundleName, true, assetEndpoint)
      : null,
    frameUrl: card.cardRarityType ? resolveCardFrameImageUrl(card.cardRarityType) : null,
    attrIconUrl: card.attr ? resolveCardAttrIconUrl(card.attr) : null,
    rareIconUrl: card.cardRarityType === "rarity_birthday"
      ? resolveRareBirthdayImageUrl()
      : resolveRareStarImageUrl(trainedOnly),
    trainedRareIconUrl: card.cardRarityType === "rarity_birthday"
      ? resolveRareBirthdayImageUrl()
      : resolveRareStarImageUrl(true),
    rareCount: resolveCardRareCount(card.cardRarityType),
    hasTrainedArt,
  }
}

function isSekaiUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}
