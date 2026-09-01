import { describe, expect, it } from "bun:test"
import {
  buildGachaCeilExchangeIndex,
  buildGachaCeilExchangeRows,
  buildGachaCeilItemsIndex,
  buildGachaCeilResourceBoxes,
  normalizeGachaCeilExchangeSummaries,
  resolveGachaCeilExchangeSummary,
  resolveGachaCeilItem,
} from "./gacha-ceil"

const rawSummary = {
  id: 566,
  seq: 566,
  gachaId: 997,
  assetbundleName: "ab_gacha_997",
  startAt: 1788145200000,
  endAt: 1791082799000,
  gachaCeilItemId: 566,
  gachaCeilExchanges: [
    {
      id: 2457,
      gachaCeilExchangeSummaryId: 566,
      seq: 2,
      resourceBoxId: 9998,
      exchangeLimit: 5,
      startAt: 1788145200000,
      endAt: 1791082799000,
      gachaCeilExchangeCost: { gachaCeilExchangeId: 2457, gachaCeilItemId: 566, quantity: 200, resourceType: "gacha_ceil_item", resourceId: 566 },
      gachaCeilExchangeSubstituteCosts: [],
    },
    {
      id: 2453,
      gachaCeilExchangeSummaryId: 566,
      seq: 1,
      resourceBoxId: 1992,
      gachaCeilExchangeLabelType: "limited",
      substituteLimit: 10,
      startAt: 1788145200000,
      endAt: 1791082799000,
      gachaCeilExchangeCost: { quantity: 300, resourceType: "gacha_ceil_item", resourceId: 566 },
      gachaCeilExchangeSubstituteCosts: [{ id: 1271, resourceType: "material", resourceId: 48, substituteQuantity: 10 }],
    },
    { seq: 3 },
  ],
}

describe("normalizeGachaCeilExchangeSummaries", () => {
  it("normalizes summaries, costs and substitute costs in seq order", () => {
    const [summary] = normalizeGachaCeilExchangeSummaries([rawSummary, { name: "no id" }])
    expect(summary?.gachaId).toBe(997)
    expect(summary?.gachaCeilItemId).toBe(566)
    expect(summary?.exchanges.map((row) => row.id)).toEqual([2453, 2457])
    const limited = summary?.exchanges[0]
    expect(limited?.labelType).toBe("limited")
    expect(limited?.substituteLimit).toBe(10)
    expect(limited?.cost).toEqual({ resourceType: "gacha_ceil_item", resourceId: 566, quantity: 300 })
    expect(limited?.substituteCosts).toEqual([{ resourceType: "material", resourceId: 48, quantity: 10 }])
    expect(summary?.exchanges[1]?.exchangeLimit).toBe(5)
    expect(summary?.exchanges[1]?.labelType).toBeNull()
  })
})

describe("buildGachaCeilResourceBoxes", () => {
  it("keeps only sticker-exchange boxes from embedded jp details", () => {
    const result = buildGachaCeilResourceBoxes([
      { resourceBoxPurpose: "gacha_ceil_exchange", id: 9999, resourceBoxType: "expand", details: [{ resourceType: "material", resourceId: 15, resourceQuantity: 5 }] },
      { resourceBoxPurpose: "event_ranking_reward", id: 9999, resourceBoxType: "expand", details: [{ resourceType: "honor", resourceId: 1, resourceQuantity: 1 }] },
      { resourceBoxPurpose: "gacha_ceil_exchange", id: 1024, resourceBoxType: "expand", details: [{ resourceType: "card", resourceId: 48, resourceLevel: 1, resourceQuantity: 1 }] },
    ], undefined)
    expect(result.available).toBe(true)
    expect(result.boxes.size).toBe(2)
    expect(result.boxes.get(9999)).toEqual([{ resourceType: "material", resourceId: 15, quantity: 5, level: null }])
    expect(result.boxes.get(1024)?.[0]?.level).toBe(1)
  })

  it("merges flat tw/kr details and degrades without either file", () => {
    const result = buildGachaCeilResourceBoxes(
      [{ resourceBoxPurpose: "gacha_ceil_exchange", id: 7, resourceBoxType: "expand" }],
      [
        { resourceBoxPurpose: "gacha_ceil_exchange", resourceBoxId: 7, resourceType: "card", resourceId: 100, resourceQuantity: 1 },
        { resourceBoxPurpose: "gacha_ceil_exchange", resourceBoxId: 8, resourceType: "material", resourceId: 15, resourceQuantity: 5 },
        { resourceBoxPurpose: "shop_item", resourceBoxId: 9, resourceType: "material", resourceId: 15, resourceQuantity: 5 },
      ],
    )
    expect(result.boxes.get(7)).toEqual([{ resourceType: "card", resourceId: 100, quantity: 1, level: null }])
    expect(result.boxes.get(8)?.length).toBe(1)
    expect(result.boxes.has(9)).toBe(false)
    expect(buildGachaCeilResourceBoxes([], []).available).toBe(false)
  })
})

describe("resolvers", () => {
  const items = buildGachaCeilItemsIndex({
    gachaCeilItems: [
      { id: 566, gachaId: 997, name: "Sticker 997", assetbundleName: "ceil_item_limited", convertStartAt: 1791082800000 },
      { id: 12, gachaId: 4, name: "Sticker 4", assetbundleName: "ceil_item" },
    ],
  })
  const exchange = buildGachaCeilExchangeIndex({
    gachaCeilExchangeSummaries: [rawSummary, { id: 13, gachaCeilItemId: 12, gachaCeilExchanges: [] }],
    resourceBoxes: [],
    resourceBoxDetails: [],
  })

  it("resolves the ceil item by gachaId first, then by gachaCeilItemId", () => {
    expect(resolveGachaCeilItem(items, { id: 997, gachaCeilItemId: null })?.id).toBe(566)
    expect(resolveGachaCeilItem(items, { id: 1, gachaCeilItemId: 12 })?.id).toBe(12)
    expect(resolveGachaCeilItem(items, { id: 1, gachaCeilItemId: null })).toBeNull()
    expect(items.byId.get(566)?.convertStartAt).toBe(1791082800000)
  })

  it("resolves the exchange summary by gachaId first, then by ceil item id", () => {
    expect(resolveGachaCeilExchangeSummary(exchange, { id: 997, gachaCeilItemId: null }, null)?.id).toBe(566)
    expect(resolveGachaCeilExchangeSummary(exchange, { id: 4, gachaCeilItemId: null }, items.byId.get(12) ?? null)?.id).toBe(13)
    expect(resolveGachaCeilExchangeSummary(exchange, { id: 4, gachaCeilItemId: 12 }, null)?.id).toBe(13)
    expect(resolveGachaCeilExchangeSummary(exchange, { id: 5, gachaCeilItemId: null }, null)).toBeNull()
    expect(exchange.boxes.available).toBe(false)
  })
})

describe("buildGachaCeilExchangeRows", () => {
  const [summary] = normalizeGachaCeilExchangeSummaries([rawSummary])

  it("joins rewards when the boxes are available", () => {
    const boxes = buildGachaCeilResourceBoxes([
      { resourceBoxPurpose: "gacha_ceil_exchange", id: 1992, details: [{ resourceType: "card", resourceId: 1454, resourceQuantity: 1 }] },
    ], undefined)
    const rows = buildGachaCeilExchangeRows(summary ?? null, boxes)
    expect(rows.map((row) => row.exchange.id)).toEqual([2453, 2457])
    expect(rows[0]?.rewards).toEqual([{ resourceType: "card", resourceId: 1454, quantity: 1, level: null }])
    expect(rows[1]?.rewards).toBeNull()
  })

  it("degrades to null rewards without boxes and to nothing without a summary", () => {
    const rows = buildGachaCeilExchangeRows(summary ?? null, buildGachaCeilResourceBoxes([], []))
    expect(rows.length).toBe(2)
    expect(rows.every((row) => row.rewards === null)).toBe(true)
    expect(buildGachaCeilExchangeRows(null, null)).toEqual([])
  })
})
