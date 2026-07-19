import { describe, expect, it } from "bun:test"
import {
  bondLevelProgressPercent,
  buildBondCharacterStyleMap,
  buildBondEntries,
  normalizeBondLevelTable,
  normalizeBondMasters,
  normalizeUserBonds,
  resolveBondBaseCharacterId,
} from "./bonds"
import { normalizeUserCharacterRanks } from "./power-bonus"

const levelTable = normalizeBondLevelTable([
  { levelType: "bonds", level: 1, totalExp: 0 },
  { levelType: "bonds", level: 2, totalExp: 100 },
  { levelType: "bonds", level: 3, totalExp: 300 },
  { levelType: "bonds", level: 4, totalExp: 700 },
  // Other level types must be ignored.
  { levelType: "character", level: 99, totalExp: 999_999 },
])

const styleMap = buildBondCharacterStyleMap([
  { id: 1, gameCharacterId: 1, colorCode: "#33aaee", unit: "light_sound" },
  { id: 2, gameCharacterId: 2, colorCode: "#95c22b", unit: "light_sound" },
  { id: 21, gameCharacterId: 21, colorCode: "#33ccba", unit: "piapro" },
  // VS style ids beyond 26 map back to base character 21.
  { id: 27, gameCharacterId: 21, colorCode: "#4455dd", unit: "light_sound" },
  { id: 28, gameCharacterId: 21, colorCode: "#88dd44", unit: "idol" },
])

const bondMasters = normalizeBondMasters([
  { groupId: 10102, characterId1: 1, characterId2: 2 },
  { groupId: 10121, characterId1: 1, characterId2: 21 },
  { groupId: 10127, characterId1: 1, characterId2: 27 },
  { groupId: 10128, characterId1: 1, characterId2: 28 },
  { groupId: 20221, characterId1: 2, characterId2: 21 },
  // Malformed rows are dropped.
  { groupId: 0, characterId1: 1, characterId2: 2 },
])

const userCharacters = normalizeUserCharacterRanks([
  { characterId: 1, characterRank: 47 },
  { characterId: 2, characterRank: 30 },
  { characterId: 21, characterRank: 12 },
])

describe("normalizeBondLevelTable", () => {
  it("keeps only bonds rows and tracks the max level", () => {
    expect(levelTable.maxLevel).toBe(4)
    expect(levelTable.totalExpByLevel.get(2)).toBe(100)
    expect(levelTable.totalExpByLevel.has(99)).toBe(false)
  })
})

describe("resolveBondBaseCharacterId", () => {
  it("collapses style ids to base characters and falls back to the raw id", () => {
    expect(resolveBondBaseCharacterId(27, styleMap)).toBe(21)
    expect(resolveBondBaseCharacterId(1, styleMap)).toBe(1)
    expect(resolveBondBaseCharacterId(999, styleMap)).toBe(999)
  })
})

describe("buildBondEntries (default mode)", () => {
  it("shows all owned pairs with need-exp clamped at zero", () => {
    const { entries, maxLevel } = buildBondEntries({
      userBonds: normalizeUserBonds([
        { bondsGroupId: 10102, rank: 2, exp: 150 },
        { bondsGroupId: 10121, rank: 3, exp: 100 },
        // Unknown group ids are skipped.
        { bondsGroupId: 99999, rank: 9, exp: 0 },
      ]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
    })

    expect(maxLevel).toBe(4)
    expect(entries).toHaveLength(2)

    // rank 3 sorts before rank 2.
    expect(entries[0]?.groupId).toBe(10121)
    expect(entries[0]?.bondLevel).toBe(3)
    // Level 3→4 spans 400 exp; 100 earned leaves 300.
    expect(entries[0]?.levelExpSpan).toBe(400)
    expect(entries[0]?.needExp).toBe(300)
    expect(entries[0]?.charaRank1).toBe(47)
    expect(entries[0]?.charaRank2).toBe(12)

    // Level 2→3 spans 200 exp; 150 earned leaves 50.
    expect(entries[1]?.needExp).toBe(50)
    expect(entries[1]?.hasBond).toBe(true)
  })

  it("clamps need exp at zero when earned exp exceeds the span", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([{ bondsGroupId: 10102, rank: 2, exp: 999 }]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
    })
    expect(entries[0]?.needExp).toBe(0)
  })

  it("has no need exp at max level or rank zero", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([
        { bondsGroupId: 10102, rank: 4, exp: 0 },
        { bondsGroupId: 10121, rank: 0, exp: 0 },
      ]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
    })
    expect(entries[0]?.bondLevel).toBe(4)
    expect(entries[0]?.needExp).toBeNull()
    expect(entries[0]?.levelExpSpan).toBeNull()
    expect(entries[1]?.needExp).toBeNull()
  })

  it("sorts by bond level desc, then charId1 asc, then charId2 asc", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([
        { bondsGroupId: 20221, rank: 2, exp: 0 },
        { bondsGroupId: 10121, rank: 2, exp: 0 },
        { bondsGroupId: 10102, rank: 2, exp: 0 },
      ]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
    })
    expect(entries.map((entry) => entry.groupId)).toEqual([10102, 10121, 20221])
  })
})

describe("buildBondEntries (character filter mode)", () => {
  it("orients the filtered character to the left and includes unowned pairs", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([{ bondsGroupId: 20221, rank: 3, exp: 0 }]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
      filterCharacterId: 21,
    })

    // Partners of 21 (after style collapse): 1 (from 10121/10127/10128) and 2.
    expect(entries).toHaveLength(2)
    for (const entry of entries) {
      expect(entry.baseCharaId1).toBe(21)
    }

    // Owned bond (with char 2, level 3) sorts first.
    expect(entries[0]?.baseCharaId2).toBe(2)
    expect(entries[0]?.hasBond).toBe(true)
    expect(entries[0]?.bondLevel).toBe(3)

    // Unowned pair with char 1 remains listed with no bond.
    expect(entries[1]?.baseCharaId2).toBe(1)
    expect(entries[1]?.hasBond).toBe(false)
    expect(entries[1]?.bondLevel).toBe(0)
  })

  it("dedups partners by base character keeping the highest bond", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([
        { bondsGroupId: 10121, rank: 2, exp: 0 },
        { bondsGroupId: 10127, rank: 5, exp: 0 },
        { bondsGroupId: 10128, rank: 1, exp: 0 },
      ]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
      filterCharacterId: 1,
    })

    // Groups 10121/10127/10128 all display partner 21; only the level-5
    // style pair (group 10127, raw id 27) survives. Partner 2 stays.
    const partner21 = entries.filter((entry) => entry.baseCharaId2 === 21)
    expect(partner21).toHaveLength(1)
    expect(partner21[0]?.charaId2).toBe(27)
    expect(partner21[0]?.bondLevel).toBe(5)
    expect(entries.some((entry) => entry.baseCharaId2 === 2)).toBe(true)
  })

  it("prefers the lower style id when bond levels tie", () => {
    const { entries } = buildBondEntries({
      userBonds: normalizeUserBonds([
        { bondsGroupId: 10127, rank: 2, exp: 0 },
        { bondsGroupId: 10128, rank: 2, exp: 0 },
      ]),
      bondMasters,
      levelTable,
      styleMap,
      userCharacters,
      filterCharacterId: 1,
    })
    const partner21 = entries.filter((entry) => entry.baseCharaId2 === 21)
    expect(partner21).toHaveLength(1)
    // Group 10121 (raw 21) is unowned; owned styles 27/28 tie at level 2 and
    // the lower raw id 27 wins.
    expect(partner21[0]?.charaId2).toBe(27)
  })
})

describe("bondLevelProgressPercent", () => {
  it("computes progress within the current level", () => {
    expect(bondLevelProgressPercent({
      groupId: 1,
      charaId1: 1,
      charaId2: 2,
      baseCharaId1: 1,
      baseCharaId2: 2,
      colorCode1: null,
      colorCode2: null,
      charaRank1: 0,
      charaRank2: 0,
      bondLevel: 2,
      exp: 150,
      hasBond: true,
      needExp: 50,
      levelExpSpan: 200,
    })).toBe(75)
  })

  it("returns null without a level span", () => {
    expect(bondLevelProgressPercent({
      groupId: 1,
      charaId1: 1,
      charaId2: 2,
      baseCharaId1: 1,
      baseCharaId2: 2,
      colorCode1: null,
      colorCode2: null,
      charaRank1: 0,
      charaRank2: 0,
      bondLevel: 4,
      exp: 0,
      hasBond: true,
      needExp: null,
      levelExpSpan: null,
    })).toBeNull()
  })
})
