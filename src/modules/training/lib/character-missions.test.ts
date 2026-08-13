import { describe, expect, test } from "bun:test"
import {
  buildCharacterMissionSummary,
  characterMissionClearedTotal,
  characterMissionCurrentRound,
  characterMissionExpForRound,
  characterMissionNextTarget,
  characterMissionRequirementForRound,
  characterMissionUpper,
  extractCharacterLevels,
  normalizeCharacterMissionParameterGroups,
  type CharacterMissionMaster,
  type CharacterMissionParameterGroupRow,
} from "./character-missions"

function makeRow(
  groupId: number,
  seq: number,
  requirement: number,
  exp = 1,
): CharacterMissionParameterGroupRow {
  return { groupId, seq, requirement, exp }
}

// Sparse EX-style steps: rounds 1-3 need 500, 4-6 need 600, 7+ need 700.
const exGroups = [makeRow(101, 1, 500, 1), makeRow(101, 4, 600, 2), makeRow(101, 7, 700, 3)]

describe("normalizeCharacterMissionParameterGroups", () => {
  test("reads the group identifier from id and falls back to gameId", () => {
    const rows = normalizeCharacterMissionParameterGroups([
      { id: 1, seq: 1, requirement: 10, exp: 1, quantity: 0 },
      { gameId: 2, seq: 1, requirement: 5, exp: 1, quantity: 0 },
      { seq: 1, requirement: 5, exp: 1 },
    ])

    expect(rows.map((row) => row.groupId)).toEqual([1, 2])
  })
})

describe("extractCharacterLevels", () => {
  test("keeps only character rows sorted by level", () => {
    const rows = extractCharacterLevels([
      { levelType: "character", level: 3, totalExp: 30 },
      { levelType: "bonds", level: 1, totalExp: 0 },
      { levelType: "character", level: 1, totalExp: 0 },
    ])

    expect(rows).toEqual([
      { level: 1, totalExp: 0 },
      { level: 3, totalExp: 30 },
    ])
  })
})

describe("EX round math", () => {
  test("requirement and exp for a round use the last step at or below it", () => {
    expect(characterMissionRequirementForRound(exGroups, 1)).toBe(500)
    expect(characterMissionRequirementForRound(exGroups, 3)).toBe(500)
    expect(characterMissionRequirementForRound(exGroups, 4)).toBe(600)
    expect(characterMissionRequirementForRound(exGroups, 30)).toBe(700)
    expect(characterMissionRequirementForRound(exGroups, 0)).toBe(0)
    expect(characterMissionExpForRound(exGroups, 5)).toBe(2)
  })

  test("upper for EX types is the sum of rounds 1..30", () => {
    // 3*500 + 3*600 + 24*700
    expect(characterMissionUpper(exGroups, true)).toBe(20100)
  })

  test("upper for regular types is the max requirement", () => {
    expect(characterMissionUpper([makeRow(1, 1, 10), makeRow(1, 2, 40)], false)).toBe(40)
    expect(characterMissionUpper([], false)).toBeNull()
  })

  test("cleared total sums round requirements up to the received seq", () => {
    expect(characterMissionClearedTotal(exGroups, 2)).toBe(1000)
    expect(characterMissionClearedTotal(exGroups, 4)).toBe(2100)
    expect(characterMissionClearedTotal(exGroups, 0)).toBe(0)
  })

  test("current round walks totals through round requirements", () => {
    // 1600 = 500 + 500 + 500 + 100 -> round 4 with 100/600.
    expect(characterMissionCurrentRound(exGroups, 1600)).toEqual([4, 100, 600])
    expect(characterMissionCurrentRound(exGroups, 0)).toEqual([1, 0, 500])
    // No masterdata -> requirement 0 stops immediately.
    expect(characterMissionCurrentRound([], 50)).toEqual([1, 50, 0])
  })

  test("next target for EX aims at the end of the current round", () => {
    expect(characterMissionNextTarget(exGroups, 1600, true)).toEqual([2100, 2])
    expect(characterMissionNextTarget([], 10, true)).toEqual([null, null])
  })

  test("next target for regular types is the first step above current", () => {
    const groups = [makeRow(1, 1, 10, 1), makeRow(1, 2, 20, 2)]
    expect(characterMissionNextTarget(groups, 10, false)).toEqual([20, 2])
    expect(characterMissionNextTarget(groups, 20, false)).toEqual([null, null])
  })
})

describe("buildCharacterMissionSummary", () => {
  const missions: CharacterMissionMaster[] = [
    { id: 1001, characterId: 1, characterMissionType: "play_live", parameterGroupId: 1, isAchievementMission: true },
    { id: 1002, characterId: 1, characterMissionType: "collect_member", parameterGroupId: 2, isAchievementMission: false },
    { id: 1003, characterId: 1, characterMissionType: "collect_stamp", parameterGroupId: 3, isAchievementMission: false },
    { id: 1101, characterId: 1, characterMissionType: "play_live_ex", parameterGroupId: 101, isAchievementMission: true },
    { id: 2001, characterId: 2, characterMissionType: "play_live", parameterGroupId: 1, isAchievementMission: true },
  ]
  const parameterGroups = [
    makeRow(1, 1, 10, 1),
    makeRow(1, 2, 20, 1),
    makeRow(2, 1, 5, 2),
    makeRow(3, 1, 3, 2),
    makeRow(3, 2, 6, 5),
    ...exGroups,
  ]
  const characterLevels = [
    { level: 1, totalExp: 0 },
    { level: 2, totalExp: 10 },
    { level: 3, totalExp: 30 },
    { level: 4, totalExp: 60 },
  ]

  test("returns null when the character has no mission masterdata", () => {
    const summary = buildCharacterMissionSummary(9, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [],
      userCharacterMissionV2Statuses: [],
    })
    expect(summary).toBeNull()
  })

  test("derives the in-level exp and projects the final level from pending exp", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [{ characterId: 1, characterRank: 2, totalExp: 15 }],
      userCharacterMissionV2s: [],
      userCharacterMissionV2Statuses: [
        { characterId: 1, missionId: 1003, parameterGroupId: 3, seq: 2, missionStatus: "achieved" },
        { characterId: 1, missionId: 1002, parameterGroupId: 2, seq: 1, missionStatus: "received" },
        // Other characters never contribute.
        { characterId: 2, missionId: 2001, parameterGroupId: 1, seq: 1, missionStatus: "achieved" },
      ],
    })

    expect(summary).not.toBeNull()
    // totalExp 15 - level 2 start (10) = 5 in-level exp.
    expect(summary?.currentLevel).toBe(2)
    expect(summary?.currentExp).toBe(5)
    // Only the achieved status counts: group 3 exp at seq 2 is 5.
    expect(summary?.pendingExp).toBe(5)
    // 15 + 5 = 20 total exp -> still level 2 with 10 in-level exp.
    expect(summary?.finalLevel).toBe(2)
    expect(summary?.finalExp).toBe(10)
  })

  test("projection can cross level boundaries", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [{ characterId: 1, characterRank: 2, totalExp: 28 }],
      userCharacterMissionV2s: [],
      userCharacterMissionV2Statuses: [
        { characterId: 1, missionId: 1003, parameterGroupId: 3, seq: 2, missionStatus: "achieved" },
      ],
    })

    // 28 + 5 = 33 -> level 3 (starts at 30) with 3 in-level exp.
    expect(summary?.finalLevel).toBe(3)
    expect(summary?.finalExp).toBe(3)
  })

  test("EX rows combine cleared rounds with current progress", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live_ex", progress: 100 },
      ],
      userCharacterMissionV2Statuses: [
        { characterId: 1, missionId: 1101, parameterGroupId: 101, seq: 2, missionStatus: "received" },
      ],
    })

    const exRow = summary?.rows.find((row) => row.missionType === "play_live_ex")
    // Cleared rounds 1-2 (1000) + in-round progress 100.
    expect(exRow?.current).toBe(1100)
    expect(exRow?.upper).toBe(20100)
    expect(exRow?.currentRound).toBe(3)
    expect(exRow?.currentRoundProgress).toBe(100)
    expect(exRow?.currentRoundNeed).toBe(500)
    expect(exRow?.ratio).toBeCloseTo(1100 / 20100)
  })

  test("EX progress already above the cleared total is kept as-is", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live_ex", progress: 1200 },
      ],
      userCharacterMissionV2Statuses: [
        { characterId: 1, missionId: 1101, parameterGroupId: 101, seq: 2, missionStatus: "received" },
      ],
    })

    expect(summary?.rows.find((row) => row.missionType === "play_live_ex")?.current).toBe(1200)
  })

  test("regular rows fall back to the received seq requirement without progress", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [],
      userCharacterMissionV2Statuses: [
        { characterId: 1, missionId: 1001, parameterGroupId: 1, seq: 2, missionStatus: "received" },
      ],
    })

    const playRow = summary?.rows.find((row) => row.missionType === "play_live")
    expect(playRow?.current).toBe(20)
    expect(playRow?.upper).toBe(20)
    expect(playRow?.ratio).toBe(1)
    expect(playRow?.currentRound).toBeNull()
  })

  test("ratio caps at 1 when progress exceeds the upper bound", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [
        { characterId: 1, characterMissionType: "play_live", progress: 999 },
      ],
      userCharacterMissionV2Statuses: [],
    })

    expect(summary?.rows.find((row) => row.missionType === "play_live")?.ratio).toBe(1)
  })

  test("splits rows into the fixed basic and achievement groups", () => {
    const summary = buildCharacterMissionSummary(1, {
      missions,
      parameterGroups,
      characterLevels,
      userCharacters: [],
      userCharacterMissionV2s: [],
      userCharacterMissionV2Statuses: [],
    })

    // Fixed order: collect_member then collect_stamp for the basic group.
    expect(summary?.basicRows.map((row) => row.missionType)).toEqual(["collect_member", "collect_stamp"])
    expect(summary?.achievementRows.map((row) => row.missionType)).toEqual(["play_live", "play_live_ex"])
    expect(summary?.rows).toHaveLength(4)
  })
})
