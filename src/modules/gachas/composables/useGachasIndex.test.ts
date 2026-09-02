import { describe, expect, it } from "bun:test"
import { GACHAS_INDEX_FILES, GACHAS_INDEX_KEY, buildGachasIndex, normalizeCatalogGachaSummary } from "./useGachasIndex"

function record(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 145,
    gachaType: "ceil",
    name: "Colorful Festival",
    seq: 1000,
    assetbundleName: "ab_gacha_145",
    startAt: 1_632_970_800_000,
    endAt: 1_711_767_599_000,
    gachaCeilItemId: 12,
    wishSelectCount: 2,
    wishFixedSelectCount: 1,
    wishLimitedSelectCount: 1,
    gachaCardRarityRates: [
      { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
      { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
      { cardRarityType: "RARITY_4", rate: 3 },
    ],
    gachaPickups: [
      { cardId: 40, gachaPickupType: "normal" },
      { cardId: 41, gachaPickupType: "normal" },
      { cardId: 40, gachaPickupType: "normal" },
      { cardId: "not a number" },
    ],
    gachaBehaviors: [
      { id: 1, gachaBehaviorType: "normal", costResourceType: "jewel", costResourceQuantity: 300, spinCount: 1 },
      { id: 2, gachaBehaviorType: "over_rarity_3_once", costResourceType: "jewel", costResourceQuantity: 3000, spinCount: 10 },
      { gachaBehaviorType: "" },
    ],
    // Detail-only fields the summary must not carry.
    gachaDetails: [{ cardId: 40, weight: 1, isWish: true }],
    gachaInformation: { summary: "big", description: "text" },
    ...overrides,
  }
}

describe("normalizeCatalogGachaSummary", () => {
  it("keeps the listing fields and drops the heavy detail data", () => {
    const summary = normalizeCatalogGachaSummary(record())
    expect(summary).not.toBeNull()
    expect(summary).toEqual({
      id: 145,
      gachaType: "ceil",
      name: "Colorful Festival",
      seq: 1000,
      assetbundleName: "ab_gacha_145",
      startAt: 1_632_970_800_000,
      endAt: 1_711_767_599_000,
      gachaCeilItemId: 12,
      wishSelectCount: 2,
      wishFixedSelectCount: 1,
      wishLimitedSelectCount: 1,
      rarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
        { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "rarity_4", lotteryType: "normal", rate: 3 },
      ],
      pickups: [
        { cardId: 40, gachaPickupType: "normal" },
        { cardId: 41, gachaPickupType: "normal" },
        { cardId: 40, gachaPickupType: "normal" },
      ],
      pickupCardIds: [40, 41],
      behaviors: [
        {
          id: 1,
          gachaBehaviorType: "normal",
          costResourceType: "jewel",
          costResourceQuantity: 300,
          spinCount: 1,
          executeLimit: null,
          gachaSpinnableType: null,
        },
        {
          id: 2,
          gachaBehaviorType: "over_rarity_3_once",
          costResourceType: "jewel",
          costResourceQuantity: 3000,
          spinCount: 10,
          executeLimit: null,
          gachaSpinnableType: null,
        },
      ],
    })
    expect(summary).not.toHaveProperty("details")
    expect(summary).not.toHaveProperty("information")
  })

  it("normalizes second-precision timestamps and Nuverse dumps without a ceil item id", () => {
    const summary = normalizeCatalogGachaSummary(record({
      startAt: 1_632_970_800,
      endAt: "1711767599",
      gachaCeilItemId: undefined,
      wishSelectCount: undefined,
      wishFixedSelectCount: null,
      wishLimitedSelectCount: "x",
    }))
    expect(summary?.startAt).toBe(1_632_970_800_000)
    expect(summary?.endAt).toBe(1_711_767_599_000)
    expect(summary?.gachaCeilItemId).toBeNull()
    expect(summary?.wishSelectCount).toBe(0)
    expect(summary?.wishFixedSelectCount).toBe(0)
    expect(summary?.wishLimitedSelectCount).toBe(0)
  })

  it("falls back to #id for a missing name and empty lists for missing arrays", () => {
    const summary = normalizeCatalogGachaSummary({ id: 7 })
    expect(summary).toEqual({
      id: 7,
      gachaType: "",
      name: "#7",
      seq: null,
      assetbundleName: "",
      startAt: null,
      endAt: null,
      gachaCeilItemId: null,
      wishSelectCount: 0,
      wishFixedSelectCount: 0,
      wishLimitedSelectCount: 0,
      rarityRates: [],
      pickups: [],
      pickupCardIds: [],
      behaviors: [],
    })
  })

  it("rejects records without a positive id and non-object input", () => {
    expect(normalizeCatalogGachaSummary(record({ id: 0 }))).toBeNull()
    expect(normalizeCatalogGachaSummary(record({ id: -3 }))).toBeNull()
    expect(normalizeCatalogGachaSummary(record({ id: "abc" }))).toBeNull()
    expect(normalizeCatalogGachaSummary(null)).toBeNull()
    expect(normalizeCatalogGachaSummary(undefined)).toBeNull()
    expect(normalizeCatalogGachaSummary("gacha")).toBeNull()
    expect(normalizeCatalogGachaSummary(42)).toBeNull()
  })
})

describe("buildGachasIndex", () => {
  const files = {
    gachas: [
      record({ id: 1, name: "Alpha", startAt: 1_000, gachaPickups: [{ cardId: 10 }, { cardId: 11 }] }),
      record({ id: 2, name: "Beta", startAt: 3_000, gachaPickups: [{ cardId: 11 }] }),
      record({ id: 3, name: "Gamma", startAt: null, gachaPickups: [] }),
      record({ id: 4, name: "Delta", startAt: 3_000, gachaPickups: [{ cardId: 10 }] }),
      // Rerun: bracketed prefix on the original's name; it reuses that banner.
      record({ id: 5, name: "[復刻]Alpha", startAt: 5_000, gachaPickups: [] }),
      { id: 0, name: "broken" },
      "garbage",
      null,
    ],
  }

  it("sorts newest startAt first with descending id as the tiebreak", () => {
    const index = buildGachasIndex(files)
    expect(index.list.map((gacha) => gacha.id)).toEqual([5, 4, 2, 1, 3])
  })

  it("skips invalid records and indexes the rest by id", () => {
    const index = buildGachasIndex(files)
    expect(index.byId.size).toBe(5)
    expect(index.byId.get(2)?.name).toBe("Beta")
    expect(index.byId.has(0)).toBe(false)
  })

  it("maps each pickup card to its gachas newest first", () => {
    const index = buildGachasIndex(files)
    expect(index.gachaIdsByPickupCard.get(10)).toEqual([4, 1])
    expect(index.gachaIdsByPickupCard.get(11)).toEqual([2, 1])
    expect(index.gachaIdsByPickupCard.has(99)).toBe(false)
  })

  it("aliases rerun banners to the original gacha", () => {
    const index = buildGachasIndex(files)
    expect(index.bannerAliasMap.get(5)).toBe(1)
    expect(index.bannerAliasMap.has(1)).toBe(false)
  })

  it("returns empty structures when the file is missing or malformed", () => {
    for (const input of [{}, { gachas: null }, { gachas: "nope" }, { gachas: [] }]) {
      const index = buildGachasIndex(input)
      expect(index.list).toEqual([])
      expect(index.byId.size).toBe(0)
      expect(index.gachaIdsByPickupCard.size).toBe(0)
      expect(index.bannerAliasMap.size).toBe(0)
    }
  })

  it("declares gachas.json as its only file", () => {
    expect(GACHAS_INDEX_KEY).toBe("gachas/index")
    expect([...GACHAS_INDEX_FILES]).toEqual(["gachas"])
  })
})
