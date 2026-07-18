import { describe, expect, it } from "bun:test"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  buildCardSupplyTypeMap,
  cardMatchesQuery,
  cardMatchesUnit,
  collectCardReleaseYears,
  countCardPages,
  createDefaultCardFilters,
  filterCards,
  isCardUnreleased,
  paginateCards,
  resolveCardReleaseYear,
  resolveCardSupplyType,
  resolveCardUnit,
  sortCards,
} from "./card-filter"

function makeCard(overrides: Partial<CatalogMasterCard> = {}): CatalogMasterCard {
  return {
    id: 1,
    characterId: 1,
    cardRarityType: "rarity_4",
    attr: "cool",
    supportUnit: "none",
    prefix: "Prefix",
    assetbundleName: "res001_no001",
    releaseAt: Date.UTC(2023, 5, 1),
    skillId: 1,
    cardSupplyId: 1,
    ...overrides,
  }
}

function makeCharacter(overrides: Partial<CatalogCharacter> = {}): CatalogCharacter {
  return {
    id: 1,
    name: "Ichika",
    unit: "light_sound",
    iconUrl: "https://example.com/icon.png",
    ...overrides,
  }
}

const characterMap = new Map<number, CatalogCharacter>([
  [1, makeCharacter()],
  [21, makeCharacter({ id: 21, name: "Miku", unit: "piapro" })],
])

describe("card supply mapping", () => {
  const supplyTypeMap = buildCardSupplyTypeMap([
    { id: 1, cardSupplyType: "normal" },
    { id: 3, cardSupplyType: "term_limited" },
    { id: 4, cardSupplyType: "colorful_festival_limited" },
    { id: 99, cardSupplyType: "future_unknown_type" },
    { id: null, cardSupplyType: "normal" },
  ])

  it("maps supply ids to supply types", () => {
    expect(supplyTypeMap.get(3)).toBe("term_limited")
    expect(supplyTypeMap.has(0)).toBe(false)
  })

  it("resolves known supply types on cards", () => {
    expect(resolveCardSupplyType(makeCard({ cardSupplyId: 4 }), supplyTypeMap))
      .toBe("colorful_festival_limited")
  })

  it("returns null for unknown or missing supply ids", () => {
    expect(resolveCardSupplyType(makeCard({ cardSupplyId: null }), supplyTypeMap)).toBeNull()
    expect(resolveCardSupplyType(makeCard({ cardSupplyId: 77 }), supplyTypeMap)).toBeNull()
    expect(resolveCardSupplyType(makeCard({ cardSupplyId: 99 }), supplyTypeMap)).toBeNull()
  })
})

describe("card unit matching", () => {
  const vsSupportCard = makeCard({ id: 82, characterId: 21, supportUnit: "light_sound" })

  it("resolves the owning unit from the character", () => {
    expect(resolveCardUnit(makeCard(), characterMap)).toBe("light_sound")
    expect(resolveCardUnit(vsSupportCard, characterMap)).toBe("piapro")
    expect(resolveCardUnit(makeCard({ characterId: null }), characterMap)).toBeNull()
  })

  it("matches unit members", () => {
    expect(cardMatchesUnit(makeCard(), "light_sound", characterMap)).toBe(true)
    expect(cardMatchesUnit(makeCard(), "idol", characterMap)).toBe(false)
  })

  it("matches virtual singer support cards through supportUnit (bot semantics)", () => {
    expect(cardMatchesUnit(vsSupportCard, "light_sound", characterMap)).toBe(true)
    expect(cardMatchesUnit(vsSupportCard, "piapro", characterMap)).toBe(true)
    expect(cardMatchesUnit(vsSupportCard, "idol", characterMap)).toBe(false)
  })
})

describe("card query matching", () => {
  it("matches prefix case-insensitively and ignores blank queries", () => {
    const card = makeCard({ prefix: "Cool but Caring" })
    expect(cardMatchesQuery(card, "  ")).toBe(true)
    expect(cardMatchesQuery(card, "caring")).toBe(true)
    expect(cardMatchesQuery(card, "COOL BUT")).toBe(true)
    expect(cardMatchesQuery(card, "missing")).toBe(false)
    expect(cardMatchesQuery(makeCard({ prefix: null }), "x")).toBe(false)
  })
})

describe("release helpers", () => {
  it("resolves release years", () => {
    expect(resolveCardReleaseYear(null)).toBeNull()
    expect(resolveCardReleaseYear(new Date(2024, 3, 1).getTime())).toBe(2024)
  })

  it("collects distinct years sorted descending", () => {
    const years = collectCardReleaseYears([
      makeCard({ releaseAt: new Date(2021, 1, 1).getTime() }),
      makeCard({ id: 2, releaseAt: new Date(2024, 1, 1).getTime() }),
      makeCard({ id: 3, releaseAt: new Date(2021, 6, 1).getTime() }),
      makeCard({ id: 4, releaseAt: null }),
    ])
    expect(years).toEqual([2024, 2021])
  })

  it("flags unreleased cards", () => {
    const now = Date.UTC(2026, 0, 1)
    expect(isCardUnreleased(now + 1000, now)).toBe(true)
    expect(isCardUnreleased(now - 1000, now)).toBe(false)
    expect(isCardUnreleased(null, now)).toBe(false)
  })
})

describe("filterCards", () => {
  const supplyTypeMap = buildCardSupplyTypeMap([
    { id: 1, cardSupplyType: "normal" },
    { id: 3, cardSupplyType: "term_limited" },
  ])
  const context = { characterMap, supplyTypeMap }
  const cards = [
    makeCard({ id: 1, prefix: "Morning Star", attr: "cool", cardSupplyId: 1 }),
    makeCard({
      id: 82,
      characterId: 21,
      supportUnit: "light_sound",
      attr: "cute",
      cardRarityType: "rarity_birthday",
      prefix: "Classroom Sekai",
      cardSupplyId: 3,
      releaseAt: Date.UTC(2024, 0, 10),
    }),
    makeCard({
      id: 200,
      characterId: 21,
      attr: "mysterious",
      cardRarityType: "rarity_2",
      prefix: "Miku Solo",
      cardSupplyId: null,
      releaseAt: Date.UTC(2025, 0, 10),
    }),
  ]

  it("passes everything with default filters", () => {
    expect(filterCards(cards, createDefaultCardFilters(), context)).toHaveLength(3)
  })

  it("filters by character", () => {
    const filters = { ...createDefaultCardFilters(), characterIds: [21] }
    expect(filterCards(cards, filters, context).map((card) => card.id)).toEqual([82, 200])
  })

  it("filters by unit including VS support cards", () => {
    const filters = { ...createDefaultCardFilters(), units: ["light_sound" as const] }
    expect(filterCards(cards, filters, context).map((card) => card.id)).toEqual([1, 82])
  })

  it("filters by attr, rarity, supply type and year", () => {
    const context2 = { characterMap, supplyTypeMap }
    expect(filterCards(cards, { ...createDefaultCardFilters(), attrs: ["cute"] }, context2)
      .map((card) => card.id)).toEqual([82])
    expect(filterCards(cards, { ...createDefaultCardFilters(), rarities: ["rarity_2"] }, context2)
      .map((card) => card.id)).toEqual([200])
    expect(filterCards(cards, { ...createDefaultCardFilters(), supplyTypes: ["term_limited"] }, context2)
      .map((card) => card.id)).toEqual([82])
    const year = new Date(Date.UTC(2025, 0, 10)).getFullYear()
    expect(filterCards(cards, { ...createDefaultCardFilters(), year }, context2)
      .map((card) => card.id)).toEqual([200])
  })

  it("filters by prefix query", () => {
    const filters = { ...createDefaultCardFilters(), query: "sekai" }
    expect(filterCards(cards, filters, context).map((card) => card.id)).toEqual([82])
  })
})

describe("sortCards", () => {
  const cards = [
    makeCard({ id: 5, cardRarityType: "rarity_2", releaseAt: 3000 }),
    makeCard({ id: 9, cardRarityType: "rarity_4", releaseAt: 1000 }),
    makeCard({ id: 2, cardRarityType: "rarity_birthday", releaseAt: 2000 }),
    makeCard({ id: 7, cardRarityType: "rarity_3", releaseAt: null }),
  ]

  it("sorts by release date descending with null release last", () => {
    expect(sortCards(cards, "releaseDesc").map((card) => card.id)).toEqual([5, 2, 9, 7])
  })

  it("sorts by rarity descending with release as tiebreak", () => {
    expect(sortCards(cards, "rarityDesc").map((card) => card.id)).toEqual([9, 7, 5, 2])
  })

  it("sorts by id ascending", () => {
    expect(sortCards(cards, "idAsc").map((card) => card.id)).toEqual([2, 5, 7, 9])
  })

  it("does not mutate the input", () => {
    const input = [...cards]
    sortCards(input, "idAsc")
    expect(input.map((card) => card.id)).toEqual([5, 9, 2, 7])
  })
})

describe("pagination", () => {
  const items = Array.from({ length: 130 }, (_, index) => index + 1)

  it("counts pages", () => {
    expect(countCardPages(0, 60)).toBe(1)
    expect(countCardPages(60, 60)).toBe(1)
    expect(countCardPages(61, 60)).toBe(2)
    expect(countCardPages(130, 60)).toBe(3)
  })

  it("slices pages and clamps out-of-range pages", () => {
    expect(paginateCards(items, 1, 60)).toHaveLength(60)
    expect(paginateCards(items, 3, 60)).toHaveLength(10)
    expect(paginateCards(items, 99, 60)).toHaveLength(10)
    expect(paginateCards(items, 0, 60)[0]).toBe(1)
  })
})
