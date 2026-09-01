import { describe, expect, it } from "bun:test"
import type { CardPowerTable } from "@/modules/cards/composables/useCardsIndex"
import {
  buildCardDetailExtras,
  buildCardMaxPowerMap,
  resolveCardLevelCap,
  resolveCardMaxPower,
  resolveCardPower,
} from "./card-power"

const table: CardPowerTable = {
  maxLevel: 4,
  p1: [100, 110, 120, 130],
  p2: [200, 210, 220, 230],
  p3: [300, 310, 320, 330],
}

const extras = { specialTrainingPowerBonus: { p1: 10, p2: 20, p3: 30 } }
const episodes = [{ p1: 1, p2: 1, p3: 1 }, { p1: 2, p2: 2, p3: 2 }]
const masterLessons = [{ p1: 5, p2: 5, p3: 5 }, { p1: 5, p2: 5, p3: 5 }, { p1: 5, p2: 5, p3: 5 }]
const canvas = { p1: 7, p2: 7, p3: 7 }

describe("resolveCardPower", () => {
  it("reads the base value for the level", () => {
    const power = resolveCardPower(table, {
      level: 2, trained: false, episodes: [false, false], masterRank: 0, canvas: false,
    }, extras, episodes, masterLessons, canvas)
    expect(power).toEqual({ p1: 110, p2: 210, p3: 310, total: 630 })
  })

  it("adds training, episodes, master rank and canvas bonuses", () => {
    const power = resolveCardPower(table, {
      level: 4, trained: true, episodes: [true, true], masterRank: 2, canvas: true,
    }, extras, episodes, masterLessons, canvas)
    expect(power.p1).toBe(130 + 10 + 3 + 10 + 7)
    expect(power.p2).toBe(230 + 20 + 3 + 10 + 7)
    expect(power.p3).toBe(330 + 30 + 3 + 10 + 7)
    expect(power.total).toBe(power.p1 + power.p2 + power.p3)
  })

  it("clamps the level and master rank into range", () => {
    const low = resolveCardPower(table, {
      level: 0, trained: false, episodes: [], masterRank: -1, canvas: false,
    }, null, [], masterLessons, null)
    expect(low).toEqual({ p1: 100, p2: 200, p3: 300, total: 600 })
    const high = resolveCardPower(table, {
      level: 99, trained: false, episodes: [], masterRank: 99, canvas: false,
    }, null, [], masterLessons, null)
    expect(high).toEqual({ p1: 145, p2: 245, p3: 345, total: 735 })
  })

  it("returns zero without a power table", () => {
    const power = resolveCardPower(null, {
      level: 1, trained: true, episodes: [true], masterRank: 1, canvas: true,
    }, extras, episodes, masterLessons, canvas)
    expect(power).toEqual({ p1: 23, p2: 33, p3: 43, total: 99 })
  })
})

describe("level caps and max power", () => {
  const rarity4 = { cardRarityType: "rarity_4", maxLevel: 50, trainingMaxLevel: 60, maxSkillLevel: 4 }
  const rarity2 = { cardRarityType: "rarity_2", maxLevel: 30, trainingMaxLevel: null, maxSkillLevel: 4 }
  const bigTable: CardPowerTable = { maxLevel: 60, p1: [], p2: [], p3: [] }

  it("uses the trained cap only when trained", () => {
    expect(resolveCardLevelCap(rarity4, bigTable, false)).toBe(50)
    expect(resolveCardLevelCap(rarity4, bigTable, true)).toBe(60)
    expect(resolveCardLevelCap(rarity2, { ...bigTable, maxLevel: 30 }, true)).toBe(30)
  })

  it("never exceeds the table and degrades without rarity info", () => {
    expect(resolveCardLevelCap(rarity4, { ...bigTable, maxLevel: 40 }, true)).toBe(40)
    expect(resolveCardLevelCap(null, bigTable, true)).toBe(60)
    expect(resolveCardLevelCap(null, null, false)).toBe(1)
  })

  it("sums the highest level for the power sort", () => {
    expect(resolveCardMaxPower(table)).toBe(130 + 230 + 330)
    expect(resolveCardMaxPower(null)).toBeNull()
    expect(resolveCardMaxPower({ maxLevel: 0, p1: [], p2: [], p3: [] })).toBeNull()
    const map = buildCardMaxPowerMap(new Map([[1, table], [2, { maxLevel: 0, p1: [], p2: [], p3: [] }]]))
    expect([...map.entries()]).toEqual([[1, 690]])
  })
})

describe("buildCardDetailExtras", () => {
  const extras = buildCardDetailExtras({
    cardEpisodes: [
      { id: 2, seq: 2, cardId: 1, title: "後編", cardEpisodePartType: "second_part", power1BonusFixed: 200, power2BonusFixed: 200, power3BonusFixed: 200, costs: [{ resourceId: 2, resourceType: "material", quantity: 50 }] },
      { id: 1, seq: 1, cardId: 1, title: "前編", cardEpisodePartType: "first_part", power1BonusFixed: 100, power2BonusFixed: 100, power3BonusFixed: 100, costs: [{ resourceId: 2, resourceType: "material", quantity: 10 }, { quantity: 0 }] },
      { id: 3, seq: 1, cardId: null, title: "orphan" },
    ],
    cardRarities: [
      { cardRarityType: "rarity_4", seq: 500, maxLevel: 50, trainingMaxLevel: 60, maxSkillLevel: 4 },
      { cardRarityType: "rarity_1", seq: 100, maxLevel: 20 },
      { cardRarityType: "", maxLevel: 1 },
    ],
    masterLessons: [
      { cardRarityType: "rarity_4", masterRank: 2, power1BonusFixed: 200, power2BonusFixed: 200, power3BonusFixed: 200 },
      { cardRarityType: "rarity_4", masterRank: 1, power1BonusFixed: 200, power2BonusFixed: 200, power3BonusFixed: 200 },
      { cardRarityType: "rarity_4", masterRank: 0 },
    ],
    cardMysekaiCanvasBonuses: [
      { id: 5, cardRarityType: "rarity_4", power1BonusFixed: 500, power2BonusFixed: 500, power3BonusFixed: 500 },
    ],
  })

  it("groups and orders episodes per card", () => {
    const rows = extras.episodesByCard.get(1) ?? []
    expect(rows.map((row) => row.partType)).toEqual(["first_part", "second_part"])
    expect(rows[0].bonus).toEqual({ p1: 100, p2: 100, p3: 100 })
    expect(rows[0].costs).toEqual([{ resourceType: "material", resourceId: 2, quantity: 10 }])
    expect(extras.episodesByCard.size).toBe(1)
  })

  it("normalizes rarity caps", () => {
    expect(extras.raritiesByType.get("rarity_4")).toEqual({
      cardRarityType: "rarity_4", maxLevel: 50, trainingMaxLevel: 60, maxSkillLevel: 4,
    })
    expect(extras.raritiesByType.get("rarity_1")?.trainingMaxLevel).toBeNull()
    expect(extras.raritiesByType.has("")).toBe(false)
  })

  it("orders master lessons by rank and keeps canvas bonuses per rarity", () => {
    expect(extras.masterLessonsByRarity.get("rarity_4")).toHaveLength(2)
    expect(extras.canvasBonusByRarity.get("rarity_4")).toEqual({ p1: 500, p2: 500, p3: 500 })
  })
})
