import { describe, expect, test } from "bun:test"
import type { SekaiEventItem } from "./event-filter"
import {
  buildEventSearchParts,
  filterEventList,
  isUpcomingHiddenByFilter,
  matchesEventSearch,
  resolveEventBonusCharacterIds,
  resolveEventCatalogStatus,
  resolveEventEndAt,
  resolveEventStatusUntil,
  sortEventList,
  type EventListContext,
} from "./event-list"
import { createDefaultEventsQuery, type EventsQueryState } from "./event-query"

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2024, 5, 15)

function makeEvent(overrides: Partial<SekaiEventItem> = {}): SekaiEventItem {
  return {
    id: 1,
    name: "Test Event",
    eventType: "marathon",
    assetbundleName: "event_test",
    unit: null,
    startAt: NOW - 10 * DAY,
    aggregateAt: NOW - 2 * DAY,
    closedAt: NOW - DAY,
    rankingAnnounceAt: null,
    distributionStartAt: null,
    ...overrides,
  }
}

const EVENTS: SekaiEventItem[] = [
  makeEvent({ id: 1, name: "Stella After the Rain", eventType: "marathon", startAt: NOW - 400 * DAY, aggregateAt: NOW - 392 * DAY, closedAt: NOW - 391 * DAY }),
  makeEvent({ id: 2, name: "Wonder Carnival", eventType: "cheerful_carnival", unit: "theme_park", startAt: NOW - 30 * DAY, aggregateAt: NOW - 22 * DAY, closedAt: NOW - 21 * DAY }),
  makeEvent({ id: 3, name: "Bloom Link", eventType: "world_bloom", unit: "school_refusal", startAt: NOW - 3 * DAY, aggregateAt: NOW + 5 * DAY, closedAt: NOW + 6 * DAY }),
  makeEvent({ id: 4, name: "Future Festival", eventType: "marathon", startAt: NOW + 10 * DAY, aggregateAt: NOW + 18 * DAY, closedAt: NOW + 19 * DAY }),
]

const CONTEXT: EventListContext = {
  nowMs: NOW,
  hideUnreleased: false,
  bonusAttrMap: new Map([
    [1, new Set(["mysterious"])],
    [2, new Set(["pure"])],
    [4, new Set(["cute"])],
  ]),
  bonusCharacterUnitIdsByEvent: new Map([
    [2, new Set([14, 30])],
    [3, new Set([17, 18])],
  ]),
  characterUnitById: new Map([
    [14, { gameCharacterId: 14 }],
    [17, { gameCharacterId: 17 }],
    [18, { gameCharacterId: 18 }],
    [30, { gameCharacterId: 21 }],
  ]),
}

function query(overrides: Partial<EventsQueryState> = {}): EventsQueryState {
  return { ...createDefaultEventsQuery(), ...overrides }
}

describe("status helpers", () => {
  test("resolveEventEndAt prefers aggregateAt over closedAt", () => {
    expect(resolveEventEndAt({ aggregateAt: 5, closedAt: 9 })).toBe(5)
    expect(resolveEventEndAt({ aggregateAt: null, closedAt: 9 })).toBe(9)
  })

  test("resolveEventCatalogStatus follows the shared model", () => {
    expect(resolveEventCatalogStatus(EVENTS[3], NOW)).toBe("upcoming")
    expect(resolveEventCatalogStatus(EVENTS[2], NOW)).toBe("ongoing")
    expect(resolveEventCatalogStatus(EVENTS[1], NOW)).toBe("ended")
  })

  test("resolveEventStatusUntil picks start or end by status", () => {
    expect(resolveEventStatusUntil(EVENTS[3], "upcoming")).toBe(EVENTS[3].startAt)
    expect(resolveEventStatusUntil(EVENTS[2], "ongoing")).toBe(EVENTS[2].aggregateAt)
    expect(resolveEventStatusUntil(EVENTS[1], "ended")).toBeNull()
  })
})

describe("search", () => {
  test("search parts include name and id forms", () => {
    expect(buildEventSearchParts({ id: 12, name: "Alpha" })).toEqual(["Alpha", "12", "#12"])
  })

  test("matches by name, id and #id", () => {
    expect(matchesEventSearch(EVENTS[1], "carnival")).toBe(true)
    expect(matchesEventSearch(EVENTS[1], "2")).toBe(true)
    expect(matchesEventSearch(EVENTS[1], "#2")).toBe(true)
    expect(matchesEventSearch(EVENTS[1], "stella")).toBe(false)
  })
})

describe("resolveEventBonusCharacterIds", () => {
  test("maps character unit ids to game character ids", () => {
    expect([...resolveEventBonusCharacterIds(2, CONTEXT.bonusCharacterUnitIdsByEvent, CONTEXT.characterUnitById)]).toEqual([14, 21])
    expect(resolveEventBonusCharacterIds(99, CONTEXT.bonusCharacterUnitIdsByEvent, CONTEXT.characterUnitById).size).toBe(0)
  })
})

describe("filterEventList", () => {
  test("returns everything for the default query", () => {
    expect(filterEventList(EVENTS, query(), CONTEXT).map((event) => event.id)).toEqual([1, 2, 3, 4])
  })

  test("hides unreleased events when the setting is on", () => {
    expect(filterEventList(EVENTS, query(), { ...CONTEXT, hideUnreleased: true }).map((event) => event.id)).toEqual([1, 2, 3])
  })

  test("filters by type, status, unit, attribute, character and year", () => {
    expect(filterEventList(EVENTS, query({ type: ["marathon"] }), CONTEXT).map((event) => event.id)).toEqual([1, 4])
    expect(filterEventList(EVENTS, query({ status: ["ongoing", "upcoming"] }), CONTEXT).map((event) => event.id)).toEqual([3, 4])
    expect(filterEventList(EVENTS, query({ units: ["theme_park"] }), CONTEXT).map((event) => event.id)).toEqual([2])
    expect(filterEventList(EVENTS, query({ attrs: ["pure", "cute"] }), CONTEXT).map((event) => event.id)).toEqual([2, 4])
    expect(filterEventList(EVENTS, query({ chars: [21] }), CONTEXT).map((event) => event.id)).toEqual([2])
    expect(filterEventList(EVENTS, query({ chars: [18, 14] }), CONTEXT).map((event) => event.id)).toEqual([2, 3])
    expect(filterEventList(EVENTS, query({ year: new Date(EVENTS[0].startAt!).getFullYear() }), CONTEXT).map((event) => event.id)).toEqual([1])
  })

  test("combines search with filters", () => {
    expect(filterEventList(EVENTS, query({ q: "link", type: ["world_bloom"] }), CONTEXT).map((event) => event.id)).toEqual([3])
    expect(filterEventList(EVENTS, query({ q: "link", type: ["marathon"] }), CONTEXT)).toEqual([])
  })
})

describe("sortEventList", () => {
  test("start desc pins ongoing events first", () => {
    const shuffled = [EVENTS[0], EVENTS[3], EVENTS[2], EVENTS[1]]
    expect(sortEventList(shuffled, { sort: "start", dir: "desc" }, NOW).map((event) => event.id)).toEqual([3, 4, 2, 1])
  })

  test("start asc and id sorts do not pin", () => {
    expect(sortEventList(EVENTS, { sort: "start", dir: "asc" }, NOW).map((event) => event.id)).toEqual([1, 2, 3, 4])
    expect(sortEventList(EVENTS, { sort: "id", dir: "desc" }, NOW).map((event) => event.id)).toEqual([4, 3, 2, 1])
  })

  test("does not mutate the input", () => {
    const input = [EVENTS[1], EVENTS[0]]
    sortEventList(input, { sort: "id", dir: "asc" }, NOW)
    expect(input.map((event) => event.id)).toEqual([2, 1])
  })
})

describe("isUpcomingHiddenByFilter", () => {
  test("true only for an empty result caused by the upcoming filter", () => {
    expect(isUpcomingHiddenByFilter({ status: ["upcoming"] }, true, 0)).toBe(true)
    expect(isUpcomingHiddenByFilter({ status: ["upcoming", "ongoing"] }, true, 0)).toBe(false)
    expect(isUpcomingHiddenByFilter({ status: ["upcoming"] }, false, 0)).toBe(false)
    expect(isUpcomingHiddenByFilter({ status: ["upcoming"] }, true, 3)).toBe(false)
    expect(isUpcomingHiddenByFilter({ status: [] }, true, 0)).toBe(false)
  })
})
