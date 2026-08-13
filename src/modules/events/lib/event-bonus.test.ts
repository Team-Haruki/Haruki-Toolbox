import { describe, expect, test } from "bun:test"
import {
  aggregateEventDeckBonuses,
  buildCharacterUnitMap,
  buildEventBonusAttrMap,
  formatBonusRate,
  resolveBonusCharacterIconId,
} from "./event-bonus"

// Mirrors the real gameCharacterUnits master shape: sekai members have one
// unit entry; virtual singers (e.g. miku = 21) have one entry per unit.
const GAME_CHARACTER_UNITS = [
  { id: 2, gameCharacterId: 2, unit: "light_sound" },
  { id: 3, gameCharacterId: 3, unit: "light_sound" },
  { id: 9, gameCharacterId: 9, unit: "idol" },
  { id: 14, gameCharacterId: 14, unit: "theme_park" },
  { id: 17, gameCharacterId: 17, unit: "school_refusal" },
  { id: 18, gameCharacterId: 18, unit: "school_refusal" },
  { id: 30, gameCharacterId: 21, unit: "idol" },
  { id: 42, gameCharacterId: 21, unit: "school_refusal" },
  { id: 56, gameCharacterId: 26, unit: "piapro" },
]

describe("buildCharacterUnitMap", () => {
  test("maps unit ids to character and unit", () => {
    const map = buildCharacterUnitMap(GAME_CHARACTER_UNITS)
    expect(map.get(30)).toEqual({ gameCharacterId: 21, unit: "idol" })
    expect(map.get(2)).toEqual({ gameCharacterId: 2, unit: "light_sound" })
  })

  test("ignores malformed records", () => {
    const map = buildCharacterUnitMap([{ id: 1 }, { gameCharacterId: 2 }, "junk", null])
    expect(map.size).toBe(0)
  })
})

describe("aggregateEventDeckBonuses", () => {
  // Real shape of a cheerful carnival event (kr event 30): combo rows at 50%,
  // character-only rows at 20%, one attribute-only row at 20%.
  const CHEERFUL_BONUSES = [
    { id: 320, eventId: 30, gameCharacterUnitId: 2, cardAttr: "pure", bonusRate: 50 },
    { id: 321, eventId: 30, gameCharacterUnitId: 3, cardAttr: "pure", bonusRate: 50 },
    { id: 322, eventId: 30, gameCharacterUnitId: 9, cardAttr: "pure", bonusRate: 50 },
    { id: 323, eventId: 30, gameCharacterUnitId: 14, cardAttr: "pure", bonusRate: 50 },
    { id: 324, eventId: 30, gameCharacterUnitId: 30, cardAttr: "pure", bonusRate: 50 },
    { id: 325, eventId: 30, gameCharacterUnitId: 2, bonusRate: 20 },
    { id: 326, eventId: 30, gameCharacterUnitId: 3, bonusRate: 20 },
    { id: 327, eventId: 30, gameCharacterUnitId: 9, bonusRate: 20 },
    { id: 328, eventId: 30, gameCharacterUnitId: 14, bonusRate: 20 },
    { id: 329, eventId: 30, gameCharacterUnitId: 30, bonusRate: 20 },
    { id: 330, eventId: 30, cardAttr: "pure", bonusRate: 20 },
    // Rows from another event must be ignored.
    { id: 999, eventId: 31, gameCharacterUnitId: 17, cardAttr: "cool", bonusRate: 50 },
  ]

  test("groups rows into combo, character-only, and attribute-only entries", () => {
    const groups = aggregateEventDeckBonuses(30, CHEERFUL_BONUSES, GAME_CHARACTER_UNITS)
    expect(groups).toHaveLength(3)

    const [combo, charOnly, attrOnly] = groups
    expect(combo.cardAttr).toBe("pure")
    expect(combo.bonusRate).toBe(50)
    expect(combo.characters.map((character) => character.gameCharacterId)).toEqual([2, 3, 9, 14, 21])

    expect(charOnly.cardAttr).toBeNull()
    expect(charOnly.bonusRate).toBe(20)
    expect(charOnly.characters.map((character) => character.gameCharacterId)).toEqual([2, 3, 9, 14, 21])

    expect(attrOnly.cardAttr).toBe("pure")
    expect(attrOnly.bonusRate).toBe(20)
    expect(attrOnly.characters).toEqual([])
  })

  test("keeps the specific unit for a virtual singer matched through one unit", () => {
    const groups = aggregateEventDeckBonuses(30, CHEERFUL_BONUSES, GAME_CHARACTER_UNITS)
    const miku = groups[0].characters.find((character) => character.gameCharacterId === 21)
    expect(miku).toEqual({ gameCharacterId: 21, unit: "idol" })
  })

  test("collapses a character matched through several units into unit null", () => {
    const bonuses = [
      { id: 1, eventId: 5, gameCharacterUnitId: 30, bonusRate: 25 },
      { id: 2, eventId: 5, gameCharacterUnitId: 42, bonusRate: 25 },
    ]
    const groups = aggregateEventDeckBonuses(5, bonuses, GAME_CHARACTER_UNITS)
    expect(groups).toHaveLength(1)
    expect(groups[0].characters).toEqual([{ gameCharacterId: 21, unit: null }])
  })

  test("world link events produce a single character-only group", () => {
    const bonuses = [
      { id: 2612, eventId: 170, gameCharacterUnitId: 17, bonusRate: 25 },
      { id: 2613, eventId: 170, gameCharacterUnitId: 18, bonusRate: 25 },
    ]
    const groups = aggregateEventDeckBonuses(170, bonuses, GAME_CHARACTER_UNITS)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual({
      cardAttr: null,
      bonusRate: 25,
      characters: [
        { gameCharacterId: 17, unit: "school_refusal" },
        { gameCharacterId: 18, unit: "school_refusal" },
      ],
    })
  })

  test("separates same-attribute groups with different rates", () => {
    const bonuses = [
      { id: 1, eventId: 7, gameCharacterUnitId: 2, cardAttr: "cool", bonusRate: 50 },
      { id: 2, eventId: 7, gameCharacterUnitId: 3, bonusRate: 25 },
      { id: 3, eventId: 7, cardAttr: "cool", bonusRate: 25 },
    ]
    const groups = aggregateEventDeckBonuses(7, bonuses, GAME_CHARACTER_UNITS)
    expect(groups.map((group) => [group.cardAttr, group.bonusRate, group.characters.length])).toEqual([
      ["cool", 50, 1],
      [null, 25, 1],
      ["cool", 25, 0],
    ])
  })

  test("skips rows whose character unit id is unknown", () => {
    const bonuses = [{ id: 1, eventId: 8, gameCharacterUnitId: 12345, bonusRate: 25 }]
    expect(aggregateEventDeckBonuses(8, bonuses, GAME_CHARACTER_UNITS)).toEqual([])
  })

  test("handles malformed input", () => {
    expect(aggregateEventDeckBonuses(1, null, null)).toEqual([])
    expect(aggregateEventDeckBonuses(1, [{ eventId: 1 }], GAME_CHARACTER_UNITS)).toEqual([])
  })
})

describe("buildEventBonusAttrMap", () => {
  test("collects attributes per event", () => {
    const map = buildEventBonusAttrMap([
      { id: 1, eventId: 1, gameCharacterUnitId: 2, cardAttr: "mysterious", bonusRate: 50 },
      { id: 2, eventId: 1, gameCharacterUnitId: 2, bonusRate: 25 },
      { id: 3, eventId: 2, cardAttr: "pure", bonusRate: 25 },
    ])
    expect(map.get(1)).toEqual(new Set(["mysterious"]))
    expect(map.get(2)).toEqual(new Set(["pure"]))
  })

  test("events without attribute rows are absent", () => {
    const map = buildEventBonusAttrMap([
      { id: 1, eventId: 170, gameCharacterUnitId: 17, bonusRate: 25 },
    ])
    expect(map.has(170)).toBe(false)
  })
})

describe("resolveBonusCharacterIconId", () => {
  test("uses per-unit miku icon variants", () => {
    expect(resolveBonusCharacterIconId({ gameCharacterId: 21, unit: "light_sound" })).toBe(27)
    expect(resolveBonusCharacterIconId({ gameCharacterId: 21, unit: "school_refusal" })).toBe(31)
  })

  test("falls back to the base icon for miku without a specific unit", () => {
    expect(resolveBonusCharacterIconId({ gameCharacterId: 21, unit: null })).toBe(21)
    expect(resolveBonusCharacterIconId({ gameCharacterId: 21, unit: "piapro" })).toBe(21)
  })

  test("other characters keep their own icon id", () => {
    expect(resolveBonusCharacterIconId({ gameCharacterId: 18, unit: "school_refusal" })).toBe(18)
    expect(resolveBonusCharacterIconId({ gameCharacterId: 26, unit: null })).toBe(26)
  })
})

describe("formatBonusRate", () => {
  test("formats whole percentages", () => {
    expect(formatBonusRate(50)).toBe("+50%")
    expect(formatBonusRate(25.0)).toBe("+25%")
  })

  test("keeps one decimal for fractional rates", () => {
    expect(formatBonusRate(12.5)).toBe("+12.5%")
  })
})
