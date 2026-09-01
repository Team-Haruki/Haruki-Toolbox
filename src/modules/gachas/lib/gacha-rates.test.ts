import { describe, expect, it } from "bun:test"
import {
  buildGachaRateSegments,
  buildGachaRateTable,
  collectGachaLotteryTypes,
  formatGachaPercent,
  sortGachaRarities,
} from "./gacha-rates"

const cardRarities = new Map<number, string>([
  [1, "rarity_2"],
  [2, "rarity_2"],
  [3, "rarity_3"],
  [4, "rarity_4"],
  [5, "rarity_4"],
])

const normalRates = [
  { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
  { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
  { cardRarityType: "rarity_4", lotteryType: "normal", rate: 3 },
]

const details = [
  { cardId: 1, weight: 1, isWish: false },
  { cardId: 2, weight: 1, isWish: false },
  { cardId: 3, weight: 1, isWish: false },
  { cardId: 4, weight: 1, isWish: true },
  { cardId: 5, weight: 3, isWish: true },
]

describe("collectGachaLotteryTypes", () => {
  it("puts normal first and keeps the others in first-seen order", () => {
    expect(collectGachaLotteryTypes([
      { cardRarityType: "rarity_4", lotteryType: "rate_choice_second", rate: 1.6 },
      { cardRarityType: "rarity_4", lotteryType: "rate_choice_first", rate: 0.8 },
      { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
    ])).toEqual(["normal", "rate_choice_second", "rate_choice_first"])
  })
})

describe("buildGachaRateTable", () => {
  it("builds one column per lottery type present and one row per rarity", () => {
    const table = buildGachaRateTable([
      ...normalRates,
      { cardRarityType: "rarity_4", lotteryType: "categorized_wish", rate: 3.2 },
    ], details, cardRarities)
    expect(table.lotteryTypes).toEqual(["normal", "categorized_wish"])
    expect(table.rows.map((row) => row.rarity)).toEqual(["rarity_4", "rarity_3", "rarity_2"])
    const four = table.rows[0]!
    expect(four.cardCount).toBe(2)
    expect(four.rates.normal).toBeCloseTo(0.03, 10)
    expect(four.rates.categorized_wish).toBeCloseTo(0.032, 10)
    // non-uniform weights: no per-card figure
    expect(four.perCard).toBeNull()
    const two = table.rows[2]!
    expect(two.rates.categorized_wish).toBeNull()
    expect(two.perCard).toBeCloseTo(0.885 / 2, 10)
  })

  it("never synthesizes a guaranteed column", () => {
    const table = buildGachaRateTable(normalRates, details, cardRarities)
    expect(table.lotteryTypes).toEqual(["normal"])
  })

  it("includes rarities that only appear in the pool", () => {
    const table = buildGachaRateTable(normalRates, [{ cardId: 9, weight: 1, isWish: false }], new Map([[9, "rarity_birthday"]]))
    expect(table.rows.map((row) => row.rarity)).toEqual(["rarity_4", "rarity_3", "rarity_birthday", "rarity_2"])
    expect(table.rows[2]?.rates.normal).toBeNull()
  })
})

describe("buildGachaRateSegments", () => {
  it("uses only the normal lottery and normalizes to 1", () => {
    const segments = buildGachaRateSegments([
      ...normalRates,
      { cardRarityType: "rarity_4", lotteryType: "categorized_wish", rate: 50 },
    ])
    expect(segments.map((segment) => segment.rarity)).toEqual(["rarity_4", "rarity_3", "rarity_2"])
    expect(segments.reduce((sum, segment) => sum + segment.fraction, 0)).toBeCloseTo(1, 10)
    expect(segments[0]?.fraction).toBeCloseTo(0.03, 10)
  })

  it("returns nothing without normal rows", () => {
    expect(buildGachaRateSegments([])).toEqual([])
  })
})

describe("helpers", () => {
  it("sorts rarities highest first with birthday between 2 and 3", () => {
    expect(sortGachaRarities(["rarity_2", "rarity_birthday", "rarity_4", "rarity_3", "rarity_2"]))
      .toEqual(["rarity_4", "rarity_3", "rarity_birthday", "rarity_2"])
  })

  it("formats percentages without trailing zeros", () => {
    expect(formatGachaPercent(0.885)).toBe("88.5%")
    expect(formatGachaPercent(0.03)).toBe("3%")
    expect(formatGachaPercent(0.004, 3)).toBe("0.4%")
    expect(formatGachaPercent(null)).toBe("—")
  })
})
