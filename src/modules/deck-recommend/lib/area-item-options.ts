import {
  resolveCharacterIconUrl,
  resolveToolboxStaticImageUrl,
} from "@/shared/sekai/data-sources"
import type { DeckRecommendEventAttr, DeckRecommendUnitType } from "./recommend-options"

export type DeckRecommendAreaItemKind = "character" | "unit" | "attr"

export type DeckRecommendAreaItemOption = {
  id: number
  value: string
  kind: DeckRecommendAreaItemKind
  areaId: number
  areaName: string | null
  areaSubName: string | null
  itemName: string | null
  maxLevel: number
  targetCharacterId: number | null
  targetUnit: DeckRecommendUnitType | null
  targetAttr: DeckRecommendEventAttr | null
  targetLabel: string | null
  iconUrl: string | null
}

type RawArea = {
  id?: number
  name?: string
  subName?: string
}

type RawAreaItem = {
  id?: number
  areaId?: number
  name?: string
}

type RawAreaItemLevel = {
  areaItemId?: number
  level?: number
  targetUnit?: string
  targetCardAttr?: string
  targetGameCharacterId?: number | null
}

type RawGameCharacter = {
  id?: number
  firstName?: string
  givenName?: string
  firstNameEnglish?: string
  givenNameEnglish?: string
}

type RawUnitProfile = {
  unit?: string
  unitProfileName?: string
  unitName?: string
}

type AreaItemTargetInfo = {
  kind: DeckRecommendAreaItemKind
  maxLevel: number
  targetCharacterId: number | null
  targetUnit: DeckRecommendUnitType | null
  targetAttr: DeckRecommendEventAttr | null
}

type AreaInfo = {
  name: string | null
  subName: string | null
}

const AREA_ITEM_KIND_ORDER: Record<DeckRecommendAreaItemKind, number> = {
  character: 0,
  unit: 1,
  attr: 2,
}

const UNIT_ORDER: DeckRecommendUnitType[] = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "piapro",
]

const ATTR_ORDER: DeckRecommendEventAttr[] = ["happy", "cute", "cool", "pure", "mysterious"]

export function buildDeckRecommendAreaItemOptions(masterData: Record<string, unknown> | null): DeckRecommendAreaItemOption[] {
  const areaItems = Array.isArray(masterData?.areaItems) ? masterData.areaItems as RawAreaItem[] : []
  const targetInfoMap = buildAreaItemTargetInfoMap(masterData?.areaItemLevels)
  const areaInfoMap = buildAreaInfoMap(masterData?.areas)
  const characterNameMap = buildCharacterNameMap(masterData?.gameCharacters)
  const unitNameMap = buildUnitNameMap(masterData?.unitProfiles)

  return areaItems
    .map((item) => {
      const id = normalizePositiveInteger(item.id)
      const areaId = normalizePositiveInteger(item.areaId)
      if (!id || !areaId) {
        return null
      }

      const targetInfo = targetInfoMap.get(id)
      if (!targetInfo) {
        return null
      }

      const targetLabel = resolveTargetLabel(targetInfo, characterNameMap, unitNameMap)
      const areaInfo = areaInfoMap.get(areaId)

      return {
        id,
        value: String(id),
        kind: targetInfo.kind,
        areaId,
        areaName: areaInfo?.name ?? null,
        areaSubName: areaInfo?.subName ?? null,
        itemName: normalizeText(item.name),
        maxLevel: targetInfo.maxLevel,
        targetCharacterId: targetInfo.targetCharacterId,
        targetUnit: targetInfo.targetUnit,
        targetAttr: targetInfo.targetAttr,
        targetLabel,
        iconUrl: resolveAreaItemIconUrl(targetInfo),
      }
    })
    .filter((item): item is DeckRecommendAreaItemOption => item != null)
    .sort(compareAreaItemOptions)
}

export function resolveUnitIconUrl(unit: DeckRecommendUnitType): string {
  return resolveToolboxStaticImageUrl(`static_images/icon_${unit}.png`)
}

export function resolveAreaItemAttrIconUrl(attr: DeckRecommendEventAttr): string {
  return resolveToolboxStaticImageUrl(`static_images/card/attr_icon_${attr}.png`)
}

function buildAreaItemTargetInfoMap(areaItemLevels: unknown): Map<number, AreaItemTargetInfo> {
  const map = new Map<number, AreaItemTargetInfo>()
  if (!Array.isArray(areaItemLevels)) {
    return map
  }

  for (const item of areaItemLevels as RawAreaItemLevel[]) {
    const areaItemId = normalizePositiveInteger(item.areaItemId)
    const level = normalizePositiveInteger(item.level)
    if (!areaItemId || !level) {
      continue
    }

    const existing = map.get(areaItemId)
    const targetInfo = existing ?? createAreaItemTargetInfo(item)
    if (!targetInfo) {
      continue
    }

    map.set(areaItemId, {
      ...targetInfo,
      maxLevel: Math.max(existing?.maxLevel ?? 0, level),
    })
  }

  return map
}

function createAreaItemTargetInfo(item: RawAreaItemLevel): AreaItemTargetInfo | null {
  const targetCharacterId = normalizePositiveInteger(item.targetGameCharacterId)
  const targetUnit = normalizeUnit(item.targetUnit)
  const targetAttr = normalizeAttr(item.targetCardAttr)

  if (targetCharacterId) {
    return {
      kind: "character",
      maxLevel: 0,
      targetCharacterId,
      targetUnit: null,
      targetAttr: null,
    }
  }

  if (targetUnit) {
    return {
      kind: "unit",
      maxLevel: 0,
      targetCharacterId: null,
      targetUnit,
      targetAttr: null,
    }
  }

  if (targetAttr) {
    return {
      kind: "attr",
      maxLevel: 0,
      targetCharacterId: null,
      targetUnit: null,
      targetAttr,
    }
  }

  return null
}

function buildAreaInfoMap(areas: unknown): Map<number, AreaInfo> {
  const map = new Map<number, AreaInfo>()
  if (!Array.isArray(areas)) {
    return map
  }

  for (const item of areas as RawArea[]) {
    const id = normalizePositiveInteger(item.id)
    if (id) {
      map.set(id, {
        name: normalizeText(item.name),
        subName: normalizeText(item.subName),
      })
    }
  }

  return map
}

function buildCharacterNameMap(characters: unknown): Map<number, string> {
  const map = new Map<number, string>()
  if (!Array.isArray(characters)) {
    return map
  }

  for (const item of characters as RawGameCharacter[]) {
    const id = normalizePositiveInteger(item.id)
    if (id) {
      map.set(id, resolveCharacterName(item, id))
    }
  }

  return map
}

function buildUnitNameMap(unitProfiles: unknown): Map<DeckRecommendUnitType, string> {
  const map = new Map<DeckRecommendUnitType, string>()
  if (!Array.isArray(unitProfiles)) {
    return map
  }

  for (const item of unitProfiles as RawUnitProfile[]) {
    const unit = normalizeUnit(item.unit)
    const name = normalizeText(item.unitProfileName) ?? normalizeText(item.unitName)
    if (unit && name) {
      map.set(unit, name)
    }
  }

  return map
}

function resolveTargetLabel(
  targetInfo: AreaItemTargetInfo,
  characterNameMap: ReadonlyMap<number, string>,
  unitNameMap: ReadonlyMap<DeckRecommendUnitType, string>,
): string | null {
  if (targetInfo.targetCharacterId) {
    return characterNameMap.get(targetInfo.targetCharacterId) ?? `#${targetInfo.targetCharacterId}`
  }

  if (targetInfo.targetUnit) {
    return unitNameMap.get(targetInfo.targetUnit) ?? targetInfo.targetUnit
  }

  return targetInfo.targetAttr
}

function resolveAreaItemIconUrl(targetInfo: AreaItemTargetInfo): string | null {
  if (targetInfo.targetCharacterId) {
    return resolveCharacterIconUrl(targetInfo.targetCharacterId)
  }

  if (targetInfo.targetUnit) {
    return resolveUnitIconUrl(targetInfo.targetUnit)
  }

  if (targetInfo.targetAttr) {
    return resolveAreaItemAttrIconUrl(targetInfo.targetAttr)
  }

  return null
}

function compareAreaItemOptions(left: DeckRecommendAreaItemOption, right: DeckRecommendAreaItemOption): number {
  return AREA_ITEM_KIND_ORDER[left.kind] - AREA_ITEM_KIND_ORDER[right.kind]
    || left.areaId - right.areaId
    || compareTargetOrder(left, right)
    || left.id - right.id
}

function compareTargetOrder(left: DeckRecommendAreaItemOption, right: DeckRecommendAreaItemOption): number {
  if (left.kind === "character" && right.kind === "character") {
    return (left.targetCharacterId ?? 0) - (right.targetCharacterId ?? 0)
  }

  if (left.kind === "unit" && right.kind === "unit") {
    return UNIT_ORDER.indexOf(left.targetUnit ?? "light_sound") - UNIT_ORDER.indexOf(right.targetUnit ?? "light_sound")
  }

  if (left.kind === "attr" && right.kind === "attr") {
    return ATTR_ORDER.indexOf(left.targetAttr ?? "happy") - ATTR_ORDER.indexOf(right.targetAttr ?? "happy")
  }

  return 0
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

function normalizePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
