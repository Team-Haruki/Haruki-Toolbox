import { describe, expect, it } from "bun:test"
import type { SekaiLabelContext } from "@/shared/sekai/labels"
import {
  resolveGachaBehaviorTypeLabel,
  resolveGachaCostResourceLabel,
  resolveGachaExchangeLabelType,
  resolveGachaLotteryTypeLabel,
  resolveGachaRarityLabel,
  resolveGachaResourceTypeLabel,
  resolveGachaTypeLabel,
} from "./gacha-labels"

/** A fake i18n: `te` knows only the listed keys, `t` echoes the key in brackets. */
function context(known: readonly string[]): SekaiLabelContext {
  const keys = new Set(known)
  return {
    t: (key) => `[${key}]`,
    te: (key) => keys.has(key),
  }
}

describe("resolveGachaTypeLabel", () => {
  const ctx = context(["gachaCatalog.type.gift", "gachas.type.ceil", "gachas.type.unknown"])

  it("prefers the module namespace for members the core bundle lacks", () => {
    expect(resolveGachaTypeLabel(ctx, "gift")).toBe("[gachaCatalog.type.gift]")
  })

  it("falls back to the core gachas.type enum", () => {
    expect(resolveGachaTypeLabel(ctx, "ceil")).toBe("[gachas.type.ceil]")
  })

  it("prefers the module key over the core key when both exist", () => {
    const both = context(["gachaCatalog.type.ceil", "gachas.type.ceil"])
    expect(resolveGachaTypeLabel(both, "ceil")).toBe("[gachaCatalog.type.ceil]")
  })

  it("renders the raw value for unknown members instead of an i18n key", () => {
    expect(resolveGachaTypeLabel(ctx, "brand_new_type")).toBe("brand_new_type")
  })

  it("trims whitespace before looking keys up", () => {
    expect(resolveGachaTypeLabel(ctx, "  gift ")).toBe("[gachaCatalog.type.gift]")
    expect(resolveGachaTypeLabel(ctx, " ceil")).toBe("[gachas.type.ceil]")
  })

  it("uses the core unknown label for empty, null and undefined", () => {
    expect(resolveGachaTypeLabel(ctx, "")).toBe("[gachas.type.unknown]")
    expect(resolveGachaTypeLabel(ctx, "   ")).toBe("[gachas.type.unknown]")
    expect(resolveGachaTypeLabel(ctx, null)).toBe("[gachas.type.unknown]")
    expect(resolveGachaTypeLabel(ctx, undefined)).toBe("[gachas.type.unknown]")
  })
})

describe("core enum labels", () => {
  const ctx = context([
    "gachas.rarity.rarity_4",
    "gachas.behaviorType.over_rarity_3_once",
    "gachas.costResource.jewel",
  ])

  it("resolves known members from the core gachas.* enums", () => {
    expect(resolveGachaRarityLabel(ctx, "rarity_4")).toBe("[gachas.rarity.rarity_4]")
    expect(resolveGachaBehaviorTypeLabel(ctx, "over_rarity_3_once")).toBe("[gachas.behaviorType.over_rarity_3_once]")
    expect(resolveGachaCostResourceLabel(ctx, "jewel")).toBe("[gachas.costResource.jewel]")
  })

  it("renders unknown members raw and empty values as an empty string", () => {
    expect(resolveGachaRarityLabel(ctx, "rarity_7")).toBe("rarity_7")
    expect(resolveGachaBehaviorTypeLabel(ctx, "mystery")).toBe("mystery")
    expect(resolveGachaCostResourceLabel(ctx, "gold")).toBe("gold")
    expect(resolveGachaRarityLabel(ctx, null)).toBe("")
    expect(resolveGachaBehaviorTypeLabel(ctx, undefined)).toBe("")
    expect(resolveGachaCostResourceLabel(ctx, "")).toBe("")
  })
})

describe("module namespace labels", () => {
  const ctx = context([
    "gachaCatalog.rates.lottery.normal",
    "gachaCatalog.ceil.label.limited",
    "gachaCatalog.ceil.resource.jewel",
  ])

  it("resolves lottery, exchange label and resource types from gachaCatalog.*", () => {
    expect(resolveGachaLotteryTypeLabel(ctx, "normal")).toBe("[gachaCatalog.rates.lottery.normal]")
    expect(resolveGachaExchangeLabelType(ctx, "limited")).toBe("[gachaCatalog.ceil.label.limited]")
    expect(resolveGachaResourceTypeLabel(ctx, "jewel")).toBe("[gachaCatalog.ceil.resource.jewel]")
  })

  it("renders unknown members raw and empty values as an empty string", () => {
    expect(resolveGachaLotteryTypeLabel(ctx, "rate_choice_third")).toBe("rate_choice_third")
    expect(resolveGachaExchangeLabelType(ctx, "collab")).toBe("collab")
    expect(resolveGachaResourceTypeLabel(ctx, "boost")).toBe("boost")
    expect(resolveGachaLotteryTypeLabel(ctx, null)).toBe("")
    expect(resolveGachaExchangeLabelType(ctx, "")).toBe("")
    expect(resolveGachaResourceTypeLabel(ctx, undefined)).toBe("")
  })
})
