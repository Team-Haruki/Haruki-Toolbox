import { describe, expect, test } from "bun:test"
import { buildEventRarityBonusTable, normalizeEventRarityBonusRates } from "./event-rarity-bonus"

// Shape of the live jp dump (float noise included).
const RAW = [
  { id: 101, cardRarityType: "rarity_1", masterRank: 0, bonusRate: 0 },
  { id: 102, cardRarityType: "rarity_1", masterRank: 1, bonusRate: 0.10000000149011612 },
  { id: 401, cardRarityType: "rarity_4", masterRank: 0, bonusRate: 10 },
  { id: 406, cardRarityType: "rarity_4", masterRank: 5, bonusRate: 25 },
  { id: 501, cardRarityType: "rarity_birthday", masterRank: 0, bonusRate: 5 },
  { id: 999, cardRarityType: "rarity_3", masterRank: 9, bonusRate: 1 },
  { id: 1000, cardRarityType: "", masterRank: 0, bonusRate: 1 },
  { id: 1001, cardRarityType: "rarity_2", bonusRate: 1 },
  "junk",
]

describe("normalizeEventRarityBonusRates", () => {
  test("keeps well-formed rows only", () => {
    const rows = normalizeEventRarityBonusRates(RAW)
    expect(rows).toHaveLength(6)
    expect(rows[1]).toEqual({ cardRarityType: "rarity_1", masterRank: 1, bonusRate: 0.10000000149011612 })
  })

  test("returns an empty array for non-arrays", () => {
    expect(normalizeEventRarityBonusRates(null)).toEqual([])
  })
})

describe("buildEventRarityBonusTable", () => {
  test("pivots rows into rarity × master rank with the strongest rarity first", () => {
    const table = buildEventRarityBonusTable(normalizeEventRarityBonusRates(RAW))
    expect(table.map((row) => row.cardRarityType)).toEqual(["rarity_4", "rarity_1", "rarity_birthday"])
    expect(table[0].rates).toEqual([10, null, null, null, null, 25])
    expect(table[1].rates).toEqual([0, 0.10000000149011612, null, null, null, null])
  })

  test("drops master ranks outside 0..5", () => {
    const table = buildEventRarityBonusTable([{ cardRarityType: "rarity_3", masterRank: 9, bonusRate: 1 }])
    expect(table).toEqual([])
  })
})
