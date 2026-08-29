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

/** Row from the `mysekaiGateLevels` masterdata file. */
export type MysekaiGateLevelMaster = {
  mysekaiGateId: number
  level: number
  powerBonusRate: number
}

/** Normalized entry from the suite `userMysekaiGates` list. */
export type UserMysekaiGate = {
  mysekaiGateId: number
  mysekaiGateLevel: number
}

/** Normalized entry from `userMysekaiFixtureGameCharacterPerformanceBonuses`. */
export type UserMysekaiFixtureBonus = {
  gameCharacterId: number
  totalBonusRate: number
}

/** MYSEKAI gate id → boosted unit, mirrored from the Go `gateUnitByID` map. */
export const MYSEKAI_GATE_UNITS: Record<number, PowerBonusUnit> = {
  1: "light_sound",
  2: "idol",
  3: "street",
  4: "theme_park",
  5: "school_refusal",
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
  fixture: number
  total: number
}

export type UnitPowerBonus = {
  unit: PowerBonusUnit
  areaItem: number
  gate: number
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

/** Tolerantly parses the `mysekaiGateLevels` masterdata list. */
export function normalizeMysekaiGateLevels(raw: unknown): MysekaiGateLevelMaster[] {
  const levels: MysekaiGateLevelMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const mysekaiGateId = normalizeCatalogNumber(record.mysekaiGateId)
    const level = normalizeCatalogNumber(record.level)
    if (mysekaiGateId == null || level == null) {
      continue
    }

    levels.push({
      mysekaiGateId,
      level,
      powerBonusRate: normalizeCatalogNumber(record.powerBonusRate) ?? 0,
    })
  }

  return levels
}

/** Tolerantly parses the suite `userMysekaiGates` list. */
export function normalizeUserMysekaiGates(raw: unknown): UserMysekaiGate[] {
  const gates: UserMysekaiGate[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const mysekaiGateId = normalizeCatalogNumber(record.mysekaiGateId)
    if (mysekaiGateId == null) {
      continue
    }

    gates.push({
      mysekaiGateId,
      mysekaiGateLevel: normalizeCatalogNumber(record.mysekaiGateLevel) ?? 0,
    })
  }

  return gates
}

/** Tolerantly parses `userMysekaiFixtureGameCharacterPerformanceBonuses`. */
export function normalizeUserMysekaiFixtureBonuses(raw: unknown): UserMysekaiFixtureBonus[] {
  const bonuses: UserMysekaiFixtureBonus[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const gameCharacterId = normalizeCatalogNumber(record.gameCharacterId)
    if (gameCharacterId == null) {
      continue
    }

    bonuses.push({
      gameCharacterId,
      totalBonusRate: normalizeCatalogNumber(record.totalBonusRate) ?? 0,
    })
  }

  return bonuses
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
  mysekaiGateLevels?: readonly MysekaiGateLevelMaster[]
  userMysekaiGates?: readonly UserMysekaiGate[]
  userMysekaiFixtureBonuses?: readonly UserMysekaiFixtureBonus[]
}

export type PowerBonusResult = {
  characters: CharacterPowerBonus[]
  units: UnitPowerBonus[]
  attrs: AttrPowerBonus[]
}

type MutablePowerBonuses = {
  characters: Map<number, CharacterPowerBonus>
  units: Map<PowerBonusUnit, UnitPowerBonus>
  attrs: Map<PowerBonusAttr, AttrPowerBonus>
}

function createMutablePowerBonuses(): MutablePowerBonuses {
  const characters = new Map<number, CharacterPowerBonus>()
  for (let characterId = 1; characterId <= POWER_BONUS_CHARACTER_COUNT; characterId += 1) {
    characters.set(characterId, { characterId, areaItem: 0, rank: 0, fixture: 0, total: 0 })
  }

  const units = new Map<PowerBonusUnit, UnitPowerBonus>()
  for (const unit of POWER_BONUS_UNIT_ORDER) {
    units.set(unit, { unit, areaItem: 0, gate: 0, total: 0 })
  }

  const attrs = new Map<PowerBonusAttr, AttrPowerBonus>()
  for (const attr of POWER_BONUS_ATTR_ORDER) {
    attrs.set(attr, { attr, areaItem: 0, total: 0 })
  }

  return { characters, units, attrs }
}

function buildAreaItemLevelIndex(levels: readonly AreaItemLevelMaster[]): Map<string, AreaItemLevelMaster> {
  const index = new Map<string, AreaItemLevelMaster>()
  for (const level of levels) {
    index.set(`${level.areaItemId}:${level.level}`, level)
  }
  return index
}

function addAreaItemBonus(level: AreaItemLevelMaster, bonuses: MutablePowerBonuses): void {
  const characterBonus = bonuses.characters.get(level.targetGameCharacterId)
  if (level.targetGameCharacterId > 0 && characterBonus) {
    characterBonus.areaItem += level.power1BonusRate
  }

  const unitBonus = bonuses.units.get(normalizeUnitName(level.targetUnit) as PowerBonusUnit)
  if (unitBonus) {
    unitBonus.areaItem += level.power1BonusRate
  }

  const attrBonus = bonuses.attrs.get(normalizeAttrName(level.targetCardAttr) as PowerBonusAttr)
  if (attrBonus) {
    attrBonus.areaItem += level.power1BonusRate
  }
}

function applyAreaItemBonuses(input: BuildPowerBonusesInput, bonuses: MutablePowerBonuses): void {
  const levelIndex = buildAreaItemLevelIndex(input.areaItemLevels)
  for (const [areaItemId, itemLevel] of input.userAreaItemLevels) {
    if (itemLevel <= 0) {
      continue
    }

    const level = levelIndex.get(`${areaItemId}:${itemLevel}`)
    if (level) {
      addAreaItemBonus(level, bonuses)
    }
  }
}

function buildCharacterRankIndex(ranks: readonly CharacterRankBonusMaster[]): Map<string, CharacterRankBonusMaster> {
  const index = new Map<string, CharacterRankBonusMaster>()
  for (const rank of ranks) {
    index.set(`${rank.characterId}:${rank.characterRank}`, rank)
  }
  return index
}

function applyCharacterRankBonuses(input: BuildPowerBonusesInput, bonuses: MutablePowerBonuses): void {
  const rankIndex = buildCharacterRankIndex(input.characterRanks)
  for (const character of input.userCharacters) {
    const rank = rankIndex.get(`${character.characterId}:${character.characterRank}`)
    const characterBonus = bonuses.characters.get(character.characterId)
    if (rank && characterBonus) {
      characterBonus.rank += rank.power1BonusRate
    }
  }
}

function applyFixtureBonuses(input: BuildPowerBonusesInput, bonuses: MutablePowerBonuses): void {
  for (const fixture of input.userMysekaiFixtureBonuses ?? []) {
    const characterBonus = bonuses.characters.get(fixture.gameCharacterId)
    if (characterBonus) {
      characterBonus.fixture += fixture.totalBonusRate * 0.1
    }
  }
}

function buildGateLevelIndex(levels: readonly MysekaiGateLevelMaster[]): Map<string, MysekaiGateLevelMaster> {
  const index = new Map<string, MysekaiGateLevelMaster>()
  for (const level of levels) {
    index.set(`${level.mysekaiGateId}:${level.level}`, level)
  }
  return index
}

function applyGateBonuses(input: BuildPowerBonusesInput, bonuses: MutablePowerBonuses): void {
  const levelIndex = buildGateLevelIndex(input.mysekaiGateLevels ?? [])
  let maxGateBonus = 0
  for (const gate of input.userMysekaiGates ?? []) {
    const level = levelIndex.get(`${gate.mysekaiGateId}:${gate.mysekaiGateLevel}`)
    if (!level) {
      continue
    }

    const unit = MYSEKAI_GATE_UNITS[gate.mysekaiGateId]
    const unitBonus = unit ? bonuses.units.get(unit) : null
    if (unitBonus) {
      unitBonus.gate += level.powerBonusRate
    }
    maxGateBonus = Math.max(maxGateBonus, level.powerBonusRate)
  }

  const piaproBonus = bonuses.units.get("piapro")
  if (piaproBonus) {
    piaproBonus.gate += maxGateBonus
  }
}

function finalizePowerBonuses(bonuses: MutablePowerBonuses): PowerBonusResult {
  const characters = Array.from({ length: POWER_BONUS_CHARACTER_COUNT }, (_, index) => {
    const bonus = bonuses.characters.get(index + 1)!
    bonus.total = bonus.areaItem + bonus.rank + bonus.fixture
    return bonus
  })
  const units = POWER_BONUS_UNIT_ORDER.map((unit) => {
    const bonus = bonuses.units.get(unit)!
    bonus.total = bonus.areaItem + bonus.gate
    return bonus
  })
  const attrs = POWER_BONUS_ATTR_ORDER.map((attr) => {
    const bonus = bonuses.attrs.get(attr)!
    bonus.total = bonus.areaItem
    return bonus
  })
  return { characters, units, attrs }
}

/**
 * Ports `BuildPowerBonusDetailRequestFromSnapshot` including the MYSEKAI
 * contributions:
 * - per-character: area-item bonus (rows targeting `targetGameCharacterId`)
 *   plus character-rank bonus plus fixture bonus (`totalBonusRate` × 0.1);
 *   total = areaItem + rank + fixture.
 * - per-unit: area-item bonus from rows targeting `targetUnit` plus the
 *   unit's gate bonus; piapro receives the highest gate bonus across all
 *   gates; total = areaItem + gate.
 * - per-attribute: area-item bonus from rows targeting `targetCardAttr`;
 *   total = areaItem.
 */
export function buildPowerBonuses(input: BuildPowerBonusesInput): PowerBonusResult {
  const bonuses = createMutablePowerBonuses()
  applyAreaItemBonuses(input, bonuses)
  applyCharacterRankBonuses(input, bonuses)
  applyFixtureBonuses(input, bonuses)
  applyGateBonuses(input, bonuses)
  return finalizePowerBonuses(bonuses)
}

/** Formats a bonus percentage with one decimal, e.g. `12.5%`. */
export function formatPowerBonusPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
