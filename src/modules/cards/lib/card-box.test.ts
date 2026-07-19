import { describe, expect, it } from "bun:test"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  applyOwnershipFilter,
  buildAttrDistribution,
  buildCharacterDistribution,
  buildOwnedCardMap,
  computeCollectionPercent,
  filterReleasedCards,
  groupCardsByAttr,
  groupCardsByCharacter,
  isCardTrained,
  normalizeUserCards,
  summarizeCollection,
} from "./card-box"

const NOW = Date.UTC(2026, 0, 1)

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

function makeUserCard(cardId: number, overrides: Record<string, unknown> = {}) {
  return {
    cardId,
    level: 50,
    exp: 100,
    totalExp: 100,
    masterRank: 0,
    skillLevel: 1,
    specialTrainingStatus: "not_doing",
    defaultImage: "original",
    duplicateCount: 0,
    createdAt: Date.UTC(2024, 0, 1),
    episodes: [
      { cardEpisodeId: cardId * 10, scenarioStatus: "already_read", isNotSkipped: true },
    ],
    ...overrides,
  }
}

describe("normalizeUserCards", () => {
  it("parses real-shaped suite records", () => {
    const records = normalizeUserCards([
      makeUserCard(101, { masterRank: 3, specialTrainingStatus: "done" }),
      makeUserCard(102),
    ])

    expect(records).toHaveLength(2)
    expect(records[0]).toEqual({
      cardId: 101,
      level: 50,
      masterRank: 3,
      skillLevel: 1,
      specialTrainingStatus: "done",
      defaultImage: "original",
    })
  })

  it("tolerates junk input", () => {
    expect(normalizeUserCards(null)).toEqual([])
    expect(normalizeUserCards("nope")).toEqual([])
    expect(normalizeUserCards({ cardId: 1 })).toEqual([])
    expect(normalizeUserCards([null, 42, "x", { level: 3 }, { cardId: "abc" }])).toEqual([])
  })

  it("fills defaults for missing fields", () => {
    const [record] = normalizeUserCards([{ cardId: 7 }])
    expect(record).toEqual({
      cardId: 7,
      level: 0,
      masterRank: 0,
      skillLevel: 0,
      specialTrainingStatus: "",
      defaultImage: "",
    })
  })
})

describe("buildOwnedCardMap / isCardTrained", () => {
  it("maps records by cardId and dedupes", () => {
    const map = buildOwnedCardMap(normalizeUserCards([
      makeUserCard(1, { level: 10 }),
      makeUserCard(1, { level: 20 }),
      makeUserCard(2),
    ]))

    expect(map.size).toBe(2)
    expect(map.get(1)?.level).toBe(20)
  })

  it("only treats specialTrainingStatus done as trained", () => {
    expect(isCardTrained({ specialTrainingStatus: "done" })).toBe(true)
    expect(isCardTrained({ specialTrainingStatus: "not_doing" })).toBe(false)
    expect(isCardTrained({ specialTrainingStatus: "" })).toBe(false)
  })
})

describe("filterReleasedCards", () => {
  it("drops cards released after now and keeps unknown release dates", () => {
    const released = makeCard({ id: 1, releaseAt: NOW - 1000 })
    const boundary = makeCard({ id: 2, releaseAt: NOW })
    const future = makeCard({ id: 3, releaseAt: NOW + 1000 })
    const unknown = makeCard({ id: 4, releaseAt: null })

    expect(filterReleasedCards([released, boundary, future, unknown], NOW).map((card) => card.id))
      .toEqual([1, 2, 4])
  })
})

describe("applyOwnershipFilter", () => {
  const cards = [makeCard({ id: 1 }), makeCard({ id: 2 }), makeCard({ id: 3 })]
  const ownedMap = buildOwnedCardMap(normalizeUserCards([makeUserCard(1), makeUserCard(3)]))

  it("returns everything for all", () => {
    expect(applyOwnershipFilter(cards, ownedMap, "all").map((card) => card.id)).toEqual([1, 2, 3])
  })

  it("returns owned cards only", () => {
    expect(applyOwnershipFilter(cards, ownedMap, "owned").map((card) => card.id)).toEqual([1, 3])
  })

  it("returns missing cards via reverse lookup", () => {
    expect(applyOwnershipFilter(cards, ownedMap, "missing").map((card) => card.id)).toEqual([2])
  })
})

describe("groupCardsByCharacter", () => {
  const cards = [
    makeCard({ id: 1, characterId: 2 }),
    makeCard({ id: 2, characterId: 1 }),
    makeCard({ id: 3, characterId: 2 }),
    makeCard({ id: 4, characterId: null }),
  ]
  const ownedMap = buildOwnedCardMap(normalizeUserCards([makeUserCard(1), makeUserCard(3)]))

  it("builds sections sorted by characterId with owned counts", () => {
    const groups = groupCardsByCharacter(cards, ownedMap)
    expect(groups.map((group) => group.key)).toEqual([0, 1, 2])
    const charTwo = groups.find((group) => group.key === 2)
    expect(charTwo?.cards.map((card) => card.id)).toEqual([1, 3])
    expect(charTwo?.owned).toBe(2)
    expect(charTwo?.total).toBe(2)
    expect(groups.find((group) => group.key === 1)?.owned).toBe(0)
  })

  it("does not crash when userCards reference cardIds missing from masterdata", () => {
    const staleOwned = buildOwnedCardMap(normalizeUserCards([makeUserCard(99999)]))
    const groups = groupCardsByCharacter(cards, staleOwned)
    expect(groups.reduce((sum, group) => sum + group.owned, 0)).toBe(0)
    expect(groups.reduce((sum, group) => sum + group.total, 0)).toBe(4)
  })
})

describe("groupCardsByAttr", () => {
  it("orders sections by canonical attr order with unknown attrs last", () => {
    const cards = [
      makeCard({ id: 1, attr: "mysterious" }),
      makeCard({ id: 2, attr: "cute" }),
      makeCard({ id: 3, attr: "weird_future_attr" }),
      makeCard({ id: 4, attr: "cute" }),
    ]
    const groups = groupCardsByAttr(cards, new Map())
    expect(groups.map((group) => group.key)).toEqual(["cute", "mysterious", "weird_future_attr"])
    expect(groups[0]?.total).toBe(2)
  })
})

describe("buildCharacterDistribution", () => {
  const cards = [
    makeCard({ id: 1, characterId: 1, cardRarityType: "rarity_1" }),
    makeCard({ id: 2, characterId: 1, cardRarityType: "rarity_4" }),
    makeCard({ id: 3, characterId: 1, cardRarityType: "rarity_4" }),
    makeCard({ id: 4, characterId: 1, cardRarityType: "rarity_birthday" }),
    makeCard({ id: 5, characterId: 2, cardRarityType: "rarity_2" }),
  ]
  const ownedMap = buildOwnedCardMap(normalizeUserCards([
    makeUserCard(1),
    makeUserCard(2),
    makeUserCard(4),
    makeUserCard(424242),
  ]))

  it("computes per-character totals, percent and rarity buckets", () => {
    const rows = buildCharacterDistribution(cards, ownedMap)
    expect(rows.map((row) => row.characterId)).toEqual([1, 2])

    const first = rows[0]!
    expect(first.owned).toBe(3)
    expect(first.total).toBe(4)
    expect(first.percent).toBe(75)
    expect(first.rarityBuckets.rarity_1).toEqual({ owned: 1, total: 1 })
    expect(first.rarityBuckets.rarity_4).toEqual({ owned: 1, total: 2 })
    expect(first.rarityBuckets.rarity_birthday).toEqual({ owned: 1, total: 1 })
    expect(first.rarityBuckets.rarity_2).toEqual({ owned: 0, total: 0 })
    expect(first.rarityBuckets.rarity_3).toEqual({ owned: 0, total: 0 })

    const second = rows[1]!
    expect(second.owned).toBe(0)
    expect(second.percent).toBe(0)
  })

  it("ignores unknown rarity types without crashing", () => {
    const rows = buildCharacterDistribution([
      makeCard({ id: 9, characterId: 3, cardRarityType: "rarity_5_future" }),
    ], ownedMap)
    expect(rows[0]?.total).toBe(1)
    expect(rows[0]?.rarityBuckets.rarity_4.total).toBe(0)
  })
})

describe("buildAttrDistribution / summarizeCollection", () => {
  const cards = [
    makeCard({ id: 1, attr: "cool" }),
    makeCard({ id: 2, attr: "cool" }),
    makeCard({ id: 3, attr: "happy" }),
  ]
  const ownedMap = buildOwnedCardMap(normalizeUserCards([makeUserCard(2), makeUserCard(31337)]))

  it("computes per-attribute rows in canonical order", () => {
    const rows = buildAttrDistribution(cards, ownedMap)
    expect(rows.map((row) => row.attr)).toEqual(["cool", "happy"])
    expect(rows[0]).toEqual({ attr: "cool", owned: 1, total: 2, percent: 50 })
    expect(rows[1]).toEqual({ attr: "happy", owned: 0, total: 1, percent: 0 })
  })

  it("summarizes the overall collection", () => {
    expect(summarizeCollection(cards, ownedMap)).toEqual({ owned: 1, total: 3, percent: 33.3 })
    expect(summarizeCollection([], ownedMap)).toEqual({ owned: 0, total: 0, percent: 0 })
  })
})

describe("computeCollectionPercent", () => {
  it("rounds to one decimal and guards zero totals", () => {
    expect(computeCollectionPercent(1, 3)).toBe(33.3)
    expect(computeCollectionPercent(2, 3)).toBe(66.7)
    expect(computeCollectionPercent(0, 0)).toBe(0)
    expect(computeCollectionPercent(5, 5)).toBe(100)
  })
})
