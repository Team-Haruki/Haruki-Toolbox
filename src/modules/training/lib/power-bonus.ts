import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/** Character roster size mirrored from the Go implementation (IDs 1..26). */
export const POWER_BONUS_CHARACTER_COUNT = 26

/** Fixed unit render order ported from `powerBonusUnitOrder`. */
export const POWER_BONUS_UNIT_ORDER = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "piapro",
] as const

export type PowerBonusUnit = (typeof POWER_BONUS_UNIT_ORDER)[number]

/** Fixed attribute render order ported from `powerBonusAttrOrder`. */
export const POWER_BONUS_ATTR_ORDER = [
  "cute",
  "cool",
  "pure",
  "happy",
  "mysterious",
] as const

export type PowerBonusAttr = (typeof POWER_BONUS_ATTR_ORDER)[number]

/** Row from the `areaItemLevels` masterdata file. */
export type AreaItemLevelMaster = {
  areaItemId: number
  level: number
  targetUnit: string
  targetCardAttr: string
  targetGameCharacterId: number
  power1BonusRate: number
}

/** Row from the `characterRanks` masterdata file. */
export type CharacterRankBonusMaster = {
  characterId: number
  characterRank: number
  power1BonusRate: number
}

/** Normalized entry from the suite `userCharacters` list. */
export type UserCharacterRank = {
  characterId: number
  characterRank: number
}

export type CharacterPowerBonus = {
  characterId: number
  areaItem: number
  rank: number
  total: number
}

export type UnitPowerBonus = {
  unit: PowerBonusUnit
  areaItem: number
  total: number
}

export type AttrPowerBonus = {
  attr: PowerBonusAttr
  areaItem: number
  total: number
}

/**
 * Ports `normalizeUnit`: trims/lowercases and collapses masterdata unit
 * aliases (e.g. `light_sound_club` → `light_sound`); "any"/"" become "".
 */
export function normalizeUnitName(value: unknown): string {
  const unit = normalizeCatalogString(value).toLowerCase()
  switch (unit) {
    case "":
    case "any":
      return ""
    case "light_sound_club":
      return "light_sound"
    case "more_more_jump":
      return "idol"
    case "vivid_bad_squad":
      return "street"
    case "wonderlands_x_showtime":
      return "theme_park"
    case "25_ji_night_cord_de":
      return "school_refusal"
    default:
      return unit
  }
}

/** Ports `normalizeAttr`: trims/lowercases; "any"/"" become "". */
export function normalizeAttrName(value: unknown): string {
  const attr = normalizeCatalogString(value).toLowerCase()
  return attr === "any" ? "" : attr
}

/** Tolerantly parses the `areaItemLevels` masterdata list. */
export function normalizeAreaItemLevels(raw: unknown): AreaItemLevelMaster[] {
  const levels: AreaItemLevelMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const areaItemId = normalizeCatalogNumber(record.areaItemId)
    const level = normalizeCatalogNumber(record.level)
    if (areaItemId == null || level == null) {
      continue
    }

    levels.push({
      areaItemId,
      level,
      targetUnit: normalizeCatalogString(record.targetUnit),
      targetCardAttr: normalizeCatalogString(record.targetCardAttr),
      targetGameCharacterId: normalizeCatalogNumber(record.targetGameCharacterId) ?? 0,
      power1BonusRate: normalizeCatalogNumber(record.power1BonusRate) ?? 0,
    })
  }

  return levels
}

/** Tolerantly parses the `characterRanks` masterdata list. */
export function normalizeCharacterRankBonuses(raw: unknown): CharacterRankBonusMaster[] {
  const ranks: CharacterRankBonusMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    const characterRank = normalizeCatalogNumber(record.characterRank)
    if (characterId == null || characterRank == null) {
      continue
    }

    ranks.push({
      characterId,
      characterRank,
      power1BonusRate: normalizeCatalogNumber(record.power1BonusRate) ?? 0,
    })
  }

  return ranks
}

/** Tolerantly parses the suite `userCharacters` list. */
export function normalizeUserCharacterRanks(raw: unknown): UserCharacterRank[] {
  const characters: UserCharacterRank[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null) {
      continue
    }

    characters.push({
      characterId,
      characterRank: normalizeCatalogNumber(record.characterRank) ?? 0,
    })
  }

  return characters
}

/**
 * Ports `collectUserAreaItemLevels`: highest owned level per area item across
 * every entry of the suite `userAreas[].areaItems[]` lists.
 */
export function collectUserAreaItemLevels(rawUserAreas: unknown): Map<number, number> {
  const levels = new Map<number, number>()
  for (const area of normalizeCatalogRecords(rawUserAreas)) {
    for (const item of normalizeCatalogRecords(area.areaItems)) {
      const areaItemId = normalizeCatalogNumber(item.areaItemId)
      const level = normalizeCatalogNumber(item.level) ?? 0
      if (areaItemId == null || areaItemId <= 0) {
        continue
      }
      if (level > (levels.get(areaItemId) ?? 0)) {
        levels.set(areaItemId, level)
      }
    }
  }

  return levels
}

export type BuildPowerBonusesInput = {
  /** Highest owned level per area item (see {@link collectUserAreaItemLevels}). */
  userAreaItemLevels: ReadonlyMap<number, number>
  areaItemLevels: readonly AreaItemLevelMaster[]
  userCharacters: readonly UserCharacterRank[]
  characterRanks: readonly CharacterRankBonusMaster[]
}

export type PowerBonusResult = {
  characters: CharacterPowerBonus[]
  units: UnitPowerBonus[]
  attrs: AttrPowerBonus[]
}

/**
 * Ports `BuildPowerBonusDetailRequestFromSnapshot` minus all MYSEKAI
 * contributions (fixture and gate columns are intentionally dropped):
 * - per-character: area-item bonus (rows targeting `targetGameCharacterId`)
 *   plus character-rank bonus; total = areaItem + rank.
 * - per-unit: area-item bonus from rows targeting `targetUnit`; total = areaItem.
 * - per-attribute: area-item bonus from rows targeting `targetCardAttr`;
 *   total = areaItem.
 */
export function buildPowerBonuses(input: BuildPowerBonusesInput): PowerBonusResult {
  const characters = new Map<number, CharacterPowerBonus>()
  for (let characterId = 1; characterId <= POWER_BONUS_CHARACTER_COUNT; characterId += 1) {
    characters.set(characterId, { characterId, areaItem: 0, rank: 0, total: 0 })
  }
  const units = new Map<PowerBonusUnit, UnitPowerBonus>()
  for (const unit of POWER_BONUS_UNIT_ORDER) {
    units.set(unit, { unit, areaItem: 0, total: 0 })
  }
  const attrs = new Map<PowerBonusAttr, AttrPowerBonus>()
  for (const attr of POWER_BONUS_ATTR_ORDER) {
    attrs.set(attr, { attr, areaItem: 0, total: 0 })
  }

  const levelByItemAndLevel = new Map<string, AreaItemLevelMaster>()
  for (const level of input.areaItemLevels) {
    levelByItemAndLevel.set(`${level.areaItemId}:${level.level}`, level)
  }

  for (const [areaItemId, itemLevel] of input.userAreaItemLevels) {
    if (itemLevel <= 0) {
      continue
    }
    const level = levelByItemAndLevel.get(`${areaItemId}:${itemLevel}`)
    if (level == null) {
      continue
    }

    if (level.targetGameCharacterId > 0) {
      const bonus = characters.get(level.targetGameCharacterId)
      if (bonus != null) {
        bonus.areaItem += level.power1BonusRate
      }
    }
    const normalizedUnit = normalizeUnitName(level.targetUnit)
    if (normalizedUnit !== "") {
      const bonus = units.get(normalizedUnit as PowerBonusUnit)
      if (bonus != null) {
        bonus.areaItem += level.power1BonusRate
      }
    }
    const normalizedAttr = normalizeAttrName(level.targetCardAttr)
    if (normalizedAttr !== "") {
      const bonus = attrs.get(normalizedAttr as PowerBonusAttr)
      if (bonus != null) {
        bonus.areaItem += level.power1BonusRate
      }
    }
  }

  const rankByCharacterAndRank = new Map<string, CharacterRankBonusMaster>()
  for (const rank of input.characterRanks) {
    rankByCharacterAndRank.set(`${rank.characterId}:${rank.characterRank}`, rank)
  }

  for (const character of input.userCharacters) {
    const rank = rankByCharacterAndRank.get(`${character.characterId}:${character.characterRank}`)
    if (rank == null) {
      continue
    }
    const bonus = characters.get(character.characterId)
    if (bonus != null) {
      bonus.rank += rank.power1BonusRate
    }
  }

  const characterList: CharacterPowerBonus[] = []
  for (let characterId = 1; characterId <= POWER_BONUS_CHARACTER_COUNT; characterId += 1) {
    const bonus = characters.get(characterId)
    if (bonus != null) {
      bonus.total = bonus.areaItem + bonus.rank
      characterList.push(bonus)
    }
  }

  const unitList: UnitPowerBonus[] = []
  for (const unit of POWER_BONUS_UNIT_ORDER) {
    const bonus = units.get(unit)
    if (bonus != null) {
      bonus.total = bonus.areaItem
      unitList.push(bonus)
    }
  }

  const attrList: AttrPowerBonus[] = []
  for (const attr of POWER_BONUS_ATTR_ORDER) {
    const bonus = attrs.get(attr)
    if (bonus != null) {
      bonus.total = bonus.areaItem
      attrList.push(bonus)
    }
  }

  return { characters: characterList, units: unitList, attrs: attrList }
}

/** Formats a bonus percentage with one decimal, e.g. `12.5%`. */
export function formatPowerBonusPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
