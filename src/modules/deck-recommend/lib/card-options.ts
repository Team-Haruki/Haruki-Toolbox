import { resolveCardAttrIconUrl, resolveSekaiCardThumbnailUrl } from "@/shared/sekai/data-sources"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { SekaiRegion } from "@/types"
import type { DeckRecommendEventAttr, DeckRecommendUnitType } from "./recommend-options"
import type { DeckRecommendRarity } from "./training-config"

export type DeckRecommendMasterCardOption = {
  id: number
  value: string
  label: string
  description: string
  characterId: number | null
  unit: DeckRecommendUnitType | null
  unitProfileName: string | null
  rarity: DeckRecommendRarity | null
  attr: DeckRecommendEventAttr | null
  maxLevel: number
  maxSkillLevel: number
  canSpecialTrain: boolean
  thumbnailUrl: string | null
  attrIconUrl: string | null
  keywords: string[]
}

type RawCard = {
  id?: number
  seq?: number
  characterId?: number
  cardRarityType?: string
  attr?: string
  supportUnit?: string
  prefix?: string
  assetbundleName?: string
}

type RawCardRarity = {
  cardRarityType?: string
  maxLevel?: number
  trainingMaxLevel?: number
  maxSkillLevel?: number
}

type RawGameCharacter = {
  id?: number
  unit?: string
}

type RawUnitProfile = {
  unit?: string
  unitProfileName?: string
  unitName?: string
}

export function buildMasterCardOptions(
  masterData: Record<string, unknown> | null,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference,
): DeckRecommendMasterCardOption[] {
  const cards = Array.isArray(masterData?.cards) ? masterData.cards as RawCard[] : []
  const rarityMap = buildRarityMap(masterData?.cardRarities)
  const characterUnitMap = buildCharacterUnitMap(masterData?.gameCharacters)
  const unitProfileNameMap = buildUnitProfileNameMap(masterData?.unitProfiles)

  return cards
    .map((card) => {
      const id = normalizePositiveInteger(card.id)
      if (!id) {
        return null
      }

      const rarity = normalizeRarity(card.cardRarityType)
      const attr = normalizeAttr(card.attr)
      const rarityConfig = rarity ? rarityMap.get(rarity) : null
      const canSpecialTrain = Boolean(rarityConfig?.trainingMaxLevel)
      const maxLevel = rarityConfig?.trainingMaxLevel || rarityConfig?.maxLevel || 1
      const maxSkillLevel = rarityConfig?.maxSkillLevel || 4
      const characterId = normalizePositiveInteger(card.characterId)
      const unit = resolveCardUnit(card, characterId, characterUnitMap)
      const unitProfileName = unit ? unitProfileNameMap.get(unit) ?? null : null
      const prefix = normalizeText(card.prefix)
      const assetbundleName = normalizeText(card.assetbundleName)
      const label = prefix ? `${prefix} (#${id})` : `#${id}`
      const description = [
        rarity,
        attr,
        unitProfileName ?? unit,
      ].filter(Boolean).join(" / ")

      return {
        id,
        value: String(id),
        label,
        description,
        characterId,
        unit,
        unitProfileName,
        rarity,
        attr,
        maxLevel,
        maxSkillLevel,
        canSpecialTrain,
        thumbnailUrl: assetbundleName
          ? resolveSekaiCardThumbnailUrl(region, assetbundleName, canSpecialTrain, assetEndpoint)
          : null,
        attrIconUrl: attr ? resolveCardAttrIconUrl(attr) : null,
        keywords: [
          String(id),
          prefix ?? "",
          rarity ?? "",
          attr ?? "",
          unit ?? "",
          unitProfileName ?? "",
          characterId ? String(characterId) : "",
        ].filter(Boolean),
      }
    })
    .filter((item): item is DeckRecommendMasterCardOption => item != null)
    .sort((a, b) => a.id - b.id)
}

function buildUnitProfileNameMap(rawUnitProfiles: unknown): Map<DeckRecommendUnitType, string> {
  const map = new Map<DeckRecommendUnitType, string>()
  if (!Array.isArray(rawUnitProfiles)) {
    return map
  }

  for (const item of rawUnitProfiles as RawUnitProfile[]) {
    const unit = normalizeUnit(item.unit)
    const name = normalizeText(item.unitProfileName) ?? normalizeText(item.unitName)
    if (unit && name) {
      map.set(unit, name)
    }
  }
  return map
}

function buildRarityMap(rawRarities: unknown): Map<DeckRecommendRarity, Required<Pick<RawCardRarity, "maxLevel" | "trainingMaxLevel" | "maxSkillLevel">>> {
  const map = new Map<DeckRecommendRarity, Required<Pick<RawCardRarity, "maxLevel" | "trainingMaxLevel" | "maxSkillLevel">>>()
  if (!Array.isArray(rawRarities)) {
    return map
  }

  for (const item of rawRarities as RawCardRarity[]) {
    const rarity = normalizeRarity(item.cardRarityType)
    if (!rarity) {
      continue
    }

    map.set(rarity, {
      maxLevel: normalizePositiveInteger(item.maxLevel) ?? 1,
      trainingMaxLevel: normalizePositiveInteger(item.trainingMaxLevel) ?? 0,
      maxSkillLevel: normalizePositiveInteger(item.maxSkillLevel) ?? 4,
    })
  }
  return map
}

function buildCharacterUnitMap(rawCharacters: unknown): Map<number, DeckRecommendUnitType> {
  const map = new Map<number, DeckRecommendUnitType>()
  if (!Array.isArray(rawCharacters)) {
    return map
  }

  for (const item of rawCharacters as RawGameCharacter[]) {
    const id = normalizePositiveInteger(item.id)
    const unit = normalizeUnit(item.unit)
    if (id && unit) {
      map.set(id, unit)
    }
  }
  return map
}

function resolveCardUnit(
  card: RawCard,
  characterId: number | null,
  characterUnitMap: ReadonlyMap<number, DeckRecommendUnitType>,
): DeckRecommendUnitType | null {
  const supportUnit = normalizeUnit(card.supportUnit)
  if (supportUnit && supportUnit !== "piapro") {
    return supportUnit
  }
  return characterId ? characterUnitMap.get(characterId) ?? null : null
}

function normalizeRarity(value: unknown): DeckRecommendRarity | null {
  switch (value) {
    case "rarity_1":
    case "rarity_2":
    case "rarity_3":
    case "rarity_4":
    case "rarity_birthday":
      return value
    default:
      return null
  }
}

function normalizeAttr(value: unknown): DeckRecommendEventAttr | null {
  switch (value) {
    case "happy":
    case "cute":
    case "cool":
    case "pure":
    case "mysterious":
      return value
    default:
      return null
  }
}

function normalizeUnit(value: unknown): DeckRecommendUnitType | null {
  switch (value) {
    case "light_sound":
    case "idol":
    case "street":
    case "theme_park":
    case "school_refusal":
    case "piapro":
      return value
    default:
      return null
  }
}

function normalizePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null
  }

  return value
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
