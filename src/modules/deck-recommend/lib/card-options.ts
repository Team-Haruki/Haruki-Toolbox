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
  characterName: string | null
  characterColorCode: string | null
  unit: DeckRecommendUnitType | null
  unitProfileName: string | null
  unitColorCode: string | null
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
  firstName?: string
  givenName?: string
  firstNameEnglish?: string
  givenNameEnglish?: string
}

type RawGameCharacterUnit = {
  gameCharacterId?: number
  colorCode?: string
}

type RawUnitProfile = {
  unit?: string
  unitProfileName?: string
  unitName?: string
  colorCode?: string
}

type MasterCharacterInfo = {
  name: string | null
  unit: DeckRecommendUnitType | null
  colorCode: string | null
}

type MasterUnitProfileInfo = {
  name: string | null
  colorCode: string | null
}

export function buildMasterCardOptions(
  masterData: Record<string, unknown> | null,
  region: SekaiRegion,
  assetEndpoint: SekaiAssetEndpointPreference,
): DeckRecommendMasterCardOption[] {
  const cards = Array.isArray(masterData?.cards) ? masterData.cards as RawCard[] : []
  const rarityMap = buildRarityMap(masterData?.cardRarities)
  const characterInfoMap = buildCharacterInfoMap(masterData?.gameCharacters, masterData?.gameCharacterUnits)
  const unitProfileMap = buildUnitProfileMap(masterData?.unitProfiles)

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
      const characterInfo = characterId ? characterInfoMap.get(characterId) ?? null : null
      const characterName = characterInfo?.name ?? null
      const characterColorCode = characterInfo?.colorCode ?? null
      const unit = resolveCardUnit(card, characterInfo?.unit ?? null)
      const unitProfile = unit ? unitProfileMap.get(unit) ?? null : null
      const unitProfileName = unitProfile?.name ?? null
      const unitColorCode = unitProfile?.colorCode ?? null
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
        characterName,
        characterColorCode,
        unit,
        unitProfileName,
        unitColorCode,
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
          characterName ?? "",
          characterId ? String(characterId) : "",
        ].filter(Boolean),
      }
    })
    .filter((item): item is DeckRecommendMasterCardOption => item != null)
    .sort((a, b) => a.id - b.id)
}

function buildUnitProfileMap(rawUnitProfiles: unknown): Map<DeckRecommendUnitType, MasterUnitProfileInfo> {
  const map = new Map<DeckRecommendUnitType, MasterUnitProfileInfo>()
  if (!Array.isArray(rawUnitProfiles)) {
    return map
  }

  for (const item of rawUnitProfiles as RawUnitProfile[]) {
    const unit = normalizeUnit(item.unit)
    const name = normalizeText(item.unitProfileName) ?? normalizeText(item.unitName)
    if (unit) {
      map.set(unit, {
        name,
        colorCode: normalizeColorCode(item.colorCode),
      })
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

function buildCharacterInfoMap(rawCharacters: unknown, rawCharacterUnits: unknown): Map<number, MasterCharacterInfo> {
  const colorMap = buildCharacterColorMap(rawCharacterUnits)
  const map = new Map<number, MasterCharacterInfo>()
  if (!Array.isArray(rawCharacters)) {
    return map
  }

  for (const item of rawCharacters as RawGameCharacter[]) {
    const id = normalizePositiveInteger(item.id)
    const unit = normalizeUnit(item.unit)
    if (id) {
      map.set(id, {
        name: resolveCharacterName(item, id),
        unit,
        colorCode: colorMap.get(id) ?? null,
      })
    }
  }
  return map
}

function buildCharacterColorMap(rawCharacterUnits: unknown): Map<number, string> {
  const map = new Map<number, string>()
  if (!Array.isArray(rawCharacterUnits)) {
    return map
  }

  for (const item of rawCharacterUnits as RawGameCharacterUnit[]) {
    const characterId = normalizePositiveInteger(item.gameCharacterId)
    const colorCode = normalizeColorCode(item.colorCode)
    if (characterId && colorCode && !map.has(characterId)) {
      map.set(characterId, colorCode)
    }
  }
  return map
}

function resolveCardUnit(card: RawCard, fallbackUnit: DeckRecommendUnitType | null): DeckRecommendUnitType | null {
  const supportUnit = normalizeUnit(card.supportUnit)
  if (supportUnit && supportUnit !== "piapro") {
    return supportUnit
  }
  return fallbackUnit
}

function resolveCharacterName(character: RawGameCharacter, id: number): string {
  const localized = `${normalizeText(character.firstName) ?? ""}${normalizeText(character.givenName) ?? ""}`
  if (localized) {
    return localized
  }

  const english = [normalizeText(character.givenNameEnglish), normalizeText(character.firstNameEnglish)]
    .filter((part): part is string => Boolean(part))
    .join(" ")
  return english || `#${id}`
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

function normalizeColorCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : null
}
