import { describe, expect, it } from "bun:test"
import { createDefaultCardTrainingConfig } from "./training-config"

describe("deck recommend training config", () => {
  it("defaults low rarities to max master rank and max skill", () => {
    const config = createDefaultCardTrainingConfig()
    const lowRarities = config.filter((row) => ["rarity_1", "rarity_2", "rarity_3"].includes(row.rarity))

    expect(lowRarities.every((row) => row.maxLevel && row.episodesRead)).toBe(true)
    expect(lowRarities.every((row) => row.maxMasterRank && row.maxSkillLevel)).toBe(true)
  })

  it("does not default four-star or birthday cards to max master rank and max skill", () => {
    const config = createDefaultCardTrainingConfig()
    const highRarities = config.filter((row) => ["rarity_4", "rarity_birthday"].includes(row.rarity))

    expect(highRarities.every((row) => row.maxLevel && row.episodesRead)).toBe(true)
    expect(highRarities.every((row) => !row.maxMasterRank && !row.maxSkillLevel)).toBe(true)
  })

  it("defaults MySekai canvas bonus to enabled for every rarity", () => {
    const config = createDefaultCardTrainingConfig()

    expect(config.every((row) => row.mySekaiCanvas)).toBe(true)
  })
})
