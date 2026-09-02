import { describe, expect, test } from "bun:test"
import { buildCardsIndex } from "./useCardsIndex"

function makeCardRecord(id: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    characterId: 1,
    cardRarityType: "rarity_4",
    attr: "cool",
    supportUnit: "none",
    prefix: `Card ${id}`,
    assetbundleName: `res001_no${String(id).padStart(3, "0")}`,
    releaseAt: 1_700_000_000_000 + id,
    skillId: id,
    cardSupplyId: 1,
    ...overrides,
  }
}

/** Level 3 is missing for param1, param2 starts at level 2, param3 stops at level 2. */
const cardParameters = [
  { cardLevel: 1, cardParameterType: "param1", power: 100 },
  { cardLevel: "2", cardParameterType: "param1", power: 110 },
  { cardLevel: 4, cardParameterType: "param1", power: 130 },
  { cardLevel: 2, cardParameterType: "param2", power: 210 },
  { cardLevel: 3, cardParameterType: "param2", power: 220 },
  { cardLevel: 4, cardParameterType: "param2", power: 230 },
  { cardLevel: 1, cardParameterType: "param3", power: 50 },
  { cardLevel: 2, cardParameterType: "param3", power: 60 },
  // Ignored rows: level 0, non-numeric power, unknown parameter type, junk.
  { cardLevel: 0, cardParameterType: "param3", power: 999 },
  { cardLevel: 3, cardParameterType: "param3", power: "n/a" },
  { cardLevel: 3, cardParameterType: "param9", power: 1 },
  null,
]

const files: Record<string, unknown> = {
  cards: [
    makeCardRecord(3, {
      characterId: 2,
      gachaPhrase: "-",
      flavorText: " Flavor text ",
      specialTrainingSkillId: 9,
      specialTrainingSkillName: "After training",
      specialTrainingPower1BonusFixed: 100,
      specialTrainingPower2BonusFixed: "200",
      specialTrainingPower3BonusFixed: 300,
      archivePublishedAt: 1_800_000_000_000,
      cardParameters,
    }),
    makeCardRecord(1, {
      gachaPhrase: "Hello!",
      flavorText: "-",
      specialTrainingSkillName: "-",
      cardParameters: [],
    }),
    makeCardRecord(2, { gachaPhrase: "   " }),
    makeCardRecord(4, { characterId: null }),
    { id: "not-a-card" },
    null,
  ],
  cardSupplies: [
    { id: 1, cardSupplyType: "normal" },
    { id: 2, cardSupplyType: "term_limited" },
    { id: "x", cardSupplyType: "ignored" },
    { id: 3 },
  ],
}

describe("buildCardsIndex", () => {
  const index = buildCardsIndex(files)

  test("lists valid cards in id order and indexes them by id", () => {
    expect(index.list.map((card) => card.id)).toEqual([1, 2, 3, 4])
    expect(index.byId.size).toBe(4)
    expect(index.byId.get(3)?.prefix).toBe("Card 3")
    expect(index.byId.get(3)?.characterId).toBe(2)
  })

  test("groups cards by character in id order and skips cards without a character", () => {
    expect(index.byCharacter.size).toBe(2)
    expect(index.byCharacter.get(1)?.map((card) => card.id)).toEqual([1, 2])
    expect(index.byCharacter.get(2)?.map((card) => card.id)).toEqual([3])
  })

  test("maps supply ids to supply types", () => {
    expect(index.supplyTypeMap).toEqual(new Map([
      [1, "normal"],
      [2, "term_limited"],
    ]))
  })

  test("normalizes extras, treating '-' and blank text as null", () => {
    expect(index.extrasById.size).toBe(4)
    expect(index.extrasById.get(3)).toEqual({
      gachaPhrase: null,
      flavorText: "Flavor text",
      specialTrainingSkillId: 9,
      specialTrainingSkillName: "After training",
      specialTrainingPowerBonus: { p1: 100, p2: 200, p3: 300 },
      archivePublishedAt: 1_800_000_000_000,
    })
    expect(index.extrasById.get(1)).toEqual({
      gachaPhrase: "Hello!",
      flavorText: null,
      specialTrainingSkillId: null,
      specialTrainingSkillName: null,
      specialTrainingPowerBonus: { p1: 0, p2: 0, p3: 0 },
      archivePublishedAt: null,
    })
    expect(index.extrasById.get(2)?.gachaPhrase).toBeNull()
    expect(index.extrasById.get(4)?.flavorText).toBeNull()
  })

  test("re-shapes cardParameters into level-indexed tables and fills gaps with the previous value", () => {
    expect(index.powerTables.get(3)).toEqual({
      maxLevel: 4,
      p1: [100, 110, 110, 130],
      p2: [0, 210, 220, 230],
      p3: [50, 60, 60, 60],
    })
  })

  test("omits power tables for cards without usable parameters", () => {
    expect(index.powerTables.size).toBe(1)
    expect(index.powerTables.has(1)).toBe(false)
    expect(index.powerTables.has(2)).toBe(false)
  })

  test("tolerates missing or malformed files", () => {
    for (const input of [{}, { cards: "nope", cardSupplies: 42 }]) {
      const empty = buildCardsIndex(input)
      expect(empty.list).toEqual([])
      expect(empty.byId.size).toBe(0)
      expect(empty.byCharacter.size).toBe(0)
      expect(empty.supplyTypeMap.size).toBe(0)
      expect(empty.extrasById.size).toBe(0)
      expect(empty.powerTables.size).toBe(0)
    }
  })
})
