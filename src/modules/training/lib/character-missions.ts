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

function normalizePositiveCatalogNumber(value: unknown): number | null {
  const normalized = normalizeCatalogNumber(value)
  return normalized != null && normalized > 0 ? normalized : null
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
    const characterId = normalizePositiveCatalogNumber(record.characterId)
    if (characterId == null) {
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
    return characterMissionExNextTarget(groups, current)
  }

  const next = groups.find((group) => group.requirement > current)
  return next ? [positiveOrNull(next.requirement), positiveOrNull(next.exp)] : [null, null]
}

function positiveOrNull(value: number): number | null {
  return value > 0 ? value : null
}

function characterMissionExNextTarget(
  groups: readonly CharacterMissionParameterGroupRow[],
  current: number,
): [number | null, number | null] {
  const [roundNo, inRoundProgress, roundNeed] = characterMissionCurrentRound(groups, current)
  if (roundNeed <= 0) {
    return [null, null]
  }
  const nextNeed = current + Math.max(roundNeed - inRoundProgress, 0)
  const nextExp = characterMissionExpForRound(groups, roundNo)
  return [positiveOrNull(nextNeed), positiveOrNull(nextExp)]
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

type CharacterMissionSummaryInput = {
  missions: readonly CharacterMissionMaster[]
  parameterGroups: readonly CharacterMissionParameterGroupRow[]
  characterLevels: readonly CharacterLevelRow[]
  userCharacters: unknown
  userCharacterMissionV2s: unknown
  userCharacterMissionV2Statuses: unknown
}

type CharacterProgress = {
  currentLevel: number
  currentExp: number
  currentTotalExp: number
}

function groupCharacterMissionParameters(
  rows: readonly CharacterMissionParameterGroupRow[],
): Map<number, CharacterMissionParameterGroupRow[]> {
  const grouped = new Map<number, CharacterMissionParameterGroupRow[]>()
  for (const row of rows) {
    const group = grouped.get(row.groupId) ?? []
    group.push(row)
    grouped.set(row.groupId, group)
  }
  for (const group of grouped.values()) {
    group.sort((a, b) => a.seq - b.seq)
  }
  return grouped
}

function readCharacterProgress(characterId: number, rawUserCharacters: unknown): CharacterProgress {
  const record = normalizeCatalogRecords(rawUserCharacters)
    .find((candidate) => normalizeCatalogNumber(candidate.characterId) === characterId)
  return {
    currentLevel: normalizeCatalogNumber(record?.characterRank) ?? 0,
    currentExp: normalizeCatalogNumber(record?.exp) ?? 0,
    currentTotalExp: normalizeCatalogNumber(record?.totalExp) ?? 0,
  }
}

function buildCharacterLevelIndex(characterLevels: readonly CharacterLevelRow[]) {
  const sortedLevels = [...characterLevels].sort((a, b) => a.level - b.level)
  const totalExpByLevel = new Map<number, number>()
  for (const row of sortedLevels) {
    if (row.level > 0) {
      totalExpByLevel.set(row.level, row.totalExp)
    }
  }
  return { sortedLevels, totalExpByLevel }
}

function resolveCurrentLevelExp(
  progress: CharacterProgress,
  totalExpByLevel: ReadonlyMap<number, number>,
): number {
  const { currentLevel, currentExp, currentTotalExp } = progress
  if (currentLevel <= 0 || currentTotalExp <= 0) {
    return currentExp
  }
  const baseTotalExp = totalExpByLevel.get(currentLevel)
  return baseTotalExp != null && currentTotalExp >= baseTotalExp
    ? currentTotalExp - baseTotalExp
    : currentExp
}

function sumPendingCharacterMissionExp(
  statuses: readonly UserCharacterMissionStatusRow[],
  groupsByGroupId: ReadonlyMap<number, readonly CharacterMissionParameterGroupRow[]>,
): number {
  let pendingExp = 0
  for (const status of statuses) {
    if (status.missionStatus.trim().toLowerCase() === "achieved") {
      pendingExp += characterMissionGroupExp(groupsByGroupId.get(status.parameterGroupId) ?? [], status.seq)
    }
  }
  return pendingExp
}

function projectCharacterProgress(
  progress: CharacterProgress,
  currentExp: number,
  pendingExp: number,
  sortedLevels: readonly CharacterLevelRow[],
  totalExpByLevel: ReadonlyMap<number, number>,
): { finalLevel: number; finalExp: number } {
  if (sortedLevels.length === 0) {
    return { finalLevel: progress.currentLevel, finalExp: currentExp + pendingExp }
  }

  let baseTotalExp = progress.currentTotalExp
  if (baseTotalExp <= 0 && progress.currentLevel > 0) {
    const levelStart = totalExpByLevel.get(progress.currentLevel)
    if (levelStart != null) {
      baseTotalExp = levelStart + currentExp
    }
  }

  const finalTotalExp = Math.max(baseTotalExp, 0) + pendingExp
  let finalLevel = 1
  let finalLevelStart = 0
  for (const row of sortedLevels) {
    if (row.level <= 0) {
      continue
    }
    if (row.totalExp > finalTotalExp) {
      break
    }
    finalLevel = row.level
    finalLevelStart = row.totalExp
  }
  return { finalLevel, finalExp: finalTotalExp - finalLevelStart }
}

function buildCharacterMissionProgressByType(
  characterId: number,
  rawUserMissions: unknown,
): Map<string, number> {
  const progressByType = new Map<string, number>()
  for (const row of normalizeUserCharacterMissions(rawUserMissions)) {
    if (row.characterId === characterId) {
      progressByType.set(
        row.characterMissionType,
        Math.max(progressByType.get(row.characterMissionType) ?? 0, row.progress),
      )
    }
  }
  return progressByType
}

function buildCharacterMissionStatusSequences(statuses: readonly UserCharacterMissionStatusRow[]) {
  const byMissionId = new Map<number, number>()
  const byGroupId = new Map<number, number>()
  for (const status of statuses) {
    byMissionId.set(status.missionId, Math.max(byMissionId.get(status.missionId) ?? 0, status.seq))
    byGroupId.set(status.parameterGroupId, Math.max(byGroupId.get(status.parameterGroupId) ?? 0, status.seq))
  }
  return { byMissionId, byGroupId }
}

function resolveCharacterMissionCurrent(
  groups: readonly CharacterMissionParameterGroupRow[],
  current: number,
  receivedSeq: number,
  isEx: boolean,
): number {
  if (!isEx) {
    return current <= 0 && receivedSeq > 0
      ? characterMissionRequirementBySeq(groups, receivedSeq)
      : current
  }
  const clearedTotal = characterMissionClearedTotal(groups, receivedSeq)
  return current > 0 && current < clearedTotal ? clearedTotal + current : Math.max(current, clearedTotal)
}

function buildCharacterMissionRow(
  mission: CharacterMissionMaster,
  groups: readonly CharacterMissionParameterGroupRow[],
  initialCurrent: number,
  receivedSeq: number,
): CharacterMissionRowView {
  const isEx = CHARACTER_MISSION_EX_TYPES.has(mission.characterMissionType)
  const current = resolveCharacterMissionCurrent(groups, initialCurrent, receivedSeq, isEx)
  const upper = characterMissionUpper(groups, isEx)
  const ratio = upper != null && upper > 0 ? Math.min(current / upper, 1) : 0
  const [nextNeed, nextExp] = characterMissionNextTarget(groups, current, isEx)
  const [currentRound, currentRoundProgress, currentRoundNeed] = isEx
    ? characterMissionCurrentRound(groups, current)
    : [0, 0, 0]
  return {
    missionId: mission.id,
    missionType: mission.characterMissionType,
    isAchievement: mission.isAchievementMission,
    isEx,
    current,
    upper,
    ratio,
    nextNeed,
    nextExp,
    currentRound: positiveOrNull(currentRound),
    currentRoundProgress: positiveOrNull(currentRoundProgress),
    currentRoundNeed: positiveOrNull(currentRoundNeed),
  }
}

function pickCharacterMissionRows(
  rows: readonly CharacterMissionRowView[],
  types: readonly string[],
): CharacterMissionRowView[] {
  const byType = new Map(rows.map((row) => [row.missionType, row]))
  return types.flatMap((type) => {
    const row = byType.get(type)
    return row ? [row] : []
  })
}

/**
 * Go: buildCharacterMissionRows + buildCharacterMissionOverview group split.
 * Returns null when there is no mission masterdata for the character.
 */
export function buildCharacterMissionSummary(
  characterId: number,
  input: CharacterMissionSummaryInput,
): CharacterMissionSummary | null {
  const missions = input.missions
    .filter((mission) => mission.characterId === characterId)
    .sort((a, b) => a.id - b.id)
  if (missions.length === 0) {
    return null
  }

  const groupsByGroupId = groupCharacterMissionParameters(input.parameterGroups)
  const progress = readCharacterProgress(characterId, input.userCharacters)
  const { sortedLevels, totalExpByLevel } = buildCharacterLevelIndex(input.characterLevels)
  const currentExp = resolveCurrentLevelExp(progress, totalExpByLevel)

  const statuses = normalizeUserCharacterMissionStatuses(input.userCharacterMissionV2Statuses)
    .filter((row) => row.characterId === characterId)
  const pendingExp = sumPendingCharacterMissionExp(statuses, groupsByGroupId)
  const { finalLevel, finalExp } = projectCharacterProgress(
    progress,
    currentExp,
    pendingExp,
    sortedLevels,
    totalExpByLevel,
  )
  const userByTypeProgress = buildCharacterMissionProgressByType(characterId, input.userCharacterMissionV2s)
  const { byMissionId, byGroupId } = buildCharacterMissionStatusSequences(statuses)

  const rows: CharacterMissionRowView[] = []
  for (const mission of missions) {
    const receivedSeq = Math.max(
      byMissionId.get(mission.id) ?? 0,
      byGroupId.get(mission.parameterGroupId) ?? 0,
    )
    rows.push(buildCharacterMissionRow(
      mission,
      groupsByGroupId.get(mission.parameterGroupId) ?? [],
      userByTypeProgress.get(mission.characterMissionType) ?? 0,
      receivedSeq,
    ))
  }

  return {
    characterId,
    currentLevel: progress.currentLevel,
    currentExp,
    pendingExp,
    finalLevel,
    finalExp,
    rows,
    basicRows: pickCharacterMissionRows(rows, CHARACTER_MISSION_BASIC_TYPES),
    achievementRows: pickCharacterMissionRows(rows, CHARACTER_MISSION_ACHIEVEMENT_TYPES),
  }
}
