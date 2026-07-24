import { describe, expect, it } from "bun:test"
import type { CatalogGacha } from "./gacha-catalog"
import {
  buildGachaBannerCandidates,
  buildGachaCeilItemIconCandidates,
  buildGachaLogoCandidates,
  buildGachaRateSummary,
  collectGachaRarities,
  collectGachaYears,
  countGachaPages,
  dedupGachaPickupCardIds,
  excludeUnreleasedGachas,
  filterGachas,
  formatGachaRatePercent,
  isGachaUnreleased,
  normalizeCatalogGacha,
  normalizeCatalogGachas,
  normalizeGachaCeilItems,
  normalizeGachaTimestamp,
  paginateGachas,
  resolveGachaCardRate,
  resolveGachaGuaranteedRarity,
  resolveGachaStatus,
  sortGachas,
  stripGachaMarkup,
} from "./gacha-catalog"

function makeGacha(overrides: Partial<CatalogGacha> = {}): CatalogGacha {
  return {
    id: 1,
    gachaType: "normal",
    name: "Test Gacha",
    seq: 10,
    assetbundleName: "ab_gacha_1",
    startAt: Date.UTC(2023, 0, 1),
    endAt: Date.UTC(2023, 0, 10),
    gachaCeilItemId: null,
    wishSelectCount: 0,
    wishFixedSelectCount: 0,
    wishLimitedSelectCount: 0,
    rarityRates: [],
    pickups: [],
    details: [],
    behaviors: [],
    information: { summary: "", description: "" },
    ...overrides,
  }
}

describe("normalizeCatalogGacha", () => {
  it("normalizes a full record", () => {
    const gacha = normalizeCatalogGacha({
      id: 145,
      gachaType: "beginner",
      name: "Beginner Gacha",
      seq: 1000,
      assetbundleName: "ab_gacha_145",
      startAt: 1632970800000,
      endAt: 1711767599000,
      gachaCeilItemId: 12,
      wishSelectCount: 1,
      wishFixedSelectCount: 2,
      wishLimitedSelectCount: 3,
      gachaCardRarityRates: [
        { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
      ],
      gachaDetails: [{ id: 1, gachaId: 145, cardId: 2, weight: 1 }],
      gachaBehaviors: [
        {
          id: 404,
          gachaBehaviorType: "over_rarity_3_once",
          costResourceType: "paid_jewel",
          costResourceQuantity: 3000,
          spinCount: 10,
          executeLimit: 1,
          gachaSpinnableType: "any",
        },
      ],
      gachaPickups: [{ gachaId: 145, cardId: 4 }],
      gachaInformation: { gachaId: 145, summary: "sum", description: "desc" },
    })

    expect(gacha).not.toBeNull()
    expect(gacha?.id).toBe(145)
    expect(gacha?.gachaType).toBe("beginner")
    expect(gacha?.gachaCeilItemId).toBe(12)
    expect(gacha?.rarityRates).toEqual([
      { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
    ])
    expect(gacha?.details).toEqual([{ cardId: 2, weight: 1 }])
    expect(gacha?.behaviors[0]?.gachaBehaviorType).toBe("over_rarity_3_once")
    expect(gacha?.behaviors[0]?.gachaSpinnableType).toBe("any")
    expect(gacha?.pickups).toEqual([{ cardId: 4, gachaPickupType: null }])
    expect(gacha?.information).toEqual({ summary: "sum", description: "desc" })
  })

  it("tolerates KR minimal-field shapes and missing sections", () => {
    const gacha = normalizeCatalogGacha({
      id: 7,
      gachaType: "mystery_future_type",
      name: "Minimal",
      gachaCardRarityRates: [
        { cardRarityType: "RARITY_3", lotteryType: "normal", rate: 8.5 },
        { cardRarityType: "", rate: 1 },
        { rate: "not-a-number" },
      ],
      gachaPickups: [{ gachaId: 7, cardId: 42 }, { gachaId: 7 }],
      gachaBehaviors: [{ gachaBehaviorType: "normal" }, { spinCount: 10 }],
    })

    expect(gacha).not.toBeNull()
    expect(gacha?.gachaType).toBe("mystery_future_type")
    expect(gacha?.startAt).toBeNull()
    expect(gacha?.rarityRates).toEqual([
      { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
    ])
    expect(gacha?.pickups).toEqual([{ cardId: 42, gachaPickupType: null }])
    expect(gacha?.behaviors).toEqual([
      {
        id: null,
        gachaBehaviorType: "normal",
        costResourceType: null,
        costResourceQuantity: null,
        spinCount: null,
        executeLimit: null,
        gachaSpinnableType: null,
      },
    ])
    expect(gacha?.information).toEqual({ summary: "", description: "" })
  })

  it("drops invalid records", () => {
    expect(normalizeCatalogGacha(null)).toBeNull()
    expect(normalizeCatalogGacha({ name: "no id" })).toBeNull()
    expect(normalizeCatalogGachas([null, { id: 1 }, "junk"])).toHaveLength(1)
  })
})

describe("normalizeGachaTimestamp", () => {
  it("keeps millisecond timestamps and upgrades second-based values", () => {
    expect(normalizeGachaTimestamp(1632970800000)).toBe(1632970800000)
    expect(normalizeGachaTimestamp(1632970800)).toBe(1632970800000)
    expect(normalizeGachaTimestamp(null)).toBeNull()
    expect(normalizeGachaTimestamp(-5)).toBeNull()
  })
})

describe("normalizeGachaCeilItems", () => {
  it("maps items by id", () => {
    const map = normalizeGachaCeilItems([
      { id: 1, name: "Sticker", assetbundleName: "ceil_item", gachaId: 4 },
      { name: "no id" },
    ])
    expect(map.size).toBe(1)
    expect(map.get(1)).toEqual({ id: 1, name: "Sticker", assetbundleName: "ceil_item", gachaId: 4 })
  })
})

describe("resolveGachaStatus", () => {
  const gacha = makeGacha({ startAt: 100, endAt: 200 })

  it("resolves upcoming, ongoing and ended", () => {
    expect(resolveGachaStatus(gacha, 50)).toBe("upcoming")
    expect(resolveGachaStatus(gacha, 150)).toBe("ongoing")
    expect(resolveGachaStatus(gacha, 250)).toBe("ended")
  })

  it("falls back to ended without timestamps", () => {
    expect(resolveGachaStatus(makeGacha({ startAt: null, endAt: null }), 50)).toBe("ended")
  })
})

describe("unreleased gachas", () => {
  it("flags gachas whose startAt is in the future", () => {
    expect(isGachaUnreleased(makeGacha({ startAt: 100 }), 50)).toBe(true)
    expect(isGachaUnreleased(makeGacha({ startAt: 100 }), 150)).toBe(false)
    expect(isGachaUnreleased(makeGacha({ startAt: null }), 50)).toBe(false)
  })

  it("excludes unreleased gachas only when hiding is enabled", () => {
    const gachas = [
      makeGacha({ id: 1, startAt: 100 }),
      makeGacha({ id: 2, startAt: 300 }),
      makeGacha({ id: 3, startAt: null }),
    ]
    expect(excludeUnreleasedGachas(gachas, true, 200).map((gacha) => gacha.id)).toEqual([1, 3])
    expect(excludeUnreleasedGachas(gachas, false, 200).map((gacha) => gacha.id)).toEqual([1, 2, 3])
  })
})

describe("filterGachas / sortGachas", () => {
  const gachas = [
    makeGacha({ id: 1, name: "Alpha Fes", gachaType: "ceil", startAt: Date.UTC(2022, 5, 1), endAt: Date.UTC(2022, 5, 10) }),
    makeGacha({ id: 2, name: "Beta", gachaType: "normal", startAt: 100, endAt: 200 }),
    makeGacha({ id: 3, name: "Gamma", gachaType: "normal", startAt: Date.UTC(2023, 2, 1), endAt: Date.UTC(2099, 0, 1) }),
  ]

  it("filters by search text and id", () => {
    expect(filterGachas(gachas, { search: "alpha" }).map((g) => g.id)).toEqual([1])
    expect(filterGachas(gachas, { search: "2" }).map((g) => g.id)).toEqual([2])
  })

  it("filters by type, status and year", () => {
    expect(filterGachas(gachas, { gachaType: "ceil" }).map((g) => g.id)).toEqual([1])
    expect(filterGachas(gachas, { status: "ongoing" }, Date.UTC(2024, 0, 1)).map((g) => g.id)).toEqual([3])
    expect(filterGachas(gachas, { status: "ended" }, Date.UTC(2024, 0, 1)).map((g) => g.id)).toEqual([1, 2])
    expect(filterGachas(gachas, { year: 2022 }).map((g) => g.id)).toEqual([1])
  })

  it("sorts by startAt desc by default and supports other keys", () => {
    expect(sortGachas(gachas, "startDesc").map((g) => g.id)).toEqual([3, 1, 2])
    expect(sortGachas(gachas, "startAsc").map((g) => g.id)).toEqual([2, 1, 3])
    expect(sortGachas(gachas, "idAsc").map((g) => g.id)).toEqual([1, 2, 3])
  })

  it("collects years descending", () => {
    expect(collectGachaYears(gachas)).toEqual([2023, 2022, 1970])
  })
})

describe("pagination", () => {
  it("counts and slices pages", () => {
    expect(countGachaPages(0, 24)).toBe(1)
    expect(countGachaPages(25, 24)).toBe(2)
    expect(paginateGachas([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4])
    expect(paginateGachas([1, 2, 3], 99, 2)).toEqual([3])
  })
})

describe("dedupGachaPickupCardIds", () => {
  it("dedups by cardId preserving order", () => {
    expect(dedupGachaPickupCardIds([
      { cardId: 5, gachaPickupType: null },
      { cardId: 3, gachaPickupType: null },
      { cardId: 5, gachaPickupType: "normal" },
    ])).toEqual([5, 3])
  })
})

describe("gacha rate math", () => {
  const cardRarities = new Map<number, string>([
    [1, "rarity_2"],
    [2, "rarity_2"],
    [3, "rarity_3"],
    [4, "rarity_4"],
    [5, "rarity_4"],
  ])

  const gacha = makeGacha({
    rarityRates: [
      { cardRarityType: "rarity_2", lotteryType: "normal", rate: 88.5 },
      { cardRarityType: "rarity_3", lotteryType: "normal", rate: 8.5 },
      { cardRarityType: "rarity_4", lotteryType: "normal", rate: 3 },
      { cardRarityType: "rarity_4", lotteryType: "guarantee", rate: 100 },
    ],
    details: [
      { cardId: 1, weight: 1 },
      { cardId: 2, weight: 1 },
      { cardId: 3, weight: 1 },
      { cardId: 4, weight: 3 },
      { cardId: 5, weight: 1 },
      // duplicate row for card 5: weights accumulate, card counted once
      { cardId: 5, weight: 1 },
    ],
  })

  it("computes base rates only from lotteryType normal rows", () => {
    const summary = buildGachaRateSummary(gacha, cardRarities)
    expect(summary.baseRates.get("rarity_2")).toBeCloseTo(0.885, 10)
    expect(summary.baseRates.get("rarity_3")).toBeCloseTo(0.085, 10)
    expect(summary.baseRates.get("rarity_4")).toBeCloseTo(0.03, 10)
    expect(summary.baseRates.size).toBe(3)
  })

  it("buckets card counts and weights per rarity", () => {
    const summary = buildGachaRateSummary(gacha, cardRarities)
    expect(summary.rarityCardCounts.get("rarity_2")).toBe(2)
    expect(summary.rarityCardCounts.get("rarity_4")).toBe(2)
    expect(summary.rarityWeightTotals.get("rarity_4")).toBe(5)
    expect(summary.cardWeights.get(5)).toBe(2)
  })

  it("resolves guaranteed rarity with rarity_4 winning", () => {
    expect(resolveGachaGuaranteedRarity([
      { id: null, gachaBehaviorType: "over_rarity_3_once", costResourceType: null, costResourceQuantity: null, spinCount: null, executeLimit: null, gachaSpinnableType: null },
      { id: null, gachaBehaviorType: "over_rarity_4_once", costResourceType: null, costResourceQuantity: null, spinCount: null, executeLimit: null, gachaSpinnableType: null },
    ])).toBe("rarity_4")
    expect(resolveGachaGuaranteedRarity([
      { id: null, gachaBehaviorType: "normal", costResourceType: null, costResourceQuantity: null, spinCount: null, executeLimit: null, gachaSpinnableType: null },
    ])).toBeNull()
  })

  it("folds rarity_2 into a rarity_3 guarantee", () => {
    const withGuarantee = makeGacha({
      ...gacha,
      behaviors: [
        { id: 1, gachaBehaviorType: "over_rarity_3_once", costResourceType: "jewel", costResourceQuantity: 3000, spinCount: 10, executeLimit: null, gachaSpinnableType: "any" },
      ],
    })
    const summary = buildGachaRateSummary(withGuarantee, cardRarities)
    expect(summary.guaranteedRarity).toBe("rarity_3")
    expect(summary.guaranteedRates?.get("rarity_3")).toBeCloseTo(0.885 + 0.085, 10)
    expect(summary.guaranteedRates?.get("rarity_2")).toBe(0)
    expect(summary.guaranteedRates?.get("rarity_4")).toBeCloseTo(0.03, 10)
  })

  it("folds rarity_2 and rarity_3 into a rarity_4 guarantee", () => {
    const withGuarantee = makeGacha({
      ...gacha,
      behaviors: [
        { id: 1, gachaBehaviorType: "over_rarity_3_once", costResourceType: null, costResourceQuantity: null, spinCount: null, executeLimit: null, gachaSpinnableType: null },
        { id: 2, gachaBehaviorType: "over_rarity_4_once", costResourceType: null, costResourceQuantity: null, spinCount: null, executeLimit: null, gachaSpinnableType: null },
      ],
    })
    const summary = buildGachaRateSummary(withGuarantee, cardRarities)
    expect(summary.guaranteedRarity).toBe("rarity_4")
    expect(summary.guaranteedRates?.get("rarity_4")).toBeCloseTo(0.885 + 0.085 + 0.03, 10)
    expect(summary.guaranteedRates?.get("rarity_2")).toBe(0)
    expect(summary.guaranteedRates?.get("rarity_3")).toBe(0)
  })

  it("computes per-card rates as weight share times rarity fraction", () => {
    const summary = buildGachaRateSummary(gacha, cardRarities)
    // card 4: weight 3 of 5 total rarity_4 weight, rarity rate 3%
    expect(resolveGachaCardRate(summary, 4)).toBeCloseTo((3 / 5) * 0.03, 10)
    // card 5 accumulated weight 2 of 5
    expect(resolveGachaCardRate(summary, 5)).toBeCloseTo((2 / 5) * 0.03, 10)
    // unknown card
    expect(resolveGachaCardRate(summary, 999)).toBeNull()
  })

  it("formats percentages with 3 decimal places", () => {
    expect(formatGachaRatePercent((3 / 5) * 0.03)).toBe("1.800%")
    expect(formatGachaRatePercent(0.885, 1)).toBe("88.5%")
    expect(formatGachaRatePercent(null)).toBe("—")
  })

  it("collects rarities highest first", () => {
    const summary = buildGachaRateSummary(gacha, cardRarities)
    expect(collectGachaRarities(summary)).toEqual(["rarity_4", "rarity_3", "rarity_2"])
  })
})

describe("stripGachaMarkup", () => {
  it("removes HTML-ish tags and trims", () => {
    expect(stripGachaMarkup("<color=#ff0000>Hot!</color>\nLine two "))
      .toBe("Hot!\nLine two")
    expect(stripGachaMarkup("plain text")).toBe("plain text")
  })
})

describe("asset candidates", () => {
  const gacha = makeGacha({ id: 145, seq: 1000, assetbundleName: "ab_gacha_145" })

  it("builds ordered deduped logo candidates", () => {
    const urls = buildGachaLogoCandidates(gacha, "kr", "china")
    expect(urls[0]).toBe("https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/gacha/ab_gacha_145/logo/logo.png")
    expect(urls).toContain("https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/logo/ab_gacha_145.png")
    expect(urls).toContain("https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/logo/banner_logo145.png")
    expect(urls).toContain("https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/logo/banner_logo1000.png")
    expect(new Set(urls).size).toBe(urls.length)
  })

  it("falls back to id-based logo paths without an assetbundleName", () => {
    const urls = buildGachaLogoCandidates(makeGacha({ id: 9, seq: null, assetbundleName: "" }), "jp")
    expect(urls).toEqual([
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/gacha/ab_gacha_9/logo/logo.png",
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/logo/banner_logo9.png",
    ])
  })

  it("builds banner candidates", () => {
    const urls = buildGachaBannerCandidates(gacha, "kr")
    expect(urls).toEqual([
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/home/banner/banner_gacha145/banner_gacha145.png",
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/gacha/ab_gacha_145/screen/texture/bg_gacha145.png",
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/home/banner/ab_gacha_145/ab_gacha_145.png",
    ])
  })

  it("builds ceil item icon candidates", () => {
    const urls = buildGachaCeilItemIconCandidates("ceil_item", "kr")
    expect(urls).toEqual([
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/thumbnail/gacha_item/ceil_item.png",
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/thumbnail/material/ceil_item.png",
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/thumbnail/common_material/ceil_item.png",
    ])
    expect(buildGachaCeilItemIconCandidates("  ", "kr")).toEqual([])
  })
})
