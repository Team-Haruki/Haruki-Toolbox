import { describe, expect, test } from "bun:test"
import { buildEventsIndex } from "./useEventsIndex"

const DAY = 24 * 60 * 60 * 1000
const BASE = Date.UTC(2024, 0, 1)

// Trimmed `events.json` rows. Event 1 carries jp-shaped reward ranges plus
// one Nuverse-shaped range (no id / eventId / isToRankBorder); event 3 ships
// an empty range list; the trailing rows are junk that must be skipped.
const EVENTS = [
  {
    id: 1,
    name: "First",
    eventType: "marathon",
    assetbundleName: "event_1",
    unit: "none",
    startAt: BASE,
    aggregateAt: BASE + 7 * DAY,
    closedAt: BASE + 8 * DAY,
    eventRankingRewardRanges: [
      { id: 12, eventId: 1, fromRank: 2, toRank: 2, isToRankBorder: false, eventRankingRewards: [{ id: 2, resourceBoxId: 202 }] },
      { id: 11, eventId: 1, fromRank: 1, toRank: 1, isToRankBorder: false, eventRankingRewards: [{ id: 1, resourceBoxId: 201 }, { id: 3, resourceBoxId: 201 }] },
      { fromRank: 3, toRank: 10, eventRankingRewards: [{ resourceBoxId: 203 }] },
      { id: 14, eventId: 1, fromRank: 20, toRank: 11, eventRankingRewards: [{ resourceBoxId: 204 }] },
    ],
  },
  {
    id: 2,
    name: "Second",
    eventType: "cheerful_carnival",
    assetbundleName: "event_2",
    unit: "theme_park",
    startAt: BASE + 30 * DAY,
    aggregateAt: BASE + 37 * DAY,
    closedAt: BASE + 38 * DAY,
  },
  {
    id: 3,
    name: "Third",
    eventType: "world_bloom",
    assetbundleName: "event_3",
    unit: "school_refusal",
    startAt: BASE + 60 * DAY,
    aggregateAt: BASE + 67 * DAY,
    closedAt: BASE + 68 * DAY,
    eventRankingRewardRanges: [],
  },
  { id: "junk", name: "Not an event" },
  null,
  "text",
]

// `eventCards` rows: en dumps omit `leaderBonusRate`; numbers may arrive as
// strings; rows missing either id are dropped.
const EVENT_CARDS = [
  { id: 1, eventId: 1, cardId: 101, bonusRate: 25, leaderBonusRate: 40, isDisplayCardStory: true },
  { id: 2, eventId: 1, cardId: 102, bonusRate: 25, isDisplayCardStory: false },
  { id: 3, eventId: 2, cardId: 101, bonusRate: "20" },
  { id: 4, eventId: 1 },
  { id: 5, cardId: 104, bonusRate: 25 },
]

// `eventDeckBonuses` rows: combo, character-only and attribute-only shapes,
// plus rows that carry neither target or a zero rate (dropped).
const EVENT_DECK_BONUSES = [
  { id: 1, eventId: 1, gameCharacterUnitId: 2, cardAttr: "pure", bonusRate: 50 },
  { id: 2, eventId: 1, gameCharacterUnitId: 30, cardAttr: "pure", bonusRate: 50 },
  { id: 3, eventId: 1, gameCharacterUnitId: 2, bonusRate: 20 },
  { id: 4, eventId: 1, cardAttr: "Pure", bonusRate: 20 },
  { id: 5, eventId: 2, gameCharacterUnitId: 14, cardAttr: "cool", bonusRate: 50 },
  { id: 6, eventId: 2, cardAttr: "happy", bonusRate: 25 },
  { id: 7, eventId: 2, bonusRate: 25 },
  { id: 8, eventId: 3, gameCharacterUnitId: 17, cardAttr: "cute", bonusRate: 0 },
]

function buildFixtureIndex() {
  return buildEventsIndex({
    events: EVENTS,
    eventCards: EVENT_CARDS,
    eventDeckBonuses: EVENT_DECK_BONUSES,
  })
}

describe("buildEventsIndex", () => {
  test("lists normalized events newest first and indexes them by id", () => {
    const index = buildFixtureIndex()

    expect(index.list.map((event) => event.id)).toEqual([3, 2, 1])
    expect(index.byId.size).toBe(3)
    expect(index.byId.get(1)).toMatchObject({ id: 1, name: "First", eventType: "marathon", unit: null, startAt: BASE })
    expect(index.byId.get(2)?.unit).toBe("theme_park")
    expect(index.byId.has(NaN)).toBe(false)
  })

  test("links event cards by event and by card", () => {
    const index = buildFixtureIndex()

    expect(index.cardLinksByEvent.get(1)).toEqual([
      { eventId: 1, cardId: 101, bonusRate: 25, leaderBonusRate: 40, isDisplayCardStory: true },
      { eventId: 1, cardId: 102, bonusRate: 25, leaderBonusRate: null, isDisplayCardStory: false },
    ])
    expect(index.cardLinksByEvent.get(2)).toEqual([
      { eventId: 2, cardId: 101, bonusRate: 20, leaderBonusRate: null, isDisplayCardStory: false },
    ])
    expect(index.cardLinksByEvent.has(3)).toBe(false)

    expect(index.cardLinksByCard.get(101)?.map((link) => link.eventId)).toEqual([1, 2])
    expect(index.cardLinksByCard.get(102)?.map((link) => link.eventId)).toEqual([1])
    // Rows without both ids never reach either map.
    expect(index.cardLinksByCard.has(104)).toBe(false)
    expect([...index.cardLinksByCard.keys()]).toEqual([101, 102])
  })

  test("collects bonus attributes per event", () => {
    const index = buildFixtureIndex()

    expect(index.bonusAttrMap.get(1)).toEqual(new Set(["pure"]))
    expect(index.bonusAttrMap.get(2)).toEqual(new Set(["cool", "happy"]))
    // A zero bonus rate is not a bonus.
    expect(index.bonusAttrMap.has(3)).toBe(false)
  })

  test("collects bonus character unit ids per event", () => {
    const index = buildFixtureIndex()

    expect(index.bonusCharacterUnitIdsByEvent.get(1)).toEqual(new Set([2, 30]))
    expect(index.bonusCharacterUnitIdsByEvent.get(2)).toEqual(new Set([14]))
    expect(index.bonusCharacterUnitIdsByEvent.has(3)).toBe(false)
  })

  test("keeps normalized deck bonus rows per event in file order", () => {
    const index = buildFixtureIndex()

    expect(index.deckBonusesByEvent.get(1)).toEqual([
      { gameCharacterUnitId: 2, cardAttr: "pure", bonusRate: 50 },
      { gameCharacterUnitId: 30, cardAttr: "pure", bonusRate: 50 },
      { gameCharacterUnitId: 2, cardAttr: null, bonusRate: 20 },
      { gameCharacterUnitId: null, cardAttr: "pure", bonusRate: 20 },
    ])
    expect(index.deckBonusesByEvent.get(2)).toEqual([
      { gameCharacterUnitId: 14, cardAttr: "cool", bonusRate: 50 },
      { gameCharacterUnitId: null, cardAttr: "happy", bonusRate: 25 },
    ])
    expect(index.deckBonusesByEvent.has(3)).toBe(false)
  })

  test("keeps ranking reward ranges ascending by rank with deduplicated box ids", () => {
    const index = buildFixtureIndex()

    expect(index.rankingRewardRangesByEvent.get(1)).toEqual([
      { fromRank: 1, toRank: 1, isToRankBorder: false, resourceBoxIds: [201] },
      { fromRank: 2, toRank: 2, isToRankBorder: false, resourceBoxIds: [202] },
      { fromRank: 3, toRank: 10, isToRankBorder: false, resourceBoxIds: [203] },
    ])
    // No ranges and an empty range list both leave the event out of the map.
    expect(index.rankingRewardRangesByEvent.has(2)).toBe(false)
    expect(index.rankingRewardRangesByEvent.has(3)).toBe(false)
  })

  test("tolerates missing or malformed files", () => {
    for (const files of [{}, { events: "nope", eventCards: null, eventDeckBonuses: 3 }]) {
      const index = buildEventsIndex(files)
      expect(index.list).toEqual([])
      expect(index.byId.size).toBe(0)
      expect(index.cardLinksByEvent.size).toBe(0)
      expect(index.cardLinksByCard.size).toBe(0)
      expect(index.bonusAttrMap.size).toBe(0)
      expect(index.bonusCharacterUnitIdsByEvent.size).toBe(0)
      expect(index.deckBonusesByEvent.size).toBe(0)
      expect(index.rankingRewardRangesByEvent.size).toBe(0)
    }
  })

  test("ignores links and bonuses whose files are present but events are not", () => {
    const index = buildEventsIndex({ eventCards: EVENT_CARDS, eventDeckBonuses: EVENT_DECK_BONUSES })

    expect(index.list).toEqual([])
    // Card links and bonus lookups are keyed by the raw event id; the
    // consumers resolve the event through `byId` and skip unknown ones.
    expect(index.cardLinksByCard.get(101)?.length).toBe(2)
    expect(index.bonusAttrMap.get(2)).toEqual(new Set(["cool", "happy"]))
    expect(index.rankingRewardRangesByEvent.size).toBe(0)
  })
})
