import { describe, expect, it } from "bun:test"
import {
  buildDeckRecommendAreaItemOptions,
  resolveAreaItemAttrIconUrl,
  resolveUnitIconUrl,
} from "./area-item-options"

describe("deck recommend area item options", () => {
  it("groups area items by target kind and resolves max level metadata", () => {
    const options = buildDeckRecommendAreaItemOptions({
      areas: [
        { id: 10, name: "Classroom Sekai", subName: "School" },
        { id: 11, name: "Kamiyama High" },
      ],
      areaItems: [
        { id: 1, areaId: 10, name: "Ichika CD" },
        { id: 2, areaId: 10, name: "Leo/need Poster" },
        { id: 3, areaId: 11, name: "Cool Plant" },
      ],
      areaItemLevels: [
        { areaItemId: 1, level: 1, targetGameCharacterId: 1, targetUnit: "any", targetCardAttr: "any" },
        { areaItemId: 1, level: 20, targetGameCharacterId: 1, targetUnit: "any", targetCardAttr: "any" },
        { areaItemId: 2, level: 1, targetGameCharacterId: null, targetUnit: "light_sound", targetCardAttr: "any" },
        { areaItemId: 2, level: 15, targetGameCharacterId: null, targetUnit: "light_sound", targetCardAttr: "any" },
        { areaItemId: 3, level: 1, targetGameCharacterId: null, targetUnit: "any", targetCardAttr: "cool" },
      ],
      gameCharacters: [
        { id: 1, firstName: "星乃", givenName: "一歌" },
      ],
      unitProfiles: [
        { unit: "light_sound", unitProfileName: "Leo/need" },
      ],
    })

    expect(options.map((option) => ({
      id: option.id,
      kind: option.kind,
      maxLevel: option.maxLevel,
      targetLabel: option.targetLabel,
      areaName: option.areaName,
      areaSubName: option.areaSubName,
    }))).toEqual([
      {
        id: 1,
        kind: "character",
        maxLevel: 20,
        targetLabel: "星乃一歌",
        areaName: "Classroom Sekai",
        areaSubName: "School",
      },
      {
        id: 2,
        kind: "unit",
        maxLevel: 15,
        targetLabel: "Leo/need",
        areaName: "Classroom Sekai",
        areaSubName: "School",
      },
      {
        id: 3,
        kind: "attr",
        maxLevel: 1,
        targetLabel: "cool",
        areaName: "Kamiyama High",
        areaSubName: null,
      },
    ])
  })

  it("uses toolbox static images for unit and attribute icons", () => {
    expect(resolveUnitIconUrl("light_sound")).toBe("https://images.haruki.seiunx.com/sekai-toolbox/static_images/icon_light_sound.png")
    expect(resolveAreaItemAttrIconUrl("cool")).toBe("https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/attr_icon_cool.png")
  })
})
