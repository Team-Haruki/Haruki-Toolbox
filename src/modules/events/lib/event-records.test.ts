import { describe, expect, test } from "bun:test"
import type { SekaiEventItem } from "./event-filter"
import {
  buildDerivedRankMap,
  clampTrendWindow,
  filterEventRecordTableRows,
  sortEventRecordTableRows,
  summarizeEventRecordTableRows,
  defaultTrendWindow,
  TREND_DEFAULT_WINDOW_SIZE,
  buildEventPointTrend,
  buildEventRecordRows,
  buildEventsById,
  buildHonorRankIndex,
  buildHonorRankIndexFromNames,
  buildWorldBloomChapterNoIndex,
  buildWorldBloomGroups,
  derivedChapterRankKey,
  derivedEventRankKey,
  formatDerivedRankTier,
  mergeWorldBloomIntoRows,
  normalizeUserEventRecords,
  normalizeUserHonorIds,
  parseHonorTierName,
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

describe("honor-derived rank tiers", () => {
  const rawEvents = [
    {
      id: 11,
      eventRankingRewardRanges: [
        { id: 1, eventId: 11, fromRank: 1, toRank: 1, eventRankingRewards: [{ resourceBoxId: 281 }] },
        { id: 2, eventId: 11, fromRank: 101, toRank: 1000, eventRankingRewards: [{ resourceBoxId: 282 }] },
      ],
    },
  ]
  const rawChapterRanges = [
    { id: 9, eventId: 112, gameCharacterId: 18, fromRank: 1, toRank: 100, resourceBoxId: 1120101 },
  ]
  const rawResourceBoxes = [
    {
      resourceBoxPurpose: "event_ranking_reward",
      id: 281,
      details: [
        { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 281, resourceType: "jewel", resourceQuantity: 3000 },
        { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 281, resourceType: "honor", resourceId: 182 },
      ],
    },
    {
      resourceBoxPurpose: "event_ranking_reward",
      id: 282,
      details: [
        { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 282, resourceType: "honor", resourceId: 190 },
      ],
    },
  ]
  // tw/kr/cn dumps ship flat detail rows in a separate file.
  const rawResourceBoxDetails = [
    { resourceBoxPurpose: "world_bloom_chapter_ranking_reward", resourceBoxId: 1120101, resourceType: "honor", resourceId: 5001 },
  ]

  test("maps ranking honors to event and chapter tiers across both dump shapes", () => {
    const index = buildHonorRankIndex(rawEvents, rawChapterRanges, rawResourceBoxes, rawResourceBoxDetails)
    expect(index.get(182)).toEqual({ key: derivedEventRankKey(11), tier: { fromRank: 1, toRank: 1 } })
    expect(index.get(190)).toEqual({ key: derivedEventRankKey(11), tier: { fromRank: 101, toRank: 1000 } })
    expect(index.get(5001)).toEqual({
      key: derivedChapterRankKey(112, 18),
      tier: { fromRank: 1, toRank: 100 },
    })
    expect(index.has(9999)).toBe(false)
  })

  test("derives the best tier per event from owned honors", () => {
    const index = buildHonorRankIndex(rawEvents, rawChapterRanges, rawResourceBoxes, rawResourceBoxDetails)
    const derived = buildDerivedRankMap(new Set([182, 190, 5001, 42]), index)
    expect(derived.get(derivedEventRankKey(11))).toEqual({ fromRank: 1, toRank: 1 })
    expect(derived.get(derivedChapterRankKey(112, 18))).toEqual({ fromRank: 1, toRank: 100 })
    expect(derived.size).toBe(2)
  })

  test("normalizes owned honor ids and formats tiers", () => {
    expect([...normalizeUserHonorIds([{ honorId: 182 }, { honorId: 182 }, { honorId: null }, {}])]).toEqual([182])
    expect(normalizeUserHonorIds(null).size).toBe(0)
    expect(formatDerivedRankTier({ fromRank: 101, toRank: 1000 })).toBe("T1000")
    expect(formatDerivedRankTier({ fromRank: 1, toRank: 1 })).toBe("T1")
  })
})

describe("parseHonorTierName", () => {
  test("parses TOP-style tiers across regions", () => {
    expect(parseHonorTierName("TOP100")).toEqual({ fromRank: 1, toRank: 100 })
    expect(parseHonorTierName("Top 1,000")).toEqual({ fromRank: 1, toRank: 1000 })
    expect(parseHonorTierName("top50000")).toEqual({ fromRank: 1, toRank: 50000 })
  })

  test("parses exact-rank tiers across regions", () => {
    expect(parseHonorTierName("1位")).toEqual({ fromRank: 1, toRank: 1 })
    expect(parseHonorTierName("第10名")).toEqual({ fromRank: 10, toRank: 10 })
    expect(parseHonorTierName("3위")).toEqual({ fromRank: 3, toRank: 3 })
    expect(parseHonorTierName("2nd")).toEqual({ fromRank: 2, toRank: 2 })
    expect(parseHonorTierName("10th")).toEqual({ fromRank: 10, toRank: 10 })
  })

  test("rejects non-tier honor names", () => {
    expect(parseHonorTierName("Memorial")).toBeNull()
    expect(parseHonorTierName("イベント参加")).toBeNull()
    expect(parseHonorTierName("")).toBeNull()
  })
})

describe("buildHonorRankIndexFromNames", () => {
  const rawEvents = [{ id: 11, name: "雨过天晴的启明星" }, { id: 12, name: "Color of Myself!" }]
  const rawHonorGroups = [
    { id: 71, honorType: "sekai_echo", name: "雨过天晴的启明星" },
    { id: 72, honorType: "event", name: "Color of Myself! " },
    { id: 90, honorType: "event", name: "HAPPY BIRTHDAY 一歌" },
  ]
  const rawHonors = [
    { id: 182, groupId: 71, name: "第1名" },
    { id: 190, groupId: 71, name: "TOP1000" },
    { id: 200, groupId: 72, name: "TOP100" },
    { id: 300, groupId: 90, name: "参加纪念" },
    { id: 310, groupId: 71, name: "参加纪念" },
  ]

  test("matches groups to events by trimmed name regardless of honorType", () => {
    const index = buildHonorRankIndexFromNames(rawHonors, rawHonorGroups, rawEvents)
    expect(index.get(182)).toEqual({ key: derivedEventRankKey(11), tier: { fromRank: 1, toRank: 1 } })
    expect(index.get(190)).toEqual({ key: derivedEventRankKey(11), tier: { fromRank: 1, toRank: 1000 } })
    expect(index.get(200)).toEqual({ key: derivedEventRankKey(12), tier: { fromRank: 1, toRank: 100 } })
    expect(index.has(300)).toBe(false)
    expect(index.has(310)).toBe(false)
  })

  test("tolerates malformed payloads", () => {
    expect(buildHonorRankIndexFromNames(null, undefined, "oops").size).toBe(0)
  })
})

describe("defaultTrendWindow", () => {
  test("returns the full range for short series", () => {
    expect(defaultTrendWindow(0)).toEqual({ start: 0, end: 0 })
    expect(defaultTrendWindow(1)).toEqual({ start: 0, end: 0 })
    expect(defaultTrendWindow(TREND_DEFAULT_WINDOW_SIZE)).toEqual({ start: 0, end: TREND_DEFAULT_WINDOW_SIZE - 1 })
  })

  test("returns the most recent window for long series", () => {
    expect(defaultTrendWindow(100)).toEqual({ start: 100 - TREND_DEFAULT_WINDOW_SIZE, end: 99 })
    expect(defaultTrendWindow(41)).toEqual({ start: 1, end: 40 })
  })

  test("honors a custom window size", () => {
    expect(defaultTrendWindow(10, 4)).toEqual({ start: 6, end: 9 })
    expect(defaultTrendWindow(4, 4)).toEqual({ start: 0, end: 3 })
  })
})

describe("clampTrendWindow", () => {
  test("rounds fractional brush selections", () => {
    expect(clampTrendWindow(2.4, 7.6, 20)).toEqual({ start: 2, end: 8 })
  })

  test("orders reversed selections", () => {
    expect(clampTrendWindow(9, 3, 20)).toEqual({ start: 3, end: 9 })
  })

  test("clamps out-of-bounds selections", () => {
    expect(clampTrendWindow(-5, 100, 20)).toEqual({ start: 0, end: 19 })
  })

  test("widens selections below the minimum size", () => {
    expect(clampTrendWindow(5, 5, 20)).toEqual({ start: 5, end: 6 })
    // At the right edge the window grows leftwards instead.
    expect(clampTrendWindow(19, 19, 20)).toEqual({ start: 18, end: 19 })
    expect(clampTrendWindow(3, 3, 20, 5)).toEqual({ start: 3, end: 7 })
  })

  test("falls back to the full range on non-finite input", () => {
    expect(clampTrendWindow(Number.NaN, 4, 20)).toEqual({ start: 0, end: 19 })
    expect(clampTrendWindow(0, Number.POSITIVE_INFINITY, 20)).toEqual({ start: 0, end: 19 })
  })

  test("degrades gracefully on tiny series", () => {
    expect(clampTrendWindow(0, 0, 1)).toEqual({ start: 0, end: 0 })
    expect(clampTrendWindow(0, 0, 0)).toEqual({ start: 0, end: 0 })
  })
})

describe("event record table rows: filter, sort, summary", () => {
  const event = (id: number, startAt: number, eventType: "marathon" | "world_bloom" = "marathon", unit: string | null = null): SekaiEventItem => ({
    id, name: `E${id}`, eventType, assetbundleName: null, unit, startAt, aggregateAt: null, closedAt: null, rankingAnnounceAt: null, distributionStartAt: null,
  })
  const rows = [
    { eventId: 1, event: event(1, 1000, "marathon", "light_sound"), name: "E1", eventPoint: 500, rank: 2000, chapters: [] },
    { eventId: 2, event: event(2, 2000, "world_bloom"), name: "E2", eventPoint: null, rank: null, chapters: [] },
    { eventId: 3, event: event(3, 3000), name: "E3", eventPoint: 900, rank: null, chapters: [] },
    { eventId: 4, event: null, name: "#4", eventPoint: 100, rank: 50, chapters: [] },
  ]

  test("filters by window, type and unit, dropping undated rows when a window is set", () => {
    const open = { from: null, to: null, types: [], units: [] }
    expect(filterEventRecordTableRows(rows, open).map((row) => row.eventId)).toEqual([1, 2, 3, 4])
    expect(filterEventRecordTableRows(rows, { ...open, from: 1500 }).map((row) => row.eventId)).toEqual([2, 3])
    expect(filterEventRecordTableRows(rows, { ...open, types: ["world_bloom"] }).map((row) => row.eventId)).toEqual([2])
    expect(filterEventRecordTableRows(rows, { ...open, units: ["light_sound"] }).map((row) => row.eventId)).toEqual([1])
  })

  test("sorts by date, points and rank with unranked rows last", () => {
    expect(sortEventRecordTableRows(rows, "time").map((row) => row.eventId)).toEqual([3, 2, 1, 4])
    expect(sortEventRecordTableRows(rows, "point").map((row) => row.eventId)).toEqual([3, 1, 4, 2])
    expect(sortEventRecordTableRows(rows, "rank").map((row) => row.eventId)).toEqual([4, 1, 3, 2])
    // A derived tier can stand in for the exact rank.
    expect(sortEventRecordTableRows(rows, "rank", (row) => row.rank ?? (row.eventId === 3 ? 100 : null)).map((row) => row.eventId)).toEqual([4, 3, 1, 2])
  })

  test("summarizes participations only, with the best exact rank", () => {
    expect(summarizeEventRecordTableRows(rows)).toEqual({
      participated: 3,
      bestPoint: 900,
      averagePoint: 500,
      bestRank: 50,
      rankedCount: 2,
    })
    expect(summarizeEventRecordTableRows([])).toEqual({ participated: 0, bestPoint: null, averagePoint: null, bestRank: null, rankedCount: 0 })
  })
})
