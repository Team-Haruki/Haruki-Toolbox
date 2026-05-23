import { describe, expect, it } from "bun:test"
import { buildMasterCardOptions } from "./card-options"

describe("deck recommend card options", () => {
  it("builds broad card search keywords from card, character, unit, attribute, and rarity data", () => {
    const options = buildMasterCardOptions({
      cards: [
        {
          id: 1001,
          seq: 42,
          characterId: 1,
          cardRarityType: "rarity_4",
          attr: "cool",
          prefix: "独自の視点",
          assetbundleName: "card_1001",
        },
      ],
      cardRarities: [
        { cardRarityType: "rarity_4", maxLevel: 50, trainingMaxLevel: 60, maxSkillLevel: 4 },
      ],
      gameCharacters: [
        {
          id: 1,
          unit: "light_sound",
          firstName: "星乃",
          givenName: "一歌",
          firstNameRuby: "ほしの",
          givenNameRuby: "いちか",
          firstNameEnglish: "HOSHINO",
          givenNameEnglish: "ICHIKA",
        },
      ],
      gameCharacterUnits: [
        { gameCharacterId: 1, colorCode: "#4455dd" },
      ],
      unitProfiles: [
        { unit: "light_sound", unitName: "Leo/need", unitProfileName: "Leo/need", colorCode: "#4455dd" },
      ],
    }, "jp", "china")

    const keywords = options[0]?.keywords ?? []
    expect(keywords).toContain("#1001")
    expect(keywords).toContain("独自の視点")
    expect(keywords).toContain("ほしのいちか")
    expect(keywords).toContain("ICHIKA HOSHINO")
    expect(keywords).toContain("Leo/need")
    expect(keywords).toContain("四星")
    expect(keywords).toContain("蓝")
  })
})
