import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/**
 * Character mission math, ported from Haruki-Cloud
 * internal/pjsk/render/education/snapshot_character_missions.go
 * (overview mode).
 */

/** Go: CharacterMissionExTypes. */
export const CHARACTER_MISSION_EX_TYPES = new Set(["play_live_ex", "waiting_room_ex"])

/** Go: fixed "basic" group order in buildCharacterMissionOverview. */
export const CHARACTER_MISSION_BASIC_TYPES = [
  "collect_member",
  "collect_stamp",
  "collect_costume_3d",
  "collect_character_archive_voice",
  "collect_another_vocal",
  "read_mysekai_fixture_unique_character_talk",
  "read_area_talk",
] as const

/** Go: fixed "achievement" group order in buildCharacterMissionOverview. */
export const CHARACTER_MISSION_ACHIEVEMENT_TYPES = [
  "play_live",
  "play_live_ex",
  "waiting_room",
  "waiting_room_ex",
  "read_card_episode_first",
  "read_card_episode_second",
  "area_item_level_up_character",
  "area_item_level_up_unit",
  "area_item_level_up_reality_world",
  "skill_level_up_rare",
  "skill_level_up_standard",
  "master_rank_up_rare",
  "master_rank_up_standard",
  "collect_mysekai_fixture",
  "collect_mysekai_canvas",
] as const

export type CharacterMissionMaster = {
  id: number
  characterId: number
  characterMissionType: string
  parameterGroupId: number
  isAchievementMission: boolean
}

/**
 * `characterMissionV2ParameterGroups.json` row. The group identifier field
 * is `id` in raw master dumps (Haruki-Cloud's converted dumps call it
 * `gameId`); both spellings are accepted.
 */
export type CharacterMissionParameterGroupRow = {
  groupId: number
  seq: number
  requirement: number
  exp: number
}

export type CharacterLevelRow = {
  level: number
  totalExp: number
}

export type UserCharacterMissionRow = {
  characterId: number
  characterMissionType: string
  progress: number
}

export type UserCharacterMissionStatusRow = {
  missionId: number
  characterId: number
  parameterGroupId: number
  seq: number
  missionStatus: string
}

export function normalizeCharacterMissionMasters(raw: unknown): CharacterMissionMaster[] {
  const missions: CharacterMissionMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const id = normalizeCatalogNumber(record.id)
    const characterId = normalizeCatalogNumber(record.characterId)
    if (id == null || id <= 0 || characterId == null || characterId <= 0) {
      continue
    }

    missions.push({
      id,
      characterId,
      characterMissionType: normalizeCatalogString(record.characterMissionType),
      parameterGroupId: normalizeCatalogNumber(record.parameterGroupId) ?? 0,
      isAchievementMission: record.isAchievementMission === true,
    })
  }

  return missions
}

export function normalizeCharacterMissionParameterGroups(raw: unknown): CharacterMissionParameterGroupRow[] {
  const rows: CharacterMissionParameterGroupRow[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const groupId = normalizeCatalogNumber(record.id) ?? normalizeCatalogNumber(record.gameId)
    const seq = normalizeCatalogNumber(record.seq)
    if (groupId == null || groupId <= 0 || seq == null || seq <= 0) {
      continue
    }

    rows.push({
      groupId,
      seq,
      requirement: normalizeCatalogNumber(record.requirement) ?? 0,
      exp: normalizeCatalogNumber(record.exp) ?? 0,
    })
  }

  return rows
}

/** `levels.json` rows with `levelType == "character"`, sorted by level. */
export function extractCharacterLevels(rawLevels: unknown): CharacterLevelRow[] {
  const rows: CharacterLevelRow[] = []
  for (const record of normalizeCatalogRecords(rawLevels)) {
    if (normalizeCatalogString(record.levelType).toLowerCase() !== "character") {
      continue
    }

    const level = normalizeCatalogNumber(record.level)
    if (level == null || level <= 0) {
      continue
    }

    rows.push({ level, totalExp: normalizeCatalogNumber(record.totalExp) ?? 0 })
  }

  return rows.sort((a, b) => a.level - b.level)
}

export function normalizeUserCharacterMissions(raw: unknown): UserCharacterMissionRow[] {
  const rows: UserCharacterMissionRow[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null || characterId <= 0) {
      continue
    }

    rows.push({
      characterId,
      characterMissionType: normalizeCatalogString(record.characterMissionType),
      progress: normalizeCatalogNumber(record.progress) ?? 0,
    })
  }

  return rows
}

export function normalizeUserCharacterMissionStatuses(raw: unknown): UserCharacterMissionStatusRow[] {
  const rows: UserCharacterMissionStatusRow[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null || characterId <= 0) {
      continue
    }

    rows.push({
      missionId: normalizeCatalogNumber(record.missionId) ?? 0,
      characterId,
      parameterGroupId: normalizeCatalogNumber(record.parameterGroupId) ?? 0,
      seq: normalizeCatalogNumber(record.seq) ?? 0,
      missionStatus: normalizeCatalogString(record.missionStatus),
    })
  }

  return rows
}

/** Go: characterMissionRequirementForRound — last requirement with seq <= round. */
export function characterMissionRequirementForRound(
  groups: readonly CharacterMissionParameterGroupRow[],
  roundNo: number,
): number {
  if (roundNo <= 0) {
    return 0
  }

  let value = 0
  for (const group of groups) {
    if (group.seq > roundNo) {
      break
    }
    value = group.requirement
  }

  return value
}

/** Go: characterMissionExpForRound. */
export function characterMissionExpForRound(
  groups: readonly CharacterMissionParameterGroupRow[],
  roundNo: number,
): number {
  if (roundNo <= 0) {
    return 0
  }

  let value = 0
  for (const group of groups) {
    if (group.seq > roundNo) {
      break
    }
    value = group.exp
  }

  return value
}

/** Go: characterMissionRequirementBySeq. */
export function characterMissionRequirementBySeq(
  groups: readonly CharacterMissionParameterGroupRow[],
  seq: number,
): number {
  if (seq <= 0) {
    return 0
  }

  let value = 0
  for (const group of groups) {
    if (group.seq > seq) {
      break
    }
    value = group.requirement
  }

  return value
}

/** Go: characterMissionGroupExp. */
export function characterMissionGroupExp(
  groups: readonly CharacterMissionParameterGroupRow[],
  seq: number,
): number {
  if (seq <= 0) {
    return 0
  }

  let value = 0
  for (const group of groups) {
    if (group.seq > seq) {
      break
    }
    value = group.exp
  }

  return value
}

/** Go: characterMissionClearedTotal — sum of round requirements 1..seq. */
export function characterMissionClearedTotal(
  groups: readonly CharacterMissionParameterGroupRow[],
  seq: number,
): number {
  if (seq <= 0) {
    return 0
  }

  let total = 0
  for (let roundNo = 1; roundNo <= seq; roundNo++) {
    total += characterMissionRequirementForRound(groups, roundNo)
  }

  return total
}

/** Go: characterMissionUpper — EX types sum rounds 1..30, others use the max requirement. */
export function characterMissionUpper(
  groups: readonly CharacterMissionParameterGroupRow[],
  isEx: boolean,
): number | null {
  if (groups.length === 0) {
    return null
  }

  if (isEx) {
    let total = 0
    for (let roundNo = 1; roundNo <= 30; roundNo++) {
      total += characterMissionRequirementForRound(groups, roundNo)
    }
    return total > 0 ? total : null
  }

  let maxRequirement = 0
  for (const group of groups) {
    if (group.requirement > maxRequirement) {
      maxRequirement = group.requirement
    }
  }

  return maxRequirement > 0 ? maxRequirement : null
}

/** Go: characterMissionCurrentRound — returns [roundNo, inRoundProgress, roundNeed]. */
export function characterMissionCurrentRound(
  groups: readonly CharacterMissionParameterGroupRow[],
  total: number,
): [number, number, number] {
  let remaining = Math.max(total, 0)
  let roundNo = 1
  for (;;) {
    const requirement = characterMissionRequirementForRound(groups, roundNo)
    if (requirement <= 0 || remaining < requirement) {
      return [roundNo, remaining, requirement]
    }
    remaining -= requirement
    roundNo++
  }
}

/** Go: characterMissionNextTarget — returns [nextNeed, nextExp]. */
export function characterMissionNextTarget(
  groups: readonly CharacterMissionParameterGroupRow[],
  current: number,
  isEx: boolean,
): [number | null, number | null] {
  if (isEx) {
    const [roundNo, inRoundProgress, roundNeed] = characterMissionCurrentRound(groups, current)
    if (roundNeed <= 0) {
      return [null, null]
    }
    const nextNeed = current + Math.max(roundNeed - inRoundProgress, 0)
    const nextExp = characterMissionExpForRound(groups, roundNo)
    return [nextNeed > 0 ? nextNeed : null, nextExp > 0 ? nextExp : null]
  }

  for (const group of groups) {
    if (group.requirement > current) {
      return [group.requirement > 0 ? group.requirement : null, group.exp > 0 ? group.exp : null]
    }
  }

  return [null, null]
}

export type CharacterMissionRowView = {
  missionId: number
  missionType: string
  isAchievement: boolean
  isEx: boolean
  current: number
  upper: number | null
  ratio: number
  nextNeed: number | null
  nextExp: number | null
  currentRound: number | null
  currentRoundProgress: number | null
  currentRoundNeed: number | null
}

export type CharacterMissionSummary = {
  characterId: number
  currentLevel: number
  currentExp: number
  pendingExp: number
  finalLevel: number
  finalExp: number
  rows: CharacterMissionRowView[]
  basicRows: CharacterMissionRowView[]
  achievementRows: CharacterMissionRowView[]
}

/**
 * Go: buildCharacterMissionRows + buildCharacterMissionOverview group split.
 * Returns null when there is no mission masterdata for the character.
 */
export function buildCharacterMissionSummary(
  characterId: number,
  input: {
    missions: readonly CharacterMissionMaster[]
    parameterGroups: readonly CharacterMissionParameterGroupRow[]
    characterLevels: readonly CharacterLevelRow[]
    userCharacters: unknown
    userCharacterMissionV2s: unknown
    userCharacterMissionV2Statuses: unknown
  },
): CharacterMissionSummary | null {
  const missions = input.missions
    .filter((mission) => mission.characterId === characterId)
    .sort((a, b) => a.id - b.id)
  if (missions.length === 0) {
    return null
  }

  const groupsByGroupId = new Map<number, CharacterMissionParameterGroupRow[]>()
  for (const row of input.parameterGroups) {
    const rows = groupsByGroupId.get(row.groupId) ?? []
    rows.push(row)
    groupsByGroupId.set(row.groupId, rows)
  }
  for (const rows of groupsByGroupId.values()) {
    rows.sort((a, b) => a.seq - b.seq)
  }
  const groupsFor = (parameterGroupId: number): CharacterMissionParameterGroupRow[] =>
    groupsByGroupId.get(parameterGroupId) ?? []

  const userCharacter = normalizeCatalogRecords(input.userCharacters)
    .find((record) => normalizeCatalogNumber(record.characterId) === characterId)
  let currentLevel = 0
  let currentExp = 0
  let currentTotalExp = 0
  if (userCharacter != null) {
    currentLevel = normalizeCatalogNumber(userCharacter.characterRank) ?? 0
    currentExp = normalizeCatalogNumber(userCharacter.exp) ?? 0
    currentTotalExp = normalizeCatalogNumber(userCharacter.totalExp) ?? 0
  }

  const characterLevels = [...input.characterLevels].sort((a, b) => a.level - b.level)
  const levelTotalExpByLevel = new Map<number, number>()
  for (const row of characterLevels) {
    if (row.level > 0) {
      levelTotalExpByLevel.set(row.level, row.totalExp)
    }
  }
  if (currentLevel > 0 && currentTotalExp > 0) {
    const baseTotalExp = levelTotalExpByLevel.get(currentLevel)
    if (baseTotalExp != null && currentTotalExp >= baseTotalExp) {
      currentExp = currentTotalExp - baseTotalExp
    }
  }

  const statuses = normalizeUserCharacterMissionStatuses(input.userCharacterMissionV2Statuses)
    .filter((row) => row.characterId === characterId)
  let pendingExp = 0
  for (const status of statuses) {
    if (status.missionStatus.trim().toLowerCase() === "achieved") {
      pendingExp += characterMissionGroupExp(groupsFor(status.parameterGroupId), status.seq)
    }
  }

  let finalLevel = currentLevel
  let finalExp = currentExp + pendingExp
  let baseTotalExp = currentTotalExp
  if (baseTotalExp <= 0 && currentLevel > 0) {
    const levelStart = levelTotalExpByLevel.get(currentLevel)
    if (levelStart != null) {
      baseTotalExp = levelStart + currentExp
    }
  }
  if (characterLevels.length > 0) {
    const finalTotalExp = Math.max(baseTotalExp, 0) + pendingExp
    finalLevel = 1
    let levelStart = 0
    for (const row of characterLevels) {
      if (row.level <= 0) {
        continue
      }
      if (row.totalExp <= finalTotalExp) {
        finalLevel = row.level
        levelStart = row.totalExp
        continue
      }
      break
    }
    finalExp = finalTotalExp - levelStart
  }

  const userByTypeProgress = new Map<string, number>()
  for (const row of normalizeUserCharacterMissions(input.userCharacterMissionV2s)) {
    if (row.characterId !== characterId) {
      continue
    }
    userByTypeProgress.set(
      row.characterMissionType,
      Math.max(userByTypeProgress.get(row.characterMissionType) ?? 0, row.progress),
    )
  }

  const statusSeqByMissionId = new Map<number, number>()
  const statusSeqByGroupId = new Map<number, number>()
  for (const status of statuses) {
    statusSeqByMissionId.set(status.missionId, Math.max(statusSeqByMissionId.get(status.missionId) ?? 0, status.seq))
    statusSeqByGroupId.set(
      status.parameterGroupId,
      Math.max(statusSeqByGroupId.get(status.parameterGroupId) ?? 0, status.seq),
    )
  }

  const rows: CharacterMissionRowView[] = []
  for (const mission of missions) {
    const groups = groupsFor(mission.parameterGroupId)
    const isEx = CHARACTER_MISSION_EX_TYPES.has(mission.characterMissionType)

    let current = userByTypeProgress.get(mission.characterMissionType) ?? 0
    const receivedSeq = Math.max(
      statusSeqByMissionId.get(mission.id) ?? 0,
      statusSeqByGroupId.get(mission.parameterGroupId) ?? 0,
    )
    if (isEx) {
      const clearedTotal = characterMissionClearedTotal(groups, receivedSeq)
      if (current > 0) {
        if (current < clearedTotal) {
          current = clearedTotal + current
        }
      } else {
        current = clearedTotal
      }
    } else if (current <= 0 && receivedSeq > 0) {
      current = characterMissionRequirementBySeq(groups, receivedSeq)
    }

    const upper = characterMissionUpper(groups, isEx)
    let ratio = 0
    if (upper != null && upper > 0) {
      ratio = current > upper ? 1 : current / upper
    }

    const [nextNeed, nextExp] = characterMissionNextTarget(groups, current, isEx)
    let currentRound = 0
    let currentRoundProgress = 0
    let currentRoundNeed = 0
    if (isEx) {
      [currentRound, currentRoundProgress, currentRoundNeed] = characterMissionCurrentRound(groups, current)
    }

    rows.push({
      missionId: mission.id,
      missionType: mission.characterMissionType,
      isAchievement: mission.isAchievementMission,
      isEx,
      current,
      upper,
      ratio,
      nextNeed,
      nextExp,
      currentRound: currentRound > 0 ? currentRound : null,
      currentRoundProgress: currentRoundProgress > 0 ? currentRoundProgress : null,
      currentRoundNeed: currentRoundNeed > 0 ? currentRoundNeed : null,
    })
  }

  const byType = new Map<string, CharacterMissionRowView>()
  for (const row of rows) {
    byType.set(row.missionType, row)
  }

  const pickRows = (types: readonly string[]): CharacterMissionRowView[] => {
    const picked: CharacterMissionRowView[] = []
    for (const missionType of types) {
      const row = byType.get(missionType)
      if (row != null) {
        picked.push(row)
      }
    }
    return picked
  }

  return {
    characterId,
    currentLevel,
    currentExp,
    pendingExp,
    finalLevel,
    finalExp,
    rows,
    basicRows: pickRows(CHARACTER_MISSION_BASIC_TYPES),
    achievementRows: pickRows(CHARACTER_MISSION_ACHIEVEMENT_TYPES),
  }
}
