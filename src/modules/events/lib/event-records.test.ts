import { describe, expect, test } from "bun:test"
import type { SekaiEventItem } from "./event-filter"
import {
  buildEventPointTrend,
  buildEventRecordRows,
  buildEventsById,
  buildWorldBloomChapterNoIndex,
  buildWorldBloomGroups,
  mergeWorldBloomIntoRows,
  normalizeUserEventRecords,
  normalizeUserWorldBloomRecords,
  summarizeEventRecords,
  worldBloomChapterKey,
} from "./event-records"

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

describe("normalizeUserEventRecords", () => {
  test("keeps eventId and eventPoint, treats missing rank as null", () => {
    const records = normalizeUserEventRecords([
      { eventId: 100, eventPoint: 1_234_567 },
      { eventId: 101, eventPoint: 5000, rank: 321 },
    ])

    expect(records).toEqual([
      { eventId: 100, eventPoint: 1_234_567, rank: null },
      { eventId: 101, eventPoint: 5000, rank: 321 },
    ])
  })

  test("accepts the legacy eventRank field name", () => {
    expect(normalizeUserEventRecords([{ eventId: 5, eventPoint: 10, eventRank: 42 }])).toEqual([
      { eventId: 5, eventPoint: 10, rank: 42 },
    ])
  })

  test("skips entries without a valid eventId and tolerates junk", () => {
    const records = normalizeUserEventRecords([
      { eventPoint: 100 },
      { eventId: 0, eventPoint: 100 },
      null,
      "junk",
      { eventId: 7 },
    ])

    expect(records).toEqual([{ eventId: 7, eventPoint: 0, rank: null }])
  })

  test("returns an empty array for non-array input", () => {
    expect(normalizeUserEventRecords(undefined)).toEqual([])
    expect(normalizeUserEventRecords({})).toEqual([])
  })
})

describe("normalizeUserWorldBloomRecords", () => {
  test("normalizes chapter records and upgrades second timestamps", () => {
    const records = normalizeUserWorldBloomRecords([
      {
        eventId: 160,
        gameCharacterId: 3,
        worldBloomChapterPoint: 88_000,
        rank: 1500,
        worldBloomChapterPointUpdateAt: 1_700_000_000_000,
      },
      {
        eventId: 160,
        gameCharacterId: 4,
        worldBloomChapterPoint: 12_000,
        worldBloomChapterPointUpdateAt: 1_700_000_000,
      },
    ])

    expect(records).toEqual([
      { eventId: 160, gameCharacterId: 3, chapterPoint: 88_000, rank: 1500, updatedAt: 1_700_000_000_000 },
      { eventId: 160, gameCharacterId: 4, chapterPoint: 12_000, rank: null, updatedAt: 1_700_000_000_000 },
    ])
  })

  test("skips entries without a valid eventId", () => {
    expect(normalizeUserWorldBloomRecords([{ gameCharacterId: 1, worldBloomChapterPoint: 5 }])).toEqual([])
  })
})

describe("buildEventRecordRows", () => {
  const eventsById = buildEventsById([
    makeEvent({ id: 10, name: "Older", startAt: Date.UTC(2023, 5, 1) }),
    makeEvent({ id: 11, name: "Newer", startAt: Date.UTC(2024, 5, 1) }),
  ])

  test("joins masterdata and sorts by event startAt desc", () => {
    const rows = buildEventRecordRows(
      [
        { eventId: 10, eventPoint: 100, rank: null },
        { eventId: 11, eventPoint: 200, rank: 50 },
      ],
      eventsById,
    )

    expect(rows.map((row) => row.name)).toEqual(["Newer", "Older"])
    expect(rows[0]?.rank).toBe(50)
    expect(rows[1]?.rank).toBeNull()
  })

  test("falls back to #<id> and sorts last when eventId is missing from masterdata", () => {
    const rows = buildEventRecordRows(
      [
        { eventId: 999, eventPoint: 1, rank: null },
        { eventId: 10, eventPoint: 100, rank: null },
      ],
      eventsById,
    )

    expect(rows.map((row) => row.name)).toEqual(["Older", "#999"])
    expect(rows[1]?.event).toBeNull()
  })

  test("returns an empty array for empty userEvents", () => {
    expect(buildEventRecordRows([], eventsById)).toEqual([])
  })
})

describe("buildWorldBloomGroups", () => {
  test("groups chapters under their event and orders by chapterNo", () => {
    const eventsById = buildEventsById([
      makeEvent({ id: 160, name: "WL 1", eventType: "world_bloom", startAt: Date.UTC(2024, 2, 1) }),
      makeEvent({ id: 170, name: "WL 2", eventType: "world_bloom", startAt: Date.UTC(2024, 8, 1) }),
    ])
    const chapterNoIndex = buildWorldBloomChapterNoIndex([
      { eventId: 160, gameCharacterId: 3, chapterNo: 2 },
      { eventId: 160, gameCharacterId: 4, chapterNo: 1 },
    ])

    const groups = buildWorldBloomGroups(
      [
        { eventId: 160, gameCharacterId: 3, chapterPoint: 10, rank: null, updatedAt: null },
        { eventId: 160, gameCharacterId: 4, chapterPoint: 20, rank: 7, updatedAt: null },
        { eventId: 170, gameCharacterId: 1, chapterPoint: 30, rank: null, updatedAt: null },
      ],
      eventsById,
      chapterNoIndex,
    )

    expect(groups.map((group) => group.name)).toEqual(["WL 2", "WL 1"])
    expect(groups[1]?.chapters.map((chapter) => chapter.gameCharacterId)).toEqual([4, 3])
    expect(groups[1]?.chapters[0]?.chapterNo).toBe(1)
    // Chapter without a master worldBlooms entry keeps a null chapterNo.
    expect(groups[0]?.chapters[0]?.chapterNo).toBeNull()
  })

  test("keeps groups for events missing from masterdata", () => {
    const groups = buildWorldBloomGroups(
      [{ eventId: 555, gameCharacterId: 2, chapterPoint: 9, rank: null, updatedAt: null }],
      new Map(),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.name).toBe("#555")
    expect(groups[0]?.event).toBeNull()
  })
})

describe("mergeWorldBloomIntoRows", () => {
  const eventsById = buildEventsById([
    makeEvent({ id: 160, name: "WL 1", eventType: "world_bloom", startAt: Date.UTC(2024, 2, 1) }),
    makeEvent({ id: 165, name: "Marathon", startAt: Date.UTC(2024, 4, 1) }),
    makeEvent({ id: 170, name: "WL 2", eventType: "world_bloom", startAt: Date.UTC(2024, 8, 1) }),
  ])

  test("attaches chapters to the matching main row", () => {
    const rows = buildEventRecordRows(
      [
        { eventId: 160, eventPoint: 100, rank: 5 },
        { eventId: 165, eventPoint: 200, rank: 9 },
      ],
      eventsById,
    )
    const groups = buildWorldBloomGroups(
      [{ eventId: 160, gameCharacterId: 3, chapterPoint: 10, rank: 2, updatedAt: null }],
      eventsById,
    )

    const merged = mergeWorldBloomIntoRows(rows, groups)

    expect(merged.map((row) => row.eventId)).toEqual([165, 160])
    expect(merged[1]?.eventPoint).toBe(100)
    expect(merged[1]?.chapters.map((chapter) => chapter.gameCharacterId)).toEqual([3])
    expect(merged[0]?.chapters).toEqual([])
  })

  test("keeps chapter-only events as standalone rows in date order", () => {
    const rows = buildEventRecordRows([{ eventId: 165, eventPoint: 200, rank: null }], eventsById)
    const groups = buildWorldBloomGroups(
      [{ eventId: 170, gameCharacterId: 1, chapterPoint: 30, rank: null, updatedAt: null }],
      eventsById,
    )

    const merged = mergeWorldBloomIntoRows(rows, groups)

    expect(merged.map((row) => row.eventId)).toEqual([170, 165])
    expect(merged[0]?.eventPoint).toBeNull()
    expect(merged[0]?.chapters).toHaveLength(1)
  })
})

describe("worldBloomChapterKey", () => {
  test("distinguishes finale chapters from character chapters", () => {
    expect(worldBloomChapterKey(160, 3)).toBe("160:3")
    expect(worldBloomChapterKey(160, null)).toBe("160:finale")
  })
})

describe("buildEventPointTrend", () => {
  test("orders points chronologically and skips rows without a dated event", () => {
    const eventsById = buildEventsById([
      makeEvent({ id: 10, name: "Older", startAt: Date.UTC(2023, 5, 1) }),
      makeEvent({ id: 11, name: "Newer", startAt: Date.UTC(2024, 5, 1) }),
    ])
    const rows = buildEventRecordRows(
      [
        { eventId: 11, eventPoint: 200, rank: null },
        { eventId: 999, eventPoint: 50, rank: null },
        { eventId: 10, eventPoint: 100, rank: null },
      ],
      eventsById,
    )

    const trend = buildEventPointTrend(rows)
    expect(trend.map((point) => point.eventId)).toEqual([10, 11])
    expect(trend.map((point) => point.eventPoint)).toEqual([100, 200])
  })

  test("returns an empty array for empty rows", () => {
    expect(buildEventPointTrend([])).toEqual([])
  })
})

describe("summarizeEventRecords", () => {
  test("computes totals, best and rounded average", () => {
    const summary = summarizeEventRecords([
      { eventId: 1, eventPoint: 100, rank: null },
      { eventId: 2, eventPoint: 201, rank: null },
    ])

    expect(summary).toEqual({ participated: 2, bestPoint: 201, averagePoint: 151 })
  })

  test("returns null aggregates for empty userEvents", () => {
    expect(summarizeEventRecords([])).toEqual({ participated: 0, bestPoint: null, averagePoint: null })
  })
})
