import { describe, expect, it } from "bun:test"
import { buildEventBoxMap, buildMusicEventBoxMap } from "./event-box"

const rawCards = [
  // Event 1 cards: banner 4★ is the lowest 4★ cardId (109, chr 2).
  { id: 109, characterId: 2, cardRarityType: "rarity_4" },
  { id: 110, characterId: 24, cardRarityType: "rarity_4" },
  { id: 111, characterId: 4, cardRarityType: "rarity_4" },
  { id: 112, characterId: 3, cardRarityType: "rarity_3" },
  { id: 113, characterId: 1, cardRarityType: "rarity_2" },
  // Event 2 banner: chr 2 again -> her second box.
  { id: 200, characterId: 2, cardRarityType: "rarity_4" },
  { id: 201, characterId: 17, cardRarityType: "rarity_4" },
  // Event 3 (world_bloom) cards.
  { id: 300, characterId: 5, cardRarityType: "rarity_4" },
  // Event 4 banner: chr 17.
  { id: 400, characterId: 17, cardRarityType: "rarity_4" },
]

const rawEventCards = [
  { eventId: 1, cardId: 109 },
  { eventId: 1, cardId: 110 },
  { eventId: 1, cardId: 111 },
  { eventId: 1, cardId: 112 },
  { eventId: 1, cardId: 113 },
  { eventId: 2, cardId: 200 },
  { eventId: 2, cardId: 201 },
  { eventId: 3, cardId: 300 },
  { eventId: 4, cardId: 400 },
]

const rawEvents = [
  { id: 1, eventType: "marathon", startAt: 100 },
  { id: 2, eventType: "cheerful_carnival", startAt: 200 },
  { id: 3, eventType: "world_bloom", startAt: 300 },
  { id: 4, eventType: "marathon", startAt: 400 },
]

describe("buildEventBoxMap", () => {
  const map = buildEventBoxMap(rawEvents, rawEventCards, rawCards)

  it("uses the lowest-id 4-star event card as the banner character", () => {
    expect(map.get(1)).toEqual({ eventId: 1, characterId: 2, boxNumber: 1 })
  })

  it("counts box numbers per character in startAt order", () => {
    expect(map.get(2)).toEqual({ eventId: 2, characterId: 2, boxNumber: 2 })
    expect(map.get(4)).toEqual({ eventId: 4, characterId: 17, boxNumber: 1 })
  })

  it("skips world_bloom events entirely", () => {
    expect(map.has(3)).toBe(false)
  })

  it("tolerates junk input", () => {
    expect(buildEventBoxMap(null, "x", 42).size).toBe(0)
  })
})

describe("buildMusicEventBoxMap", () => {
  const eventBoxMap = buildEventBoxMap(rawEvents, rawEventCards, rawCards)

  it("maps each music to its earliest linked event's box info", () => {
    const map = buildMusicEventBoxMap(
      [
        { eventId: 1, musicId: 64 },
        { eventId: 2, musicId: 64 },
        { eventId: 4, musicId: 65 },
        // Linked event without box info (world_bloom) contributes nothing.
        { eventId: 3, musicId: 66 },
      ],
      eventBoxMap,
    )

    expect(map.get(64)).toEqual({ eventId: 1, characterId: 2, boxNumber: 1 })
    expect(map.get(65)).toEqual({ eventId: 4, characterId: 17, boxNumber: 1 })
    expect(map.has(66)).toBe(false)
  })
})
