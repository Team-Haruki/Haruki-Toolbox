import { describe, expect, it } from "bun:test"
import { createDefaultPlannerDeckConfig, readPlannerDeckConfig } from "./planner-config"

function storageWith(value: unknown): Pick<Storage, "getItem"> {
  return { getItem: () => JSON.stringify(value) }
}

describe("readPlannerDeckConfig", () => {
  it("returns defaults for missing/invalid storage", () => {
    expect(readPlannerDeckConfig(null)).toEqual(createDefaultPlannerDeckConfig())
    expect(readPlannerDeckConfig({ getItem: () => null })).toEqual(createDefaultPlannerDeckConfig())
    expect(readPlannerDeckConfig(storageWith({ version: 99, config: {} })))
      .toEqual(createDefaultPlannerDeckConfig())
  })

  it("maps saved deck-page settings onto planner runner inputs", () => {
    const config = readPlannerDeckConfig(storageWith({
      version: 1,
      config: {
        multiLiveTeammatePowerInput: "250000",
        characterRankInput: "80",
        characterRankOverrideInputs: { "1": "100", "2": "", "x": "50" },
        areaItemLevelOverrideInputs: { "7": "15" },
        fixedCardIds: [10, 20],
        excludedCardIds: [30],
        skillOrderStrategy: "max",
        specificSkillOrderInput: "1, 2 3",
        supportMasterMax: true,
        selectedMusicId: "104",
        selectedDifficulty: "expert",
      },
    }))
    expect(config.multiLiveTeammatePower).toBe(250000)
    expect(config.characterRank).toBe(80)
    expect(config.characterRankOverrides).toEqual([{ characterId: 1, rank: 100 }])
    expect(config.areaItemLevelOverrides).toEqual([{ areaItemId: 7, level: 15 }])
    expect(config.fixedCards).toEqual([10, 20])
    expect(config.excludedCards).toEqual([30])
    expect(config.skillOrderStrategy).toBe("max")
    expect(config.specificSkillOrder).toEqual([1, 2, 3])
    expect(config.supportMasterMax).toBe(true)
    expect(config.referenceMusicId).toBe("104")
    expect(config.referenceDifficulty).toBe("expert")
  })
})
