import { describe, expect, it } from "bun:test"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import type { CatalogGacha } from "./gacha-catalog"
import {
  buildGachaPickupCards,
  buildGachaPoolCards,
  collectGachaPoolCharacterIds,
  collectGachaPoolRarities,
  filterGachaPoolCards,
  groupGachaPoolByRarity,
} from "./gacha-pool"

function card(id: number, rarity: string, characterId: number, prefix: string, releaseAt: number | null = 0): CatalogMasterCard {
  return {
    id,
    characterId,
    cardRarityType: rarity,
    attr: "cute",
    supportUnit: "none",
    prefix,
    assetbundleName: `res${id}`,
    releaseAt,
    skillId: null,
    cardSupplyId: null,
    skillName: null,
    trainedByDefault: false,
  }
}

const cardsById = new Map<number, CatalogMasterCard>([
  [1, card(1, "rarity_2", 1, "Two A")],
  [2, card(2, "rarity_3", 2, "Three B")],
  [3, card(3, "rarity_4", 1, "Four C")],
  [4, card(4, "rarity_4", 3, "Four D", Date.UTC(2099, 0, 1))],
])

const characterMap = new Map<number, CatalogCharacter>([
  [1, { id: 1, name: "Ichika", unit: "light_sound", iconUrl: "" }],
  [2, { id: 2, name: "Saki", unit: "light_sound", iconUrl: "" }],
  [3, { id: 3, name: "Honami", unit: "light_sound", iconUrl: "" }],
])

const gacha: Pick<CatalogGacha, "details" | "pickups"> = {
  details: [
    { cardId: 1, weight: 1, isWish: false },
    { cardId: 2, weight: 1, isWish: false },
    { cardId: 3, weight: 1, isWish: true },
    { cardId: 4, weight: 1, isWish: true },
    { cardId: 4, weight: 1, isWish: true },
    { cardId: 99, weight: 1, isWish: false },
  ],
  pickups: [
    { cardId: 4, gachaPickupType: "normal" },
    { cardId: 4, gachaPickupType: "normal" },
    { cardId: 3, gachaPickupType: "normal" },
    { cardId: 99, gachaPickupType: "normal" },
  ],
}

const cardRates = new Map<number, number>([
  [3, 0.01],
  [4, 0.02],
])

const pool = buildGachaPoolCards(gacha, cardsById, characterMap, cardRates, Date.UTC(2024, 0, 1))

describe("buildGachaPoolCards", () => {
  it("dedups, drops unknown cards and orders pickups → rarity → id desc", () => {
    expect(pool.map((entry) => entry.card.id)).toEqual([4, 3, 2, 1])
    expect(pool[0]?.isPickup).toBe(true)
    expect(pool[0]?.isWish).toBe(true)
    expect(pool[0]?.unreleased).toBe(true)
    expect(pool[2]?.isPickup).toBe(false)
    expect(pool[3]?.characterName).toBe("Ichika")
  })

  it("carries the per-card rates it is given", () => {
    expect(pool[0]?.rate).toBe(0.02)
    expect(pool[1]?.rate).toBe(0.01)
    expect(pool[2]?.rate).toBeNull()
    expect(buildGachaPoolCards(gacha, cardsById, characterMap, null, 0)[0]?.rate).toBeNull()
  })
})

describe("buildGachaPickupCards", () => {
  it("keeps master-data order, dedups and skips unknown cards", () => {
    const pickups = buildGachaPickupCards(gacha, cardsById, characterMap, cardRates, Date.UTC(2024, 0, 1))
    expect(pickups.map((entry) => entry.card.id)).toEqual([4, 3])
    expect(pickups.every((entry) => entry.isPickup)).toBe(true)
    expect(pickups[1]?.rate).toBe(0.01)
  })
})

describe("filterGachaPoolCards", () => {
  it("filters by character, rarity and search text", () => {
    expect(filterGachaPoolCards(pool, { query: "", characterIds: [1], rarities: [] }).map((entry) => entry.card.id)).toEqual([3, 1])
    expect(filterGachaPoolCards(pool, { query: "", characterIds: [], rarities: ["rarity_4"] }).map((entry) => entry.card.id)).toEqual([4, 3])
    expect(filterGachaPoolCards(pool, { query: "saki", characterIds: [], rarities: [] }).map((entry) => entry.card.id)).toEqual([2])
    expect(filterGachaPoolCards(pool, { query: "#1", characterIds: [], rarities: [] }).map((entry) => entry.card.id)).toEqual([1])
  })
})

describe("grouping and option collection", () => {
  it("groups by rarity highest first", () => {
    const groups = groupGachaPoolByRarity(pool)
    expect(groups.map((group) => `${group.rarity}:${group.cards.length}`)).toEqual(["rarity_4:2", "rarity_3:1", "rarity_2:1"])
  })

  it("collects characters and rarities present", () => {
    expect(collectGachaPoolCharacterIds(pool)).toEqual([1, 2, 3])
    expect(collectGachaPoolRarities(pool)).toEqual(["rarity_4", "rarity_3", "rarity_2"])
  })
})
