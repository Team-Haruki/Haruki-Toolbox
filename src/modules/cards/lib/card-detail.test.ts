import { describe, expect, it } from "bun:test"
import type { EventCardLink, SekaiEventItem } from "@/modules/events"
import type { CatalogGachaSummary } from "@/modules/gachas"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  resolveCardCostumeGroups,
  selectCardRelatedEvents,
  selectCardRelatedGachas,
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

function makeEvent(overrides: Partial<SekaiEventItem> = {}): SekaiEventItem {
  return {
    id: 1,
    name: "Event",
    eventType: "marathon",
    assetbundleName: "event_1",
    unit: null,
    startAt: 100,
    aggregateAt: 200,
    closedAt: 300,
    ...overrides,
  }
}

describe("selectCardRelatedEvents", () => {
  const eventsById = new Map<number, SekaiEventItem>([
    [1, makeEvent({ id: 1, startAt: 100 })],
    [5, makeEvent({ id: 5, startAt: 500 })],
  ])
  const links = new Map<number, EventCardLink[]>([
    [109, [
      { eventId: 1, cardId: 109, bonusRate: 25, leaderBonusRate: null, isDisplayCardStory: true },
      { eventId: 5, cardId: 109, bonusRate: 20, leaderBonusRate: 5, isDisplayCardStory: false },
      { eventId: 5, cardId: 109, bonusRate: 20, leaderBonusRate: 5, isDisplayCardStory: false },
      { eventId: 999, cardId: 109, bonusRate: null, leaderBonusRate: null, isDisplayCardStory: false },
    ]],
  ])

  it("resolves linked events newest first with their bonus rates", () => {
    const rows = selectCardRelatedEvents(109, links, eventsById)
    expect(rows.map((row) => row.event.id)).toEqual([5, 1])
    expect(rows[0]).toMatchObject({ bonusRate: 20, leaderBonusRate: 5, hasStory: false })
    expect(rows[1]).toMatchObject({ bonusRate: 25, leaderBonusRate: null, hasStory: true })
  })

  it("returns nothing for cards without links", () => {
    expect(selectCardRelatedEvents(42, links, eventsById)).toEqual([])
  })
})

describe("selectCardRelatedGachas", () => {
  const summary = (id: number, startAt: number): CatalogGachaSummary => ({
    id,
    gachaType: "ceil",
    name: `Gacha ${id}`,
    seq: id,
    assetbundleName: "",
    startAt,
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
  const gachasById = new Map<number, CatalogGachaSummary>([
    [2, summary(2, 5_000)],
    [1, summary(1, 4_000)],
  ])
  const gachaIdsByPickupCard = new Map<number, number[]>([[109, [2, 1, 77]]])

  it("returns the pickup gachas ordered by start time", () => {
    expect(selectCardRelatedGachas(109, gachaIdsByPickupCard, gachasById).map((gacha) => gacha.id)).toEqual([1, 2])
  })

  it("returns an empty list for cards without pickups", () => {
    expect(selectCardRelatedGachas(42, gachaIdsByPickupCard, gachasById)).toEqual([])
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
