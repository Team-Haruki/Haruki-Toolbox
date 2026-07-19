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

/** Go: BuildLeaderCountRequestFromSnapshot core math. */
export function buildLeaderCounts(input: {
  userCharacterMissionV2s: unknown
  userCharacterLiveUsageCounts: unknown
  userCharacterMissionV2Statuses: unknown
  parameterGroups: readonly CharacterMissionParameterGroupRow[]
}): LeaderCountResult {
  const { requirements, maxPlayLimit } = extractLeaderMissionRequirements(input.parameterGroups)

  const playCountByCharacter = new Map<number, number>()
  const exCountByCharacter = new Map<number, number>()
  const exLevelByCharacter = new Map<number, number>()
  const hasPlayLiveExByCharacter = new Set<number>()
  let hasPlayLiveMission = false

  for (const record of normalizeCatalogRecords(input.userCharacterMissionV2s)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null || characterId <= 0) {
      continue
    }

    const progress = normalizeCatalogNumber(record.progress) ?? 0
    switch (normalizeCatalogString(record.characterMissionType).toLowerCase()) {
      case "play_live":
        playCountByCharacter.set(characterId, progress)
        hasPlayLiveMission = true
        break
      case "play_live_ex":
        exCountByCharacter.set(characterId, progress)
        hasPlayLiveExByCharacter.add(characterId)
        break
    }
  }

  if (!hasPlayLiveMission) {
    for (const record of normalizeCatalogRecords(input.userCharacterLiveUsageCounts)) {
      const characterId = normalizeCatalogNumber(record.characterId)
      if (characterId == null || characterId <= 0) {
        continue
      }
      if (normalizeCatalogString(record.characterLiveUsageType).toLowerCase() !== "leader") {
        continue
      }
      playCountByCharacter.set(characterId, normalizeCatalogNumber(record.usageCount) ?? 0)
    }
  }

  for (const record of normalizeCatalogRecords(input.userCharacterMissionV2Statuses)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null || characterId <= 0) {
      continue
    }
    if ((normalizeCatalogNumber(record.parameterGroupId) ?? 0) !== LEADER_EX_PARAMETER_GROUP_ID) {
      continue
    }

    const seq = normalizeCatalogNumber(record.seq) ?? 0
    if (seq > (exLevelByCharacter.get(characterId) ?? 0)) {
      exLevelByCharacter.set(characterId, seq)
    }
    exCountByCharacter.set(
      characterId,
      (exCountByCharacter.get(characterId) ?? 0) + leaderMissionRequirementForSeq(requirements, seq),
    )
  }

  for (let characterId = 1; characterId <= LEADER_CHARACTER_COUNT; characterId++) {
    if (hasPlayLiveExByCharacter.has(characterId)) {
      exLevelByCharacter.set(characterId, (exLevelByCharacter.get(characterId) ?? 0) + 1)
    }
  }

  const leaders: LeaderCountEntry[] = []
  for (let characterId = 1; characterId <= LEADER_CHARACTER_COUNT; characterId++) {
    leaders.push({
      characterId,
      playCount: playCountByCharacter.get(characterId) ?? 0,
      exLevel: exLevelByCharacter.get(characterId) ?? 0,
      exCount: exCountByCharacter.get(characterId) ?? 0,
    })
  }
  sortLeaderCounts(leaders, "total")

  let maxPlayCount = maxPlayLimit
  if (maxPlayCount <= 0) {
    for (const leader of leaders) {
      if (leader.playCount > maxPlayCount) {
        maxPlayCount = leader.playCount
      }
    }
  }

  return { leaders, maxPlayCount }
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
