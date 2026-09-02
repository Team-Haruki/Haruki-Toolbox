import { describe, expect, test } from "bun:test"
import {
  resolveSekaiAttrLabel,
  resolveSekaiDifficultyLabel,
  resolveSekaiEnumLabel,
  resolveSekaiEventTypeLabel,
  resolveSekaiGachaTypeLabel,
  resolveSekaiMusicCategoryLabel,
  resolveSekaiMusicTagLabel,
  resolveSekaiRarityLabel,
  resolveSekaiSupplyLabel,
  resolveSekaiUnitLabel,
  resolveSekaiVocalTypeLabel,
  type SekaiLabelContext,
} from "./labels"

const messages: Record<string, string> = {
  "cards.unit.piapro": "VIRTUAL SINGER",
  "cards.attr.cool": "Cool",
  "cards.rarity.rarity_4": "4★",
  "cards.supply.term_limited": "Limited",
  "events.type.marathon": "Marathon",
  "events.type.unknown": "Unknown event",
  "gachas.type.ceil": "Ceil",
  "gachas.type.unknown": "Unknown gacha",
  "musicLibrary.difficulty.master": "Master",
  "musicLibrary.tags.vocaloid": "VOCALOID",
  "musicLibrary.categories.mv": "3D MV",
  "musicLibrary.vocalTypes.sekai": "SEKAI ver.",
  "gachaCatalog.type.gift": "Gift",
}

/** Mimics vue-i18n: `t` returns the key itself when no message exists. */
const ctx: SekaiLabelContext = {
  t: (key) => messages[key] ?? key,
  te: (key) => key in messages,
}

describe("resolveSekai*Label", () => {
  test("translates known enum members", () => {
    expect(resolveSekaiUnitLabel(ctx, "piapro")).toBe("VIRTUAL SINGER")
    expect(resolveSekaiAttrLabel(ctx, "cool")).toBe("Cool")
    expect(resolveSekaiRarityLabel(ctx, "rarity_4")).toBe("4★")
    expect(resolveSekaiSupplyLabel(ctx, "term_limited")).toBe("Limited")
    expect(resolveSekaiEventTypeLabel(ctx, "marathon")).toBe("Marathon")
    expect(resolveSekaiGachaTypeLabel(ctx, "ceil")).toBe("Ceil")
    expect(resolveSekaiDifficultyLabel(ctx, "master")).toBe("Master")
    expect(resolveSekaiMusicTagLabel(ctx, "vocaloid")).toBe("VOCALOID")
    expect(resolveSekaiMusicCategoryLabel(ctx, "mv")).toBe("3D MV")
    expect(resolveSekaiVocalTypeLabel(ctx, "sekai")).toBe("SEKAI ver.")
  })

  test("trims the value before looking it up", () => {
    expect(resolveSekaiAttrLabel(ctx, "  cool ")).toBe("Cool")
  })

  test("renders unknown members as the raw value, never the i18n key", () => {
    expect(resolveSekaiAttrLabel(ctx, "spicy")).toBe("spicy")
    expect(resolveSekaiUnitLabel(ctx, "new_unit")).toBe("new_unit")
    expect(resolveSekaiSupplyLabel(ctx, "mystery_limited")).toBe("mystery_limited")
    expect(resolveSekaiEventTypeLabel(ctx, "sprint")).toBe("sprint")
    expect(resolveSekaiGachaTypeLabel(ctx, "lucky")).toBe("lucky")
    expect(resolveSekaiDifficultyLabel(ctx, "ultra")).toBe("ultra")
    expect(resolveSekaiMusicTagLabel(ctx, "tag_x")).toBe("tag_x")
    expect(resolveSekaiMusicCategoryLabel(ctx, "cat_x")).toBe("cat_x")
    expect(resolveSekaiVocalTypeLabel(ctx, "vocal_x")).toBe("vocal_x")
    expect(resolveSekaiAttrLabel(ctx, "spicy")).not.toContain("cards.attr")
  })

  test("returns an empty string for empty values on plain enums", () => {
    for (const value of ["", "   ", null, undefined]) {
      expect(resolveSekaiUnitLabel(ctx, value)).toBe("")
      expect(resolveSekaiAttrLabel(ctx, value)).toBe("")
      expect(resolveSekaiRarityLabel(ctx, value)).toBe("")
      expect(resolveSekaiSupplyLabel(ctx, value)).toBe("")
      expect(resolveSekaiDifficultyLabel(ctx, value)).toBe("")
      expect(resolveSekaiMusicTagLabel(ctx, value)).toBe("")
      expect(resolveSekaiMusicCategoryLabel(ctx, value)).toBe("")
      expect(resolveSekaiVocalTypeLabel(ctx, value)).toBe("")
    }
  })

  test("falls back to the *.unknown label for empty event and gacha types", () => {
    for (const value of ["", null, undefined]) {
      expect(resolveSekaiEventTypeLabel(ctx, value)).toBe("Unknown event")
      expect(resolveSekaiGachaTypeLabel(ctx, value)).toBe("Unknown gacha")
    }
  })
})

describe("resolveSekaiEnumLabel", () => {
  test("translates known members under an arbitrary prefix", () => {
    expect(resolveSekaiEnumLabel(ctx, "gachaCatalog.type", "gift")).toBe("Gift")
  })

  test("prefers the explicit fallback over the raw value for unknown members", () => {
    expect(resolveSekaiEnumLabel(ctx, "gachaCatalog.type", "lucky", "Other")).toBe("Other")
    expect(resolveSekaiEnumLabel(ctx, "gachaCatalog.type", "lucky")).toBe("lucky")
  })

  test("uses the fallback (or an empty string) for empty values", () => {
    expect(resolveSekaiEnumLabel(ctx, "gachaCatalog.type", "", "Other")).toBe("Other")
    expect(resolveSekaiEnumLabel(ctx, "gachaCatalog.type", null)).toBe("")
  })
})
