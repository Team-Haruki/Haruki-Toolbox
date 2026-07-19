import { describe, expect, test } from "bun:test"
import type { CharacterMissionParameterGroupRow } from "./character-missions"
import {
  buildLeaderCounts,
  extractLeaderMissionRequirements,
  leaderMissionRequirementForSeq,
  sortLeaderCounts,
} from "./leader-count"

function makeGroupRow(groupId: number, seq: number, requirement: number): CharacterMissionParameterGroupRow {
  return { groupId, seq, requirement, exp: 1 }
}

// Mirrors the sparse group 101 shape from masterdata (seq steps of 3).
const parameterGroups: CharacterMissionParameterGroupRow[] = [
  makeGroupRow(1, 1, 10),
  makeGroupRow(1, 2, 20),
  makeGroupRow(1, 3, 40),
  makeGroupRow(101, 4, 600),
  makeGroupRow(101, 1, 500),
]

describe("extractLeaderMissionRequirements", () => {
  test("collects group 101 rows sorted by seq and the group 1 max requirement", () => {
    const { requirements, maxPlayLimit } = extractLeaderMissionRequirements(parameterGroups)
    expect(requirements).toEqual([
      { seq: 1, requirement: 500 },
      { seq: 4, requirement: 600 },
    ])
    expect(maxPlayLimit).toBe(40)
  })
})

describe("leaderMissionRequirementForSeq", () => {
  const requirements = [
    { seq: 1, requirement: 500 },
    { seq: 4, requirement: 600 },
  ]

  test("walks the last requirement at or below the seq", () => {
    expect(leaderMissionRequirementForSeq(requirements, 1)).toBe(500)
    expect(leaderMissionRequirementForSeq(requirements, 3)).toBe(500)
    expect(leaderMissionRequirementForSeq(requirements, 4)).toBe(600)
    expect(leaderMissionRequirementForSeq(requirements, 9)).toBe(600)
  })

  test("returns 0 for non-positive seq or empty requirements", () => {
    expect(leaderMissionRequirementForSeq(requirements, 0)).toBe(0)
    expect(leaderMissionRequirementForSeq([], 3)).toBe(0)
  })
})

describe("buildLeaderCounts", () => {
  test("uses play_live mission progress when present", () => {
    const { leaders, maxPlayCount } = buildLeaderCounts({
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live", progress: 120 },
      ],
      userCharacterLiveUsageCounts: [
        { characterId: 1, characterLiveUsageType: "leader", usageCount: 999 },
      ],
      userCharacterMissionV2Statuses: [],
      parameterGroups,
    })

    const char1 = leaders.find((leader) => leader.characterId === 1)
    expect(char1?.playCount).toBe(120)
    expect(maxPlayCount).toBe(40)
    expect(leaders).toHaveLength(26)
  })

  test("falls back to leader live usage counts when no play_live mission exists", () => {
    const { leaders } = buildLeaderCounts({
      userCharacterMissionV2s: [],
      userCharacterLiveUsageCounts: [
        { characterId: 1, characterLiveUsageType: "leader", usageCount: 33 },
        { characterId: 1, characterLiveUsageType: "member", usageCount: 77 },
      ],
      userCharacterMissionV2Statuses: [],
      parameterGroups,
    })

    expect(leaders.find((leader) => leader.characterId === 1)?.playCount).toBe(33)
  })

  test("accumulates EX counts from received statuses plus current progress", () => {
    const { leaders } = buildLeaderCounts({
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live_ex", progress: 250 },
      ],
      userCharacterLiveUsageCounts: [],
      userCharacterMissionV2Statuses: [
        { characterId: 1, parameterGroupId: 101, seq: 1, missionId: 1101, missionStatus: "received" },
        { characterId: 1, parameterGroupId: 101, seq: 4, missionId: 1101, missionStatus: "received" },
        // Other parameter groups are ignored for EX accumulation.
        { characterId: 1, parameterGroupId: 1, seq: 9, missionId: 1001, missionStatus: "received" },
      ],
      parameterGroups,
    })

    const char1 = leaders.find((leader) => leader.characterId === 1)
    // 250 (progress) + 500 (seq 1) + 600 (seq 4).
    expect(char1?.exCount).toBe(1350)
    // Max status seq 4, +1 because a play_live_ex mission exists.
    expect(char1?.exLevel).toBe(5)
  })

  test("does not bump the EX level without a play_live_ex mission", () => {
    const { leaders } = buildLeaderCounts({
      userCharacterMissionV2s: [],
      userCharacterLiveUsageCounts: [],
      userCharacterMissionV2Statuses: [
        { characterId: 2, parameterGroupId: 101, seq: 2, missionId: 2101, missionStatus: "received" },
      ],
      parameterGroups,
    })

    const char2 = leaders.find((leader) => leader.characterId === 2)
    expect(char2?.exLevel).toBe(2)
    expect(char2?.exCount).toBe(500)
  })

  test("sorts by playCount + exCount descending with character id as tiebreak", () => {
    const { leaders } = buildLeaderCounts({
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live", progress: 10 },
        { characterId: 3, characterMissionType: "play_live", progress: 10 },
        { characterId: 2, characterMissionType: "play_live", progress: 50 },
      ],
      userCharacterLiveUsageCounts: [],
      userCharacterMissionV2Statuses: [],
      parameterGroups,
    })

    expect(leaders.slice(0, 3).map((leader) => leader.characterId)).toEqual([2, 1, 3])
  })

  test("falls back to the observed max play count without group 1 masterdata", () => {
    const { maxPlayCount } = buildLeaderCounts({
      userCharacterMissionV2s: [
        { characterId: 5, characterMissionType: "play_live", progress: 777 },
      ],
      userCharacterLiveUsageCounts: [],
      userCharacterMissionV2Statuses: [],
      parameterGroups: [makeGroupRow(101, 1, 500)],
    })

    expect(maxPlayCount).toBe(777)
  })
})

describe("sortLeaderCounts", () => {
  test("character mode restores id order", () => {
    const leaders = [
      { characterId: 3, playCount: 5, exLevel: 0, exCount: 0 },
      { characterId: 1, playCount: 1, exLevel: 0, exCount: 0 },
    ]
    expect(sortLeaderCounts(leaders, "character").map((leader) => leader.characterId)).toEqual([1, 3])
    expect(sortLeaderCounts(leaders, "total").map((leader) => leader.characterId)).toEqual([3, 1])
  })
})
