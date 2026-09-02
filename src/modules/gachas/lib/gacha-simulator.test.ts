import { describe, expect, it } from "bun:test"
import type { CatalogGacha, CatalogGachaBehavior } from "./gacha-catalog"
import {
  addDrawResultsToCounts,
  addSimulatorCost,
  applyGuarantee,
  buildGachaCardRateMap,
  buildGachaSimulatorModel,
  drawBatch,
  drawOnce,
  drawTen,
  mulberry32,
  resolveSimulatorPulls,
  selectDefaultWishCards,
  tallyDrawResults,
  tallyFromCounts,
} from "./gacha-simulator"

function behavior(overrides: Partial<CatalogGachaBehavior>): CatalogGachaBehavior {
  return {
    id: null,
    gachaBehaviorType: "normal",
    costResourceType: "jewel",
    costResourceQuantity: 300,
    spinCount: 1,
    executeLimit: null,
    gachaSpinnableType: "any",
    ...overrides,
  }
}

function makeGacha(overrides: Partial<CatalogGacha> = {}): CatalogGacha {
  return {
    id: 1,
    gachaType: "ceil",
    name: "Test",
    seq: 1,
    assetbundleName: "ab_gacha_1",
    startAt: null,
    endAt: null,
    gachaCeilItemId: null,
    wishSelectCount: 0,
    wishFixedSelectCount: 0,
    wishLimitedSelectCount: 0,
    rarityRates: [
      { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
      { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
      { cardRarityType: "rarity_4", lotteryType: "normal", rate: 3 },
    ],
    pickups: [{ cardId: 40, gachaPickupType: "normal" }],
    details: [
      { cardId: 20, weight: 1, isWish: false },
      { cardId: 21, weight: 1, isWish: false },
      { cardId: 30, weight: 1, isWish: false },
      { cardId: 40, weight: 1, isWish: true },
      { cardId: 41, weight: 1, isWish: true },
    ],
    behaviors: [
      behavior({ gachaBehaviorType: "once_a_day", costResourceType: "paid_jewel", costResourceQuantity: 100, executeLimit: 1, gachaSpinnableType: "colorful_pass" }),
      behavior({ gachaBehaviorType: "over_rarity_3_once", costResourceType: "paid_jewel", costResourceQuantity: 1500, spinCount: 10, executeLimit: 1 }),
      behavior({ gachaBehaviorType: "normal", costResourceType: "gacha_ticket", costResourceQuantity: 1 }),
      behavior({ gachaBehaviorType: "normal", costResourceType: "jewel", costResourceQuantity: 300 }),
      behavior({ gachaBehaviorType: "over_rarity_3_once", costResourceType: "jewel", costResourceQuantity: 3000, spinCount: 10 }),
    ],
    information: { summary: "", description: "" },
    ...overrides,
  }
}

const rarities = new Map<number, string>([
  [20, "rarity_2"],
  [21, "rarity_2"],
  [30, "rarity_3"],
  [40, "rarity_4"],
  [41, "rarity_4"],
])

describe("mulberry32", () => {
  it("is deterministic and stays in [0, 1)", () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const values = Array.from({ length: 50 }, () => a())
    expect(values).toEqual(Array.from({ length: 50 }, () => b()))
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
  })
})

describe("resolveSimulatorPulls", () => {
  it("prefers the repeatable jewel pulls over paid/once-only offers", () => {
    const { single, ten } = resolveSimulatorPulls(makeGacha().behaviors)
    expect(single?.costResourceType).toBe("jewel")
    expect(single?.costResourceQuantity).toBe(300)
    expect(ten?.costResourceType).toBe("jewel")
    expect(ten?.costResourceQuantity).toBe(3000)
    expect(ten?.guaranteeRarity).toBe("rarity_3")
  })

  it("falls back to once-only offers and colorful-pass pulls", () => {
    const gift = resolveSimulatorPulls([
      behavior({ gachaBehaviorType: "over_rarity_4_once", costResourceType: "paid_jewel", costResourceQuantity: 3000, spinCount: 10, executeLimit: 1 }),
    ])
    expect(gift.single).toBeNull()
    expect(gift.ten?.guaranteeRarity).toBe("rarity_4")
    const pass = resolveSimulatorPulls([
      behavior({ gachaBehaviorType: "once_a_week", costResourceType: null, costResourceQuantity: null, executeLimit: 1, gachaSpinnableType: "colorful_pass" }),
    ])
    expect(pass.single?.costResourceType).toBeNull()
    expect(pass.ten).toBeNull()
  })
})

describe("buildGachaSimulatorModel", () => {
  it("builds one bucket per rate row with the rarity's cards", () => {
    const model = buildGachaSimulatorModel(makeGacha(), rarities)
    expect(model.buckets.map((bucket) => `${bucket.lotteryType}:${bucket.rarity}:${bucket.cardIds.length}`))
      .toEqual(["normal:rarity_2:2", "normal:rarity_3:1", "normal:rarity_4:2"])
    expect(model.totalRate).toBeCloseTo(100, 10)
    expect(model.wishCardIds).toEqual([])
  })

  it("splits wished cards into the wish lottery bucket", () => {
    const gacha = makeGacha({
      wishSelectCount: 1,
      rarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 85.5 },
        { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "rarity_4", lotteryType: "categorized_wish", rate: 3.2 },
        { cardRarityType: "rarity_4", lotteryType: "normal", rate: 2.8 },
      ],
    })
    expect(selectDefaultWishCards(gacha)).toEqual([40])
    const model = buildGachaSimulatorModel(gacha, rarities)
    const wish = model.buckets.find((bucket) => bucket.lotteryType === "categorized_wish")
    const normalFour = model.buckets.find((bucket) => bucket.lotteryType === "normal" && bucket.rarity === "rarity_4")
    expect(wish?.cardIds).toEqual([40])
    expect(normalFour?.cardIds).toEqual([41])
    expect(model.totalRate).toBeCloseTo(100, 10)
  })

  it("keeps unclaimed wish picks drawable in the normal lottery", () => {
    const gacha = makeGacha({
      wishSelectCount: 10,
      rarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
        { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "rarity_4", lotteryType: "normal", rate: 0.6 },
        { cardRarityType: "rarity_4", lotteryType: "rate_choice_first", rate: 0.8 },
        { cardRarityType: "rarity_4", lotteryType: "rate_choice_second", rate: 1.6 },
      ],
      pickups: [
        { cardId: 40, gachaPickupType: "normal" },
        { cardId: 41, gachaPickupType: "normal" },
        { cardId: 42, gachaPickupType: "normal" },
      ],
      details: [
        { cardId: 20, weight: 1, isWish: false },
        { cardId: 30, weight: 1, isWish: false },
        { cardId: 40, weight: 1, isWish: true },
        { cardId: 41, weight: 1, isWish: true },
        { cardId: 42, weight: 1, isWish: true },
        { cardId: 43, weight: 1, isWish: false },
      ],
    })
    const rarityMap = new Map([...rarities, [42, "rarity_4"], [43, "rarity_4"]])
    const model = buildGachaSimulatorModel(gacha, rarityMap)
    const byLottery = (lotteryType: string) => model.buckets.find((bucket) => bucket.lotteryType === lotteryType && bucket.rarity === "rarity_4")
    expect(byLottery("rate_choice_first")?.cardIds).toEqual([40])
    expect(byLottery("rate_choice_second")?.cardIds).toEqual([41])
    expect(byLottery("normal")?.cardIds).toEqual([42, 43])
    const drawable = new Set(model.buckets.flatMap((bucket) => bucket.cardIds))
    expect([...drawable].sort((a, b) => a - b)).toEqual([20, 30, 40, 41, 42, 43])
    expect(model.totalRate).toBeCloseTo(100, 10)
  })

  it("skips rarities without cards", () => {
    const model = buildGachaSimulatorModel(makeGacha({ details: [{ cardId: 30, weight: 1, isWish: false }] }), rarities)
    expect(model.buckets.map((bucket) => bucket.rarity)).toEqual(["rarity_3"])
  })
})

describe("applyGuarantee", () => {
  const model = buildGachaSimulatorModel(makeGacha(), rarities)

  it("folds lower rarities into the guaranteed rarity and keeps higher ones", () => {
    const buckets = applyGuarantee(model.buckets, "rarity_3")
    expect(buckets.map((bucket) => bucket.rarity)).toEqual(["rarity_3", "rarity_4"])
    expect(buckets[0]?.rate).toBeCloseTo(97, 10)
    expect(buckets[1]?.rate).toBeCloseTo(3, 10)
  })

  it("puts everything on rarity_4 for a ★4 guarantee", () => {
    const buckets = applyGuarantee(model.buckets, "rarity_4")
    expect(buckets.map((bucket) => bucket.rarity)).toEqual(["rarity_4"])
    expect(buckets[0]?.rate).toBeCloseTo(100, 10)
  })

  it("counts birthday members as ★3 and leaves buckets untouched without a guarantee", () => {
    const birthday = buildGachaSimulatorModel(makeGacha({
      rarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
        { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "rarity_birthday", lotteryType: "normal", rate: 3 },
      ],
      details: [
        { cardId: 20, weight: 1, isWish: false },
        { cardId: 30, weight: 1, isWish: false },
        { cardId: 50, weight: 1, isWish: false },
      ],
    }), new Map([...rarities, [50, "rarity_birthday"]]))
    const buckets = applyGuarantee(birthday.buckets, "rarity_3")
    expect(buckets.map((bucket) => `${bucket.rarity}:${bucket.rate}`)).toEqual(["rarity_3:97", "rarity_birthday:3"])
    expect(applyGuarantee(model.buckets, null)).toEqual(model.buckets)
  })
})

describe("drawing", () => {
  const model = buildGachaSimulatorModel(makeGacha(), rarities)

  it("draws only cards from the pool with rarities matching the buckets", () => {
    const rng = mulberry32(7)
    for (let index = 0; index < 200; index += 1) {
      const result = drawOnce(model.buckets, rng)
      expect(result).not.toBeNull()
      expect(rarities.get(result!.cardId)).toBe(result!.rarity)
    }
  })

  it("applies the guarantee to the 10th pull only", () => {
    const rng = mulberry32(99)
    for (let round = 0; round < 50; round += 1) {
      const results = drawTen(model, rng)
      expect(results).toHaveLength(10)
      expect(results[9]?.guaranteed).toBe(true)
      expect(["rarity_3", "rarity_4"]).toContain(results[9]?.rarity)
      expect(results.slice(0, 9).every((result) => !result.guaranteed)).toBe(true)
    }
  })

  it("honours the batch size and guarantee of the given pull", () => {
    const results = drawBatch(model, {
      behaviorType: "over_rarity_4_once",
      spinCount: 10,
      costResourceType: "paid_jewel",
      costResourceQuantity: 3000,
      executeLimit: 1,
      guaranteeRarity: "rarity_4",
    }, mulberry32(3))
    expect(results).toHaveLength(10)
    expect(results[9]?.rarity).toBe("rarity_4")
  })

  it("approximates the listed rates over many draws", () => {
    const rng = mulberry32(2024)
    const results = Array.from({ length: 20_000 }, () => drawOnce(model.buckets, rng)!)
    const tally = tallyDrawResults(results)
    const four = tally.find((entry) => entry.rarity === "rarity_4")?.count ?? 0
    expect(four / results.length).toBeGreaterThan(0.02)
    expect(four / results.length).toBeLessThan(0.04)
    expect(tally.map((entry) => entry.rarity)).toEqual(["rarity_4", "rarity_3", "rarity_2"])
  })

  it("returns null without buckets", () => {
    expect(drawOnce([], mulberry32(1))).toBeNull()
  })
})

describe("running tally", () => {
  const draw = (rarity: string, cardId = 1) => ({ cardId, rarity, lotteryType: "normal", guaranteed: false })

  it("accumulates batches into per-rarity counts without mutating the previous map", () => {
    const first = addDrawResultsToCounts(new Map(), [draw("rarity_2"), draw("rarity_2"), draw("rarity_4")])
    expect([...first.entries()]).toEqual([["rarity_2", 2], ["rarity_4", 1]])
    const second = addDrawResultsToCounts(first, [draw("rarity_3"), draw("rarity_2")])
    expect([...first.entries()]).toEqual([["rarity_2", 2], ["rarity_4", 1]])
    expect([...second.entries()]).toEqual([["rarity_2", 3], ["rarity_4", 1], ["rarity_3", 1]])
  })

  it("returns an equal copy for an empty batch", () => {
    const counts = new Map([["rarity_3", 4]])
    const next = addDrawResultsToCounts(counts, [])
    expect(next).not.toBe(counts)
    expect([...next.entries()]).toEqual([["rarity_3", 4]])
  })

  it("orders tally rows highest rarity first with birthday between 2 and 3", () => {
    const counts = new Map([["rarity_2", 5], ["rarity_birthday", 1], ["rarity_4", 2], ["rarity_3", 3]])
    expect(tallyFromCounts(counts)).toEqual([
      { rarity: "rarity_4", count: 2 },
      { rarity: "rarity_3", count: 3 },
      { rarity: "rarity_birthday", count: 1 },
      { rarity: "rarity_2", count: 5 },
    ])
    expect(tallyFromCounts(new Map())).toEqual([])
  })

  it("matches the one-shot tally over the same draws", () => {
    const draws = [draw("rarity_2"), draw("rarity_4"), draw("rarity_2"), draw("rarity_3"), draw("rarity_4")]
    const incremental = tallyFromCounts(addDrawResultsToCounts(addDrawResultsToCounts(new Map(), draws.slice(0, 2)), draws.slice(2)))
    expect(incremental).toEqual(tallyDrawResults(draws))
    expect(incremental).toEqual([
      { rarity: "rarity_4", count: 2 },
      { rarity: "rarity_3", count: 1 },
      { rarity: "rarity_2", count: 2 },
    ])
  })
})

describe("addSimulatorCost", () => {
  it("accumulates per resource and ignores free pulls", () => {
    const paid = { behaviorType: "normal", spinCount: 1, costResourceType: "jewel", costResourceQuantity: 300, executeLimit: null, guaranteeRarity: null }
    const free = { ...paid, costResourceType: null, costResourceQuantity: null }
    let spent = new Map<string, number>()
    spent = addSimulatorCost(spent, paid)
    spent = addSimulatorCost(spent, paid)
    spent = addSimulatorCost(spent, free)
    expect([...spent.entries()]).toEqual([["jewel", 600]])
  })
})

describe("buildGachaCardRateMap", () => {
  it("sums a card's share over every lottery it appears in", () => {
    const model = buildGachaSimulatorModel(makeGacha(), rarities)
    const map = buildGachaCardRateMap(model)
    expect(map.get(20)).toBeCloseTo(0.885 / 2, 10)
    expect(map.get(30)).toBeCloseTo(0.085, 10)
    expect(map.get(40)).toBeCloseTo(0.03 / 2, 10)
  })

  it("adds the wish lottery share on top of the normal one", () => {
    const model = buildGachaSimulatorModel(makeGacha({
      wishSelectCount: 1,
      rarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
        { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "rarity_4", lotteryType: "normal", rate: 2 },
        { cardRarityType: "rarity_4", lotteryType: "categorized_wish", rate: 1 },
      ],
    }), rarities)
    const map = buildGachaCardRateMap(model)
    // Card 40 is the wish pick: it leaves the normal ★4 bucket (card 41 keeps it) and owns the wish bucket.
    expect(map.get(41)).toBeCloseTo(0.02, 10)
    expect(map.get(40)).toBeCloseTo(0.01, 10)
    const total = [...map.values()].reduce((sum, value) => sum + value, 0)
    expect(total).toBeCloseTo(1, 10)
  })
})
