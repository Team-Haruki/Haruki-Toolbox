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
    bannerCharacterUnitIdByEvent: new Map(),
    characterUnitsById: new Map(),
  }
}

describe("buildEventBoxMapFromCatalog", () => {
  const map = buildEventBoxMapFromCatalog(buildInput())

  it("falls back to the lowest-id 4-star event card without story metadata", () => {
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

  it("resolves the story's character-unit id instead of treating it as a character id", () => {
    const input = buildInput()
    input.bannerCharacterUnitIdByEvent = new Map([[1, 99]])
    input.characterUnitsById = new Map([[99, { gameCharacterId: 4 }]])
    const boxes = buildEventBoxMapFromCatalog(input)
    expect(boxes.get(1)).toEqual({ eventId: 1, characterId: 4, boxNumber: 1 })
    expect(boxes.get(2)).toEqual({ eventId: 2, characterId: 2, boxNumber: 1 })
  })

  it("keeps the card fallback for unresolved story banners", () => {
    const input = buildInput()
    input.bannerCharacterUnitIdByEvent = new Map([[1, 999], [2, 998]])
    input.characterUnitsById = new Map([[998, { gameCharacterId: 9999 }]])
    expect(buildEventBoxMapFromCatalog(input)).toEqual(map)
  })

  it("does not count World Link, mixed or missing-card events even with story banners", () => {
    const input = buildInput()
    input.bannerCharacterUnitIdByEvent = new Map([[3, 5], [5, 5], [7, 5]])
    input.characterUnitsById = new Map([[5, { gameCharacterId: 5 }]])
    expect(buildEventBoxMapFromCatalog(input)).toEqual(map)
  })

  it("keeps Sympathy as Shiho's fifth box without inflating Honami's later boxes", () => {
    // Reduced JP master records. Event 162 includes festival cards 1144/1145
    // before the actual event banner card 1146 (Shiho).
    const rows: [eventId: number, bannerCharacter: number, cards: [number, number][]][] = [
      [10, 3, [[155, 3]]],
      [20, 4, [[207, 4]]],
      [40, 3, [[313, 3]]],
      [50, 4, [[380, 4]]],
      [69, 4, [[493, 4]]],
      [83, 3, [[576, 3]]],
      [110, 4, [[773, 4]]],
      [121, 3, [[867, 3]]],
      [162, 4, [[1144, 3], [1145, 24], [1146, 4], [1147, 1], [1148, 21]]],
      [173, 3, [[1201, 3]]],
      [195, 4, [[1333, 4]]],
      [203, 3, [[1380, 3]]],
      [220, 3, [[1483, 3]]],
    ]
    const input = buildInput()
    input.events = rows.map(([id]) => ({ id, eventType: "marathon", startAt: id }))
    input.cardLinksByEvent = new Map(rows.map(([id, , cards]) => [id, cards.map(([cardId]) => ({ cardId }))]))
    input.cardsById = new Map(rows.flatMap(([, , cards]) => cards.map(([id, characterId]) => [
      id, { characterId, cardRarityType: "rarity_4" },
    ] as const)))
    input.bannerCharacterUnitIdByEvent = new Map(rows.map(([id, characterId]) => [id, characterId]))
    input.characterUnitsById = new Map([[3, { gameCharacterId: 3 }], [4, { gameCharacterId: 4 }]])

    const boxes = buildEventBoxMapFromCatalog(input)
    expect(boxes.get(162)).toEqual({ eventId: 162, characterId: 4, boxNumber: 5 })
    expect(boxes.get(195)).toEqual({ eventId: 195, characterId: 4, boxNumber: 6 })
    expect(boxes.get(173)).toEqual({ eventId: 173, characterId: 3, boxNumber: 5 })
    expect(boxes.get(203)).toEqual({ eventId: 203, characterId: 3, boxNumber: 6 })
    expect(boxes.get(220)).toEqual({ eventId: 220, characterId: 3, boxNumber: 7 })
  })

  it("handles empty indexes", () => {
    expect(buildEventBoxMapFromCatalog({
      events: [],
      cardLinksByEvent: new Map(),
      cardsById: new Map(),
      unitByCharacter: new Map(),
      bannerCharacterUnitIdByEvent: new Map(),
      characterUnitsById: new Map(),
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
