import { describe, expect, it } from "bun:test"
import {
  buildEventBoxMapFromCatalog,
  buildMusicEventBoxMapFromLinks,
  type EventBoxCatalogInput,
} from "./event-box"

const characters = [
  { id: 1, unit: "light_sound" },
  { id: 2, unit: "light_sound" },
  { id: 3, unit: "light_sound" },
  { id: 4, unit: "light_sound" },
  { id: 5, unit: "idol" },
  { id: 17, unit: "school_refusal" },
  { id: 21, unit: "piapro" },
  { id: 24, unit: "piapro" },
]

const cards = [
  // Event 1 cards: banner 4★ is the lowest 4★ cardId (109, chr 2); the VS
  // member (luka, 24) must not make the event count as mixed.
  { id: 109, characterId: 2, cardRarityType: "rarity_4" },
  { id: 110, characterId: 24, cardRarityType: "rarity_4" },
  { id: 111, characterId: 4, cardRarityType: "rarity_4" },
  { id: 112, characterId: 3, cardRarityType: "rarity_3" },
  { id: 113, characterId: 1, cardRarityType: "rarity_2" },
  // Event 2 banner: chr 2 again -> her second box.
  { id: 200, characterId: 2, cardRarityType: "rarity_4" },
  { id: 201, characterId: 1, cardRarityType: "rarity_4" },
  // Event 3 (world_bloom) cards.
  { id: 300, characterId: 5, cardRarityType: "rarity_4" },
  // Event 4 banner: chr 17.
  { id: 400, characterId: 17, cardRarityType: "rarity_4" },
  // Event 5 (mixed) cards span two non-VS units.
  { id: 500, characterId: 1, cardRarityType: "rarity_4" },
  { id: 501, characterId: 5, cardRarityType: "rarity_4" },
  // Event 6: pure VS event still counts as a box.
  { id: 600, characterId: 21, cardRarityType: "rarity_4" },
  // A card without a character never becomes a banner.
  { id: 700, characterId: null, cardRarityType: "rarity_4" },
]

const eventCards = [
  { eventId: 1, cardId: 109 },
  { eventId: 1, cardId: 110 },
  { eventId: 1, cardId: 111 },
  { eventId: 1, cardId: 112 },
  { eventId: 1, cardId: 113 },
  { eventId: 2, cardId: 200 },
  { eventId: 2, cardId: 201 },
  { eventId: 3, cardId: 300 },
  { eventId: 4, cardId: 400 },
  { eventId: 5, cardId: 500 },
  { eventId: 5, cardId: 501 },
  { eventId: 6, cardId: 600 },
  { eventId: 7, cardId: 700 },
  { eventId: 7, cardId: 9999 },
]

const events = [
  { id: 1, eventType: "marathon", startAt: 100 },
  { id: 2, eventType: "cheerful_carnival", startAt: 200 },
  { id: 3, eventType: "world_bloom", startAt: 300 },
  { id: 4, eventType: "marathon", startAt: 400 },
  { id: 5, eventType: "marathon", startAt: 500 },
  { id: 6, eventType: "marathon", startAt: 600 },
  { id: 7, eventType: "marathon", startAt: null },
]

function buildInput(): EventBoxCatalogInput {
  const cardLinksByEvent = new Map<number, { cardId: number }[]>()
  for (const link of eventCards) {
    const list = cardLinksByEvent.get(link.eventId) ?? []
    list.push({ cardId: link.cardId })
    cardLinksByEvent.set(link.eventId, list)
  }
  return {
    events,
    cardLinksByEvent,
    cardsById: new Map(cards.map((card) => [card.id, { characterId: card.characterId, cardRarityType: card.cardRarityType }])),
    unitByCharacter: new Map(characters.map((character) => [character.id, character.unit])),
  }
}

describe("buildEventBoxMapFromCatalog", () => {
  const map = buildEventBoxMapFromCatalog(buildInput())

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

  it("skips mixed events whose cards span multiple non-VS units", () => {
    expect(map.has(5)).toBe(false)
  })

  it("still counts pure VS events as boxes", () => {
    expect(map.get(6)).toEqual({ eventId: 6, characterId: 21, boxNumber: 1 })
  })

  it("ignores cards without a character and unknown card ids", () => {
    expect(map.has(7)).toBe(false)
  })

  it("handles empty indexes", () => {
    expect(buildEventBoxMapFromCatalog({
      events: [],
      cardLinksByEvent: new Map(),
      cardsById: new Map(),
      unitByCharacter: new Map(),
    }).size).toBe(0)
  })
})

describe("buildMusicEventBoxMapFromLinks", () => {
  const eventBoxMap = buildEventBoxMapFromCatalog(buildInput())

  it("maps each music to its earliest linked event's box info", () => {
    const map = buildMusicEventBoxMapFromLinks(
      new Map([
        [64, [2, 1]],
        [65, [4]],
        // Linked events without box info (world_bloom / mixed) contribute nothing.
        [66, [3]],
        [67, [5]],
      ]),
      eventBoxMap,
    )

    expect(map.get(64)).toEqual({ eventId: 1, characterId: 2, boxNumber: 1 })
    expect(map.get(65)).toEqual({ eventId: 4, characterId: 17, boxNumber: 1 })
    expect(map.has(66)).toBe(false)
    expect(map.has(67)).toBe(false)
  })

  it("returns an empty map without links", () => {
    expect(buildMusicEventBoxMapFromLinks(new Map(), eventBoxMap).size).toBe(0)
  })
})
