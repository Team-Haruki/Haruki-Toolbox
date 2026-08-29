import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { CharacterMissionParameterGroupRow } from "./character-missions"

/**
 * Leader play-count statistics, ported from Haruki-Cloud
 * internal/pjsk/render/education/snapshot_leader.go.
 */

export const LEADER_CHARACTER_COUNT = 26

/** Parameter group id holding the play_live_ex requirement steps. */
export const LEADER_EX_PARAMETER_GROUP_ID = 101

/** Parameter group id holding the play_live requirement steps. */
export const LEADER_PLAY_PARAMETER_GROUP_ID = 1

export type LeaderMissionRequirement = {
  seq: number
  requirement: number
}

export type LeaderCountEntry = {
  characterId: number
  playCount: number
  exLevel: number
  exCount: number
}

export type LeaderCountResult = {
  leaders: LeaderCountEntry[]
  maxPlayCount: number
  /**
   * EX play count needed to reach the highest EX level (the character badge
   * cap). Displayed EX levels are `completed seqs + 1`, so this is the
   * cumulative requirement through `maxSeq - 1` — e.g. EX Lv.31 ↔ 28,500.
   */
  maxExCount: number
}

export const LEADER_SORT_MODES = ["total", "character"] as const

export type LeaderSortMode = (typeof LEADER_SORT_MODES)[number]

/**
 * Go: localEducationProvider.ensureLeaderMissionRequirements — rows of
 * group 101 become the EX requirement steps (sorted by seq) and group 1
 * yields the max play limit.
 */
export function extractLeaderMissionRequirements(
  parameterGroups: readonly CharacterMissionParameterGroupRow[],
): { requirements: LeaderMissionRequirement[]; maxPlayLimit: number } {
  const requirements: LeaderMissionRequirement[] = []
  let maxPlayLimit = 0
  for (const row of parameterGroups) {
    if (row.groupId === LEADER_PLAY_PARAMETER_GROUP_ID) {
      if (row.requirement > maxPlayLimit) {
        maxPlayLimit = row.requirement
      }
    } else if (row.groupId === LEADER_EX_PARAMETER_GROUP_ID) {
      requirements.push({ seq: row.seq, requirement: row.requirement })
    }
  }

  requirements.sort((a, b) => a.seq - b.seq)
  return { requirements, maxPlayLimit }
}

/** Go: leaderMissionRequirementForSeq — last requirement with seq <= target. */
export function leaderMissionRequirementForSeq(
  requirements: readonly LeaderMissionRequirement[],
  seq: number,
): number {
  if (seq <= 0 || requirements.length === 0) {
    return 0
  }

  let result = 0
  for (const item of requirements) {
    if (item.seq > seq) {
      break
    }
    result = item.requirement
  }

  return result
}

type LeaderProgressMaps = {
  playCountByCharacter: Map<number, number>
  exCountByCharacter: Map<number, number>
  hasPlayLiveExByCharacter: Set<number>
  hasPlayLiveMission: boolean
}

function readLeaderMissionProgress(rawMissions: unknown): LeaderProgressMaps {
  const playCountByCharacter = new Map<number, number>()
  const exCountByCharacter = new Map<number, number>()
  const hasPlayLiveExByCharacter = new Set<number>()
  let hasPlayLiveMission = false
  for (const record of normalizeCatalogRecords(rawMissions)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null || characterId <= 0) {
      continue
    }
    const progress = normalizeCatalogNumber(record.progress) ?? 0
    const type = normalizeCatalogString(record.characterMissionType).toLowerCase()
    if (type === "play_live") {
      playCountByCharacter.set(characterId, progress)
      hasPlayLiveMission = true
    } else if (type === "play_live_ex") {
      exCountByCharacter.set(characterId, progress)
      hasPlayLiveExByCharacter.add(characterId)
    }
  }
  return { playCountByCharacter, exCountByCharacter, hasPlayLiveExByCharacter, hasPlayLiveMission }
}

function readLeaderUsageCounts(rawUsageCounts: unknown): Map<number, number> {
  const map = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawUsageCounts)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    const isLeader = normalizeCatalogString(record.characterLiveUsageType).toLowerCase() === "leader"
    if (characterId != null && characterId > 0 && isLeader) {
      map.set(characterId, normalizeCatalogNumber(record.usageCount) ?? 0)
    }
  }
  return map
}

function applyLeaderMissionStatuses(
  rawStatuses: unknown,
  requirements: readonly LeaderMissionRequirement[],
  exCountByCharacter: Map<number, number>,
): Map<number, number> {
  const exLevelByCharacter = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawStatuses)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    const parameterGroupId = normalizeCatalogNumber(record.parameterGroupId) ?? 0
    if (characterId == null || characterId <= 0 || parameterGroupId !== LEADER_EX_PARAMETER_GROUP_ID) {
      continue
    }
    const seq = normalizeCatalogNumber(record.seq) ?? 0
    exLevelByCharacter.set(characterId, Math.max(exLevelByCharacter.get(characterId) ?? 0, seq))
    exCountByCharacter.set(
      characterId,
      (exCountByCharacter.get(characterId) ?? 0) + leaderMissionRequirementForSeq(requirements, seq),
    )
  }
  return exLevelByCharacter
}

function buildLeaderEntries(
  playCountByCharacter: ReadonlyMap<number, number>,
  exCountByCharacter: ReadonlyMap<number, number>,
  exLevelByCharacter: ReadonlyMap<number, number>,
  hasPlayLiveExByCharacter: ReadonlySet<number>,
): LeaderCountEntry[] {
  const leaders: LeaderCountEntry[] = []
  for (let characterId = 1; characterId <= LEADER_CHARACTER_COUNT; characterId += 1) {
    const level = exLevelByCharacter.get(characterId) ?? 0
    leaders.push({
      characterId,
      playCount: playCountByCharacter.get(characterId) ?? 0,
      exLevel: level + (hasPlayLiveExByCharacter.has(characterId) ? 1 : 0),
      exCount: exCountByCharacter.get(characterId) ?? 0,
    })
  }
  return sortLeaderCounts(leaders, "total")
}

function resolveMaxLeaderPlayCount(leaders: readonly LeaderCountEntry[], maxPlayLimit: number): number {
  return maxPlayLimit > 0
    ? maxPlayLimit
    : leaders.reduce((maximum, leader) => Math.max(maximum, leader.playCount), 0)
}

function sumMaxLeaderExCount(requirements: readonly LeaderMissionRequirement[]): number {
  const maxExSeq = requirements.at(-1)?.seq ?? 0
  let total = 0
  for (let seq = 1; seq < maxExSeq; seq += 1) {
    total += leaderMissionRequirementForSeq(requirements, seq)
  }
  return total
}

/** Go: BuildLeaderCountRequestFromSnapshot core math. */
export function buildLeaderCounts(input: {
  userCharacterMissionV2s: unknown
  userCharacterLiveUsageCounts: unknown
  userCharacterMissionV2Statuses: unknown
  parameterGroups: readonly CharacterMissionParameterGroupRow[]
}): LeaderCountResult {
  const { requirements, maxPlayLimit } = extractLeaderMissionRequirements(input.parameterGroups)
  const progress = readLeaderMissionProgress(input.userCharacterMissionV2s)
  if (!progress.hasPlayLiveMission) {
    progress.playCountByCharacter = readLeaderUsageCounts(input.userCharacterLiveUsageCounts)
  }
  const exLevelByCharacter = applyLeaderMissionStatuses(
    input.userCharacterMissionV2Statuses,
    requirements,
    progress.exCountByCharacter,
  )
  const leaders = buildLeaderEntries(
    progress.playCountByCharacter,
    progress.exCountByCharacter,
    exLevelByCharacter,
    progress.hasPlayLiveExByCharacter,
  )
  return {
    leaders,
    maxPlayCount: resolveMaxLeaderPlayCount(leaders, maxPlayLimit),
    maxExCount: sumMaxLeaderExCount(requirements),
  }
}

/** Default sort: playCount + exCount descending, character id ascending. */
export function sortLeaderCounts(leaders: LeaderCountEntry[], mode: LeaderSortMode): LeaderCountEntry[] {
  if (mode === "character") {
    leaders.sort((a, b) => a.characterId - b.characterId)
    return leaders
  }

  leaders.sort((a, b) => {
    const totalA = a.playCount + a.exCount
    const totalB = b.playCount + b.exCount
    if (totalA === totalB) {
      return a.characterId - b.characterId
    }
    return totalB - totalA
  })
  return leaders
}
