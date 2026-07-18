import { describe, expect, test } from "bun:test"
import {
  collectEventYears,
  filterEvents,
  isSekaiEventType,
  normalizeEventItem,
  normalizeEventItems,
  normalizeEventTimestamp,
  normalizeWorldBloomChapters,
  resolveEventStatus,
  resolveEventYear,
  sortEventsByStartAtDesc,
  splitEventCountdown,
  type SekaiEventItem,
} from "./event-filter"

const DAY = 24 * 60 * 60 * 1000

function makeEvent(overrides: Partial<SekaiEventItem> = {}): SekaiEventItem {
  return {
    id: 1,
    name: "Test Event",
    eventType: "marathon",
    assetbundleName: "event_test_2024",
    unit: null,
    startAt: Date.UTC(2024, 0, 10),
    aggregateAt: Date.UTC(2024, 0, 18),
    closedAt: Date.UTC(2024, 0, 20),
    ...overrides,
  }
}

describe("normalizeEventTimestamp", () => {
  test("keeps millisecond timestamps", () => {
    expect(normalizeEventTimestamp(1653112800000)).toBe(1653112800000)
  })

  test("upgrades second timestamps to milliseconds", () => {
    expect(normalizeEventTimestamp(1653112800)).toBe(1653112800000)
  })

  test("rejects invalid values", () => {
    expect(normalizeEventTimestamp(null)).toBeNull()
    expect(normalizeEventTimestamp("abc")).toBeNull()
    expect(normalizeEventTimestamp(0)).toBeNull()
    expect(normalizeEventTimestamp(-5)).toBeNull()
  })
})

describe("normalizeEventItem", () => {
  test("normalizes a master event record", () => {
    const item = normalizeEventItem({
      id: 1,
      eventType: "marathon",
      name: "비 갠 뒤 첫 번째 별",
      assetbundleName: "event_stella_2020",
      startAt: 1653112800000,
      aggregateAt: 1653652799000,
      closedAt: 1653803998000,
      unit: "none",
    })
    expect(item).toEqual({
      id: 1,
      name: "비 갠 뒤 첫 번째 별",
      eventType: "marathon",
      assetbundleName: "event_stella_2020",
      unit: null,
      startAt: 1653112800000,
      aggregateAt: 1653652799000,
      closedAt: 1653803998000,
    })
  })

  test("keeps a concrete unit and unknown event types become null", () => {
    const item = normalizeEventItem({ id: 3, eventType: "mystery", unit: "idol" })
    expect(item?.unit).toBe("idol")
    expect(item?.eventType).toBeNull()
    expect(item?.name).toBe("#3")
  })

  test("rejects records without a valid id", () => {
    expect(normalizeEventItem({ name: "x" })).toBeNull()
    expect(normalizeEventItem(null)).toBeNull()
  })
})

describe("normalizeEventItems", () => {
  test("drops invalid entries", () => {
    const items = normalizeEventItems([{ id: 1, name: "a" }, { name: "b" }, "junk", null])
    expect(items.map((item) => item.id)).toEqual([1])
  })

  test("returns empty array for non-array input", () => {
    expect(normalizeEventItems(undefined)).toEqual([])
  })
})

describe("isSekaiEventType", () => {
  test("accepts known types only", () => {
    expect(isSekaiEventType("marathon")).toBe(true)
    expect(isSekaiEventType("cheerful_carnival")).toBe(true)
    expect(isSekaiEventType("world_bloom")).toBe(true)
    expect(isSekaiEventType("challenge_live")).toBe(false)
  })
})

describe("resolveEventStatus", () => {
  const event = makeEvent()

  test("upcoming before startAt", () => {
    expect(resolveEventStatus(event, event.startAt! - DAY)).toBe("upcoming")
  })

  test("ongoing between startAt and aggregateAt", () => {
    expect(resolveEventStatus(event, event.startAt! + DAY)).toBe("ongoing")
    expect(resolveEventStatus(event, event.aggregateAt!)).toBe("ongoing")
  })

  test("ended after aggregateAt", () => {
    expect(resolveEventStatus(event, event.aggregateAt! + 1)).toBe("ended")
  })

  test("falls back to closedAt when aggregateAt is missing", () => {
    const noAggregate = makeEvent({ aggregateAt: null })
    expect(resolveEventStatus(noAggregate, noAggregate.startAt! + DAY)).toBe("ongoing")
    expect(resolveEventStatus(noAggregate, noAggregate.closedAt! + 1)).toBe("ended")
  })

  test("ended when timestamps are missing", () => {
    expect(resolveEventStatus(makeEvent({ startAt: null, aggregateAt: null, closedAt: null }))).toBe("ended")
  })
})

describe("years", () => {
  test("resolveEventYear reads the local start year", () => {
    const event = makeEvent({ startAt: new Date(2023, 5, 15).getTime() })
    expect(resolveEventYear(event)).toBe(2023)
    expect(resolveEventYear(makeEvent({ startAt: null }))).toBeNull()
  })

  test("collectEventYears returns unique years descending", () => {
    const events = [
      makeEvent({ id: 1, startAt: new Date(2021, 1, 1).getTime() }),
      makeEvent({ id: 2, startAt: new Date(2023, 1, 1).getTime() }),
      makeEvent({ id: 3, startAt: new Date(2021, 6, 1).getTime() }),
      makeEvent({ id: 4, startAt: null }),
    ]
    expect(collectEventYears(events)).toEqual([2023, 2021])
  })
})

describe("sortEventsByStartAtDesc", () => {
  test("sorts newest first and breaks ties by id", () => {
    const events = [
      makeEvent({ id: 1, startAt: 1000 }),
      makeEvent({ id: 3, startAt: 3000 }),
      makeEvent({ id: 2, startAt: 3000 }),
      makeEvent({ id: 4, startAt: null }),
    ]
    expect(sortEventsByStartAtDesc(events).map((event) => event.id)).toEqual([3, 2, 1, 4])
  })

  test("does not mutate the input", () => {
    const events = [makeEvent({ id: 1, startAt: 1 }), makeEvent({ id: 2, startAt: 2 })]
    sortEventsByStartAtDesc(events)
    expect(events.map((event) => event.id)).toEqual([1, 2])
  })
})

describe("filterEvents", () => {
  const events = [
    makeEvent({ id: 1, name: "Stella After the Rain", eventType: "marathon", startAt: new Date(2020, 9, 1).getTime() }),
    makeEvent({ id: 2, name: "Summer Carnival", eventType: "cheerful_carnival", startAt: new Date(2021, 6, 1).getTime() }),
    makeEvent({ id: 3, name: "World Link Finale", eventType: "world_bloom", startAt: new Date(2024, 2, 1).getTime() }),
  ]
  const bonusAttrs = new Map<number, Set<string>>([
    [1, new Set(["mysterious"])],
    [2, new Set(["pure"])],
  ])

  test("returns everything with empty options", () => {
    expect(filterEvents(events, {})).toHaveLength(3)
  })

  test("filters by name, case-insensitively", () => {
    expect(filterEvents(events, { search: "summer" }).map((event) => event.id)).toEqual([2])
  })

  test("matches exact id search", () => {
    expect(filterEvents(events, { search: "3" }).map((event) => event.id)).toEqual([3])
  })

  test("filters by event type", () => {
    expect(filterEvents(events, { eventType: "world_bloom" }).map((event) => event.id)).toEqual([3])
  })

  test("filters by bonus attribute via the provided map", () => {
    expect(filterEvents(events, { bonusAttr: "pure" }, bonusAttrs).map((event) => event.id)).toEqual([2])
    expect(filterEvents(events, { bonusAttr: "pure" })).toEqual([])
  })

  test("filters by year", () => {
    expect(filterEvents(events, { year: 2021 }).map((event) => event.id)).toEqual([2])
  })

  test("combines filters", () => {
    expect(
      filterEvents(events, { search: "carnival", eventType: "cheerful_carnival", year: 2021, bonusAttr: "pure" }, bonusAttrs)
        .map((event) => event.id),
    ).toEqual([2])
    expect(
      filterEvents(events, { search: "carnival", eventType: "marathon" }, bonusAttrs),
    ).toEqual([])
  })
})

describe("splitEventCountdown", () => {
  test("splits a delta into days/hours/minutes/seconds", () => {
    const now = Date.UTC(2024, 0, 1)
    const target = now + DAY + 2 * 3600_000 + 3 * 60_000 + 4_000
    expect(splitEventCountdown(target, now)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 })
  })

  test("returns null once the target has passed", () => {
    const now = Date.UTC(2024, 0, 1)
    expect(splitEventCountdown(now, now)).toBeNull()
    expect(splitEventCountdown(now - 1, now)).toBeNull()
  })
})

describe("normalizeWorldBloomChapters", () => {
  const worldBlooms = [
    {
      id: 11202,
      eventId: 112,
      gameCharacterId: 20,
      chapterNo: 2,
      chapterStartAt: 1731322800000,
      aggregateAt: 1731581999000,
      chapterEndAt: 1731582599000,
      worldBloomChapterType: "game_character",
      isSupplemental: false,
    },
    {
      id: 11201,
      eventId: 112,
      gameCharacterId: 18,
      chapterNo: 1,
      chapterStartAt: 1731063600000,
      aggregateAt: 1731322799000,
      chapterEndAt: 1731323399000,
      worldBloomChapterType: "game_character",
      isSupplemental: false,
    },
    { id: 11301, eventId: 113, gameCharacterId: 1, chapterNo: 1 },
  ]

  test("selects and sorts chapters for the event", () => {
    const chapters = normalizeWorldBloomChapters(worldBlooms, 112)
    expect(chapters.map((chapter) => chapter.chapterNo)).toEqual([1, 2])
    expect(chapters[0]).toEqual({
      id: 11201,
      eventId: 112,
      gameCharacterId: 18,
      chapterNo: 1,
      chapterStartAt: 1731063600000,
      aggregateAt: 1731322799000,
      chapterEndAt: 1731323399000,
      chapterType: "game_character",
      isSupplemental: false,
    })
  })

  test("returns empty array when no chapters match", () => {
    expect(normalizeWorldBloomChapters(worldBlooms, 999)).toEqual([])
    expect(normalizeWorldBloomChapters(null, 112)).toEqual([])
  })
})
