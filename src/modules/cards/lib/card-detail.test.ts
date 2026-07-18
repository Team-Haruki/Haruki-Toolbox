import { describe, expect, it } from "bun:test"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  buildCardEventIndex,
  extractCardDetailExtras,
  resolveCardEventSummaries,
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
    { id: 1, name: "First Star" },
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
      { id: 1, name: "First Star" },
      { id: 5, name: "#5" },
    ])
    expect(resolveCardEventSummaries(rawEvents, [])).toEqual([])
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
