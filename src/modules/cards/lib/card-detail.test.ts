import { describe, expect, it } from "bun:test"
import { normalizeCatalogGachas } from "@/modules/gachas/lib/gacha-catalog"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  buildCardEventIndex,
  extractCardDetailExtras,
  resolveCardCostumeGroups,
  resolveCardEventSummaries,
  selectCardPickupGachas,
  selectSameCharacterCards,
} from "./card-detail"

function makeCard(overrides: Partial<CatalogMasterCard> = {}): CatalogMasterCard {
  return {
    id: 1,
    characterId: 1,
    cardRarityType: "rarity_3",
    attr: "cool",
    supportUnit: "none",
    prefix: "Prefix",
    assetbundleName: "res001_no001",
    releaseAt: 1000,
    skillId: 1,
    cardSupplyId: 1,
    ...overrides,
  }
}

describe("extractCardDetailExtras", () => {
  const rawCards = [
    { id: 1, cardSkillName: "Tiny flower", gachaPhrase: "-" },
    { id: 2, cardSkillName: "  ", gachaPhrase: "Let's go!" },
  ]

  it("extracts skill name and treats '-' as missing", () => {
    expect(extractCardDetailExtras(rawCards, 1)).toEqual({
      cardSkillName: "Tiny flower",
      gachaPhrase: null,
    })
  })

  it("extracts gacha phrase and drops blank skill names", () => {
    expect(extractCardDetailExtras(rawCards, 2)).toEqual({
      cardSkillName: null,
      gachaPhrase: "Let's go!",
    })
  })

  it("handles missing records", () => {
    expect(extractCardDetailExtras(rawCards, 99)).toEqual({ cardSkillName: null, gachaPhrase: null })
    expect(extractCardDetailExtras(undefined, 1)).toEqual({ cardSkillName: null, gachaPhrase: null })
  })
})

describe("card event lookup", () => {
  const rawEventCards = [
    { cardId: 109, eventId: 1 },
    { cardId: 110, eventId: 1 },
    { cardId: 109, eventId: 5 },
    { cardId: 109, eventId: 5 },
    { cardId: null, eventId: 2 },
  ]
  const rawEvents = [
    { id: 1, name: "First Star", assetbundleName: "event_first", startAt: 100, aggregateAt: 200 },
    { id: 5, name: "" },
  ]

  it("indexes event ids per card without duplicates", () => {
    const index = buildCardEventIndex(rawEventCards)
    expect(index.get(109)).toEqual([1, 5])
    expect(index.get(110)).toEqual([1])
    expect(index.has(2)).toBe(false)
  })

  it("resolves event summaries with id fallback names", () => {
    expect(resolveCardEventSummaries(rawEvents, [5, 1])).toEqual([
      { id: 1, name: "First Star", assetbundleName: "event_first", startAt: 100, aggregateAt: 200 },
      { id: 5, name: "#5", assetbundleName: null, startAt: null, aggregateAt: null },
    ])
    expect(resolveCardEventSummaries(rawEvents, [])).toEqual([])
  })
})

describe("selectCardPickupGachas", () => {
  const rawGachas = [
    {
      id: 2,
      name: "Later Gacha",
      startAt: 5_000_000_000_000,
      gachaPickups: [{ cardId: 109 }],
    },
    {
      id: 1,
      name: "Early Gacha",
      startAt: 4_000_000_000_000,
      gachaPickups: [{ cardId: 109 }, { cardId: 110 }],
    },
    {
      id: 3,
      name: "Unrelated Gacha",
      startAt: 6_000_000_000_000,
      gachaPickups: [{ cardId: 999 }],
    },
  ]

  const gachas = normalizeCatalogGachas(rawGachas)

  it("returns gachas picking up the card, ordered by start time", () => {
    expect(selectCardPickupGachas(gachas, 109).map((gacha) => gacha.id)).toEqual([1, 2])
    expect(selectCardPickupGachas(gachas, 110).map((gacha) => gacha.id)).toEqual([1])
  })

  it("returns an empty list for cards without pickups", () => {
    expect(selectCardPickupGachas(gachas, 42)).toEqual([])
    expect(selectCardPickupGachas([], 109)).toEqual([])
  })
})

describe("resolveCardCostumeGroups", () => {
  const rawCardCostume3ds = [
    { cardId: 4, costume3dId: 29001 },
    { cardId: 4, costume3dId: 29002 },
    { cardId: 5, costume3dId: 31001 },
  ]
  const rawCostume3ds = [
    { id: 29001, costume3dGroupId: 29, partType: "head", colorId: 1, colorName: "オリジナル", name: "トゥインクルサウンド", assetbundleName: "cos0029_unique_head" },
    { id: 29002, costume3dGroupId: 29, partType: "body", colorId: 1, colorName: "オリジナル", name: "トゥインクルサウンド", assetbundleName: "cos0029_body" },
    { id: 29004, costume3dGroupId: 29, partType: "body", colorId: 2, colorName: "アナザー1", name: "トゥインクルサウンド", assetbundleName: "cos0029_body_01" },
    { id: 31001, costume3dGroupId: 31, partType: "head", colorId: 1, colorName: "ノーマル", name: "ヘアアクセ", assetbundleName: "cos0031_head" },
  ]

  it("expands linked costumes into body color variants of the group", () => {
    const groups = resolveCardCostumeGroups(rawCardCostume3ds, rawCostume3ds, 4)
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe("トゥインクルサウンド")
    expect(groups[0].colors.map((color) => color.assetbundleName)).toEqual([
      "cos0029_body",
      "cos0029_body_01",
    ])
    expect(groups[0].colors.map((color) => color.colorName)).toEqual(["オリジナル", "アナザー1"])
    expect(groups[0].colors.every((color) => color.slot === "body")).toBe(true)
  })

  it("combines the same-color head with the body so they preview together", () => {
    const groups = resolveCardCostumeGroups(rawCardCostume3ds, rawCostume3ds, 4)
    const [first] = groups[0].colors
    // color 1 pairs body 29002 with its matching head 29001; color 2 has no head.
    expect(first).toMatchObject({
      costume3dId: 29002,
      bodyCostume3dId: 29002,
      headCostume3dId: 29001,
      hairCostume3dId: null,
    })
    expect(groups[0].colors[1].headCostume3dId).toBeNull()
  })

  it("only combines a limited (unique_head) hairstyle; a plain head uses the default", () => {
    // Group 60: body + a plain (non-unique) head — the head must NOT be combined,
    // so the body previews with the character's default head.
    const link = [{ cardId: 60, costume3dId: 60002 }]
    const costumes = [
      { id: 60002, costume3dGroupId: 60, partType: "body", colorId: 1, name: "外套", assetbundleName: "cos0060_body" },
      { id: 60001, costume3dGroupId: 60, partType: "head", colorId: 1, name: "外套", assetbundleName: "cos0060_head" },
    ]
    const groups = resolveCardCostumeGroups(link, costumes, 60)
    expect(groups[0].colors[0]).toMatchObject({ bodyCostume3dId: 60002, headCostume3dId: null })
  })

  it("falls back to non-body parts when the group has no body entries", () => {
    const groups = resolveCardCostumeGroups(rawCardCostume3ds, rawCostume3ds, 5)
    expect(groups).toHaveLength(1)
    expect(groups[0].colors.map((color) => color.assetbundleName)).toEqual(["cos0031_head"])
    // Accessories must keep their slot so the viewer does not force them into
    // the body slot of the engine recipe.
    expect(groups[0].colors[0].slot).toBe("head")
  })

  it("returns an empty list for unknown cards and malformed payloads", () => {
    expect(resolveCardCostumeGroups(rawCardCostume3ds, rawCostume3ds, 999)).toEqual([])
    expect(resolveCardCostumeGroups(null, undefined, 4)).toEqual([])
  })

  it("reconstructs blank thumbnails and leaves the name empty (Nuverse regions)", () => {
    // cn/tw/kr ship costume3ds.assetbundleName and name blank; the body group
    // must still expand into color variants with derived thumbnail names.
    const nuverseLink = [{ cardId: 7, costume3dId: 40002 }]
    const nuverseCostumes = [
      { id: 40002, costume3dGroupId: 40001, partType: "body", colorId: 1, colorName: "", name: "", assetbundleName: "" },
      { id: 40004, costume3dGroupId: 40001, partType: "body", colorId: 2, colorName: "", name: "", assetbundleName: "" },
      { id: 40001, costume3dGroupId: 40001, partType: "head", colorId: 1, colorName: "", name: "", assetbundleName: "cos0040_unique_head" },
    ]
    const groups = resolveCardCostumeGroups(nuverseLink, nuverseCostumes, 7)
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe("")
    expect(groups[0].colors.map((color) => color.assetbundleName)).toEqual([
      "cos0040_body",
      "cos0040_body_01",
    ])
    expect(groups[0].colors.every((color) => color.slot === "body")).toBe(true)
  })
})

describe("selectSameCharacterCards", () => {
  const cards = [
    makeCard({ id: 1, characterId: 1, releaseAt: 100 }),
    makeCard({ id: 2, characterId: 1, releaseAt: 300 }),
    makeCard({ id: 3, characterId: 2, releaseAt: 400 }),
    makeCard({ id: 4, characterId: 1, releaseAt: 200 }),
  ]

  it("returns other cards of the same character, newest first", () => {
    const result = selectSameCharacterCards(cards, cards[0])
    expect(result.map((card) => card.id)).toEqual([2, 4])
  })

  it("applies the limit and handles null characters", () => {
    expect(selectSameCharacterCards(cards, cards[0], 1).map((card) => card.id)).toEqual([2])
    expect(selectSameCharacterCards(cards, makeCard({ id: 9, characterId: null }))).toEqual([])
  })
})
