import { describe, expect, it } from "bun:test"
import {
  buildPowerBonuses,
  collectUserAreaItemLevels,
  formatPowerBonusPercent,
  normalizeAreaItemLevels,
  normalizeAttrName,
  normalizeCharacterRankBonuses,
  normalizeUnitName,
  normalizeUserCharacterRanks,
} from "./power-bonus"

describe("normalizeUnitName", () => {
  it("collapses masterdata unit aliases", () => {
    expect(normalizeUnitName("light_sound_club")).toBe("light_sound")
    expect(normalizeUnitName("more_more_jump")).toBe("idol")
    expect(normalizeUnitName("vivid_bad_squad")).toBe("street")
    expect(normalizeUnitName("wonderlands_x_showtime")).toBe("theme_park")
    expect(normalizeUnitName("25_ji_night_cord_de")).toBe("school_refusal")
  })

  it("returns empty for any/empty and passes through other units", () => {
    expect(normalizeUnitName("any")).toBe("")
    expect(normalizeUnitName("")).toBe("")
    expect(normalizeUnitName(undefined)).toBe("")
    expect(normalizeUnitName(" Piapro ")).toBe("piapro")
    expect(normalizeUnitName("light_sound")).toBe("light_sound")
  })
})

describe("normalizeAttrName", () => {
  it("normalizes case and drops any/empty", () => {
    expect(normalizeAttrName(" Cool ")).toBe("cool")
    expect(normalizeAttrName("any")).toBe("")
    expect(normalizeAttrName("")).toBe("")
    expect(normalizeAttrName(null)).toBe("")
  })
})

describe("collectUserAreaItemLevels", () => {
  it("keeps the max level per area item across areas", () => {
    const levels = collectUserAreaItemLevels([
      { areaId: 5, areaItems: [{ areaItemId: 1, level: 3 }, { areaItemId: 2, level: 6 }] },
      { areaId: 6, areaItems: [{ areaItemId: 1, level: 5 }] },
      { areaId: 7, areaItems: [] },
    ])
    expect(levels.get(1)).toBe(5)
    expect(levels.get(2)).toBe(6)
  })

  it("skips invalid item ids", () => {
    const levels = collectUserAreaItemLevels([
      { areaItems: [{ areaItemId: 0, level: 4 }, { level: 2 }] },
    ])
    expect(levels.size).toBe(0)
  })
})

describe("buildPowerBonuses", () => {
  const areaItemLevels = normalizeAreaItemLevels([
    // Character-targeted item at level 2 (level 1 row must be ignored).
    { areaItemId: 1, level: 1, targetUnit: "any", targetCardAttr: "any", targetGameCharacterId: 1, power1BonusRate: 2 },
    { areaItemId: 1, level: 2, targetUnit: "any", targetCardAttr: "any", targetGameCharacterId: 1, power1BonusRate: 4 },
    // Unit-targeted item without a character target key (alias form).
    { areaItemId: 31, level: 3, targetUnit: "light_sound_club", targetCardAttr: "any", power1BonusRate: 1.5 },
    // Attribute-targeted item.
    { areaItemId: 40, level: 5, targetUnit: "any", targetCardAttr: "cool", power1BonusRate: 2.5 },
    // Piapro-targeted item.
    { areaItemId: 50, level: 1, targetUnit: "piapro", targetCardAttr: "any", power1BonusRate: 3 },
    // VS member (id 21) targeted item.
    { areaItemId: 51, level: 1, targetUnit: "any", targetCardAttr: "any", targetGameCharacterId: 21, power1BonusRate: 1 },
  ])

  const characterRanks = normalizeCharacterRankBonuses([
    { characterId: 1, characterRank: 47, power1BonusRate: 4.7 },
    { characterId: 1, characterRank: 46, power1BonusRate: 4.6 },
    { characterId: 21, characterRank: 10, power1BonusRate: 1 },
  ])

  const userCharacters = normalizeUserCharacterRanks([
    { characterId: 1, characterRank: 47 },
    { characterId: 21, characterRank: 10 },
    // No matching rank row: contributes nothing.
    { characterId: 2, characterRank: 999 },
  ])

  const result = buildPowerBonuses({
    userAreaItemLevels: new Map([
      [1, 2],
      [31, 3],
      [40, 5],
      [50, 1],
      [51, 1],
    ]),
    areaItemLevels,
    userCharacters,
    characterRanks,
  })

  it("always returns 26 characters, 6 units, and 5 attributes in fixed order", () => {
    expect(result.characters).toHaveLength(26)
    expect(result.characters.map((entry) => entry.characterId)).toEqual(
      Array.from({ length: 26 }, (_, index) => index + 1),
    )
    expect(result.units.map((entry) => entry.unit)).toEqual([
      "light_sound",
      "idol",
      "street",
      "theme_park",
      "school_refusal",
      "piapro",
    ])
    expect(result.attrs.map((entry) => entry.attr)).toEqual([
      "cute",
      "cool",
      "pure",
      "happy",
      "mysterious",
    ])
  })

  it("sums character bonuses from area items at the owned level plus rank", () => {
    const first = result.characters[0]
    expect(first?.areaItem).toBe(4)
    expect(first?.rank).toBe(4.7)
    expect(first?.total).toBeCloseTo(8.7)
  })

  it("handles VS characters (21..26) like any other character", () => {
    const miku = result.characters[20]
    expect(miku?.characterId).toBe(21)
    expect(miku?.areaItem).toBe(1)
    expect(miku?.rank).toBe(1)
    expect(miku?.total).toBe(2)
  })

  it("ignores user characters without a matching rank row", () => {
    const second = result.characters[1]
    expect(second?.rank).toBe(0)
    expect(second?.total).toBe(0)
  })

  it("unit totals equal the area-item bonus only (mysekai gate dropped)", () => {
    const leoNeed = result.units[0]
    expect(leoNeed?.areaItem).toBe(1.5)
    expect(leoNeed?.total).toBe(1.5)

    const piapro = result.units[5]
    expect(piapro?.areaItem).toBe(3)
    expect(piapro?.total).toBe(3)
  })

  it("attribute totals equal the area-item bonus", () => {
    const cool = result.attrs[1]
    expect(cool?.areaItem).toBe(2.5)
    expect(cool?.total).toBe(2.5)
    expect(result.attrs[0]?.total).toBe(0)
  })

  it("skips owned items whose level has no masterdata row", () => {
    const sparse = buildPowerBonuses({
      userAreaItemLevels: new Map([[1, 99]]),
      areaItemLevels,
      userCharacters: [],
      characterRanks: [],
    })
    expect(sparse.characters[0]?.total).toBe(0)
  })
})

describe("formatPowerBonusPercent", () => {
  it("formats with one decimal", () => {
    expect(formatPowerBonusPercent(8.7)).toBe("8.7%")
    expect(formatPowerBonusPercent(0)).toBe("0.0%")
    expect(formatPowerBonusPercent(12.25)).toBe("12.3%")
  })
})
