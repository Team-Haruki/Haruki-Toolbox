import { describe, expect, it } from "bun:test"
import {
  buildPowerBonuses,
  collectUserAreaItemLevels,
  formatPowerBonusPercent,
  normalizeAreaItemLevels,
  normalizeAttrName,
  normalizeCharacterRankBonuses,
  normalizeMysekaiGateLevels,
  normalizeUnitName,
  normalizeUserCharacterRanks,
  normalizeUserMysekaiFixtureBonuses,
  normalizeUserMysekaiGates,
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

  it("unit totals equal the area-item bonus when no gates are owned", () => {
    const leoNeed = result.units[0]
    expect(leoNeed?.areaItem).toBe(1.5)
    expect(leoNeed?.total).toBe(1.5)

    const piapro = result.units[5]
    expect(piapro?.areaItem).toBe(3)
    expect(piapro?.total).toBe(3)
  })

  it("adds mysekai gate bonuses to units and the highest-level gate to piapro", () => {
    const withMysekai = buildPowerBonuses({
      userAreaItemLevels: new Map(),
      areaItemLevels: [],
      userCharacters: [],
      characterRanks: [],
      mysekaiGateLevels: normalizeMysekaiGateLevels([
        { mysekaiGateId: 1, level: 5, powerBonusRate: 3 },
        { mysekaiGateId: 2, level: 2, powerBonusRate: 1.5 },
      ]),
      userMysekaiGates: normalizeUserMysekaiGates([
        { mysekaiGateId: 1, mysekaiGateLevel: 5 },
        { mysekaiGateId: 2, mysekaiGateLevel: 2 },
        // No masterdata row for this gate level — must be ignored.
        { mysekaiGateId: 3, mysekaiGateLevel: 4 },
      ]),
    })

    const leoNeed = withMysekai.units[0]
    expect(leoNeed?.gate).toBe(3)
    expect(leoNeed?.total).toBe(3)
    const idol = withMysekai.units[1]
    expect(idol?.gate).toBe(1.5)
    const street = withMysekai.units[2]
    expect(street?.gate).toBe(0)
    // piapro receives the rate at the highest owned gate level.
    const piapro = withMysekai.units[5]
    expect(piapro?.gate).toBe(3)
    expect(piapro?.total).toBe(3)
  })

  it("adds mysekai fixture bonuses (tenths of a percent) to character totals", () => {
    const withFixtures = buildPowerBonuses({
      userAreaItemLevels: new Map(),
      areaItemLevels: [],
      userCharacters: [],
      characterRanks: [],
      userMysekaiFixtureBonuses: normalizeUserMysekaiFixtureBonuses([
        { gameCharacterId: 9, totalBonusRate: 30 },
        // Out-of-roster characters must be ignored.
        { gameCharacterId: 30, totalBonusRate: 10 },
      ]),
    })

    const kohane = withFixtures.characters[8]
    expect(kohane?.fixture).toBeCloseTo(3)
    expect(kohane?.total).toBeCloseTo(3)
    expect(withFixtures.characters[0]?.fixture).toBe(0)
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

  it("preserves both effects at one level without assuming a multi-unit deck", () => {
    const treeLevels = normalizeAreaItemLevels([
      { areaItemId: 56, level: 19, targetUnit: "any", targetCardAttr: "any", power1BonusRate: 9.5 },
      { areaItemId: 56, level: 20, targetUnit: "any", targetCardAttr: "any", power1BonusRate: 10 },
      { areaItemId: 56, level: 20, targetUnit: "multi_unit", targetCardAttr: "any", power1BonusRate: 10 },
    ])
    const input = {
      userAreaItemLevels: new Map([[1, 2], [56, 20]]),
      areaItemLevels: [...areaItemLevels, ...treeLevels],
      userCharacters: [],
      characterRanks: [],
    }
    const actual = buildPowerBonuses(input)
    expect(actual.allCharacterAreaItem).toBe(10)
    expect(actual.multiUnitAreaItem).toBe(10)
    expect(actual.characters[0]?.areaItem).toBe(14)
    expect(actual.characters[0]?.total).toBe(14)
    expect(actual.characters.slice(1).every((row) => row.total === 10)).toBe(true)
    expect(actual.units.every((row) => row.total === 0)).toBe(true)
    expect(actual.attrs.every((row) => row.total === 0)).toBe(true)
    expect(buildPowerBonuses({ ...input, areaItemLevels: [...input.areaItemLevels].reverse() })).toEqual(actual)
  })

  it("does not interpret missing targets or unknown units as an all-character effect", () => {
    const actual = buildPowerBonuses({
      userAreaItemLevels: new Map([[56, 1], [57, 1]]),
      areaItemLevels: normalizeAreaItemLevels([
        { areaItemId: 56, level: 1, power1BonusRate: 10 },
        { areaItemId: 57, level: 1, targetUnit: "unknown_unit", targetCardAttr: "any", power1BonusRate: 10 },
      ]),
      userCharacters: [],
      characterRanks: [],
    })
    expect(actual.allCharacterAreaItem).toBe(0)
    expect(actual.characters.every((row) => row.total === 0)).toBe(true)
  })

  it("reads level 70 and chooses the highest gate level even if another rate is larger", () => {
    const actual = buildPowerBonuses({
      userAreaItemLevels: new Map(), areaItemLevels: [], userCharacters: [], characterRanks: [],
      mysekaiGateLevels: normalizeMysekaiGateLevels([
        { mysekaiGateId: 1, level: 70, powerBonusRate: 7 },
        { mysekaiGateId: 2, level: 40, powerBonusRate: 8 },
      ]),
      userMysekaiGates: normalizeUserMysekaiGates([
        { mysekaiGateId: 2, mysekaiGateLevel: 40 },
        { mysekaiGateId: 1, mysekaiGateLevel: 70 },
        { mysekaiGateId: 6, mysekaiGateLevel: 1 },
      ]),
    })
    expect(actual.units[0]?.gate).toBe(7)
    expect(actual.units[1]?.gate).toBe(8)
    expect(actual.units[5]?.gate).toBe(7)
  })

  it("uses zero when the highest owned gate has no level data", () => {
    const input = {
      userAreaItemLevels: new Map<number, number>(), areaItemLevels: [], userCharacters: [], characterRanks: [],
      mysekaiGateLevels: normalizeMysekaiGateLevels([{ mysekaiGateId: 1, level: 1, powerBonusRate: 1 }]),
      userMysekaiGates: normalizeUserMysekaiGates([
        { mysekaiGateId: 6, mysekaiGateLevel: 2 },
        { mysekaiGateId: 1, mysekaiGateLevel: 1 },
      ]),
    }
    expect(buildPowerBonuses(input).units[5]?.gate).toBe(0)
    // Equal levels retain the first gate, including a shuffle gate with no row.
    input.userMysekaiGates[0]!.mysekaiGateLevel = 1
    expect(buildPowerBonuses(input).units[5]?.gate).toBe(0)
  })
})

describe("formatPowerBonusPercent", () => {
  it("formats with one decimal", () => {
    expect(formatPowerBonusPercent(8.7)).toBe("8.7%")
    expect(formatPowerBonusPercent(0)).toBe("0.0%")
    expect(formatPowerBonusPercent(12.25)).toBe("12.3%")
  })
})
