import { appendCatalogRecords, normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"
import { normalizeEventTimestamp, type SekaiEventItem, type SekaiEventType } from "./event-filter"

/**
 * One entry of the suite `userEvents` array.
 * `rank` is absent in many snapshots (e.g. current JP suites) — always optional.
 */
export type UserEventRecord = {
  eventId: number
  eventPoint: number
  rank: number | null
}

/** One entry of the suite `userWorldBlooms` array (per World Link chapter). */
export type UserWorldBloomRecord = {
  eventId: number
  gameCharacterId: number | null
  chapterPoint: number
  rank: number | null
  updatedAt: number | null
}

/** A `userEvents` entry joined against the master `events` list. */
export type EventRecordRow = {
  eventId: number
  /** Null when the event id is missing from the loaded masterdata. */
  event: SekaiEventItem | null
  name: string
  eventPoint: number
  rank: number | null
}

export type WorldBloomChapterRow = UserWorldBloomRecord & {
  chapterNo: number | null
}

export type WorldBloomGroup = {
  eventId: number
  event: SekaiEventItem | null
  name: string
  chapters: WorldBloomChapterRow[]
}

export type EventPointTrendPoint = {
  eventId: number
  name: string
  startAt: number
  eventPoint: number
  rank: number | null
  /** Tier ceiling derived from the event honor when the exact rank is missing. */
  derivedRank: number | null
}

export type EventRecordsSummary = {
  participated: number
  bestPoint: number | null
  averagePoint: number | null
}

/** Ranks are optional in snapshots; also tolerate the legacy `eventRank` field name. */
function normalizeOptionalRank(record: Record<string, unknown>): number | null {
  const rank = normalizeCatalogNumber(record.rank) ?? normalizeCatalogNumber(record.eventRank)
  return rank != null && rank > 0 ? rank : null
}

export function normalizeUserEventRecords(value: unknown): UserEventRecord[] {
  return normalizeCatalogRecords(value)
    .map((record): UserEventRecord | null => {
      const eventId = normalizeCatalogNumber(record.eventId)
      if (eventId == null || eventId <= 0) {
        return null
      }

      return {
        eventId,
        eventPoint: normalizeCatalogNumber(record.eventPoint) ?? 0,
        rank: normalizeOptionalRank(record),
      }
    })
    .filter((record): record is UserEventRecord => record != null)
}

export function normalizeUserWorldBloomRecords(value: unknown): UserWorldBloomRecord[] {
  return normalizeCatalogRecords(value)
    .map((record): UserWorldBloomRecord | null => {
      const eventId = normalizeCatalogNumber(record.eventId)
      if (eventId == null || eventId <= 0) {
        return null
      }

      return {
        eventId,
        gameCharacterId: normalizeCatalogNumber(record.gameCharacterId),
        chapterPoint: normalizeCatalogNumber(record.worldBloomChapterPoint) ?? 0,
        rank: normalizeOptionalRank(record),
        updatedAt: normalizeEventTimestamp(record.worldBloomChapterPointUpdateAt),
      }
    })
    .filter((record): record is UserWorldBloomRecord => record != null)
}

export function buildEventsById(events: readonly SekaiEventItem[]): Map<number, SekaiEventItem> {
  const map = new Map<number, SekaiEventItem>()
  for (const event of events) {
    map.set(event.id, event)
  }

  return map
}

function compareByEventStartDesc(
  a: { event: SekaiEventItem | null; eventId: number },
  b: { event: SekaiEventItem | null; eventId: number },
): number {
  return (
    (b.event?.startAt ?? Number.MIN_SAFE_INTEGER) - (a.event?.startAt ?? Number.MIN_SAFE_INTEGER) ||
    b.eventId - a.eventId
  )
}

/**
 * Joins user event records to masterdata, sorted by event startAt desc.
 * Records whose event is missing from masterdata keep a "#<id>" fallback name
 * and sort after all dated events (newest id first).
 */
export function buildEventRecordRows(
  records: readonly UserEventRecord[],
  eventsById: ReadonlyMap<number, SekaiEventItem>,
): EventRecordRow[] {
  return records
    .map((record): EventRecordRow => {
      const event = eventsById.get(record.eventId) ?? null
      return {
        eventId: record.eventId,
        event,
        name: event?.name ?? `#${record.eventId}`,
        eventPoint: record.eventPoint,
        rank: record.rank,
      }
    })
    .sort(compareByEventStartDesc)
}

export function worldBloomChapterKey(eventId: number, gameCharacterId: number | null): string {
  return `${eventId}:${gameCharacterId ?? "finale"}`
}

/** Maps `worldBloomChapterKey(...)` to the master chapterNo, for ordering and labels. */
export function buildWorldBloomChapterNoIndex(rawWorldBlooms: unknown): Map<string, number> {
  const index = new Map<string, number>()
  for (const record of normalizeCatalogRecords(rawWorldBlooms)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const chapterNo = normalizeCatalogNumber(record.chapterNo)
    if (eventId == null || chapterNo == null) {
      continue
    }

    index.set(worldBloomChapterKey(eventId, normalizeCatalogNumber(record.gameCharacterId)), chapterNo)
  }

  return index
}

/** Groups World Link chapter records under their event, newest event first. */
export function buildWorldBloomGroups(
  records: readonly UserWorldBloomRecord[],
  eventsById: ReadonlyMap<number, SekaiEventItem>,
  chapterNoIndex?: ReadonlyMap<string, number>,
): WorldBloomGroup[] {
  const groups = new Map<number, WorldBloomGroup>()
  for (const record of records) {
    let group = groups.get(record.eventId)
    if (!group) {
      const event = eventsById.get(record.eventId) ?? null
      group = {
        eventId: record.eventId,
        event,
        name: event?.name ?? `#${record.eventId}`,
        chapters: [],
      }
      groups.set(record.eventId, group)
    }

    group.chapters.push({
      ...record,
      chapterNo: chapterNoIndex?.get(worldBloomChapterKey(record.eventId, record.gameCharacterId)) ?? null,
    })
  }

  for (const group of groups.values()) {
    group.chapters.sort(
      (a, b) =>
        (a.chapterNo ?? Number.MAX_SAFE_INTEGER) - (b.chapterNo ?? Number.MAX_SAFE_INTEGER) ||
        (a.gameCharacterId ?? Number.MAX_SAFE_INTEGER) - (b.gameCharacterId ?? Number.MAX_SAFE_INTEGER),
    )
  }

  return [...groups.values()].sort(compareByEventStartDesc)
}

/** A main-table row: an event record plus its World Link chapter sub-rows. */
export type EventRecordTableRow = {
  eventId: number
  event: SekaiEventItem | null
  name: string
  /** Null for World Link events that only have chapter records. */
  eventPoint: number | null
  rank: number | null
  chapters: WorldBloomChapterRow[]
}

/**
 * Merges World Link chapter groups into the main record rows: chapters attach
 * to their event's row as sub-rows, and groups without a main record become
 * standalone rows. Keeps event startAt-desc ordering.
 */
export function mergeWorldBloomIntoRows(
  rows: readonly EventRecordRow[],
  groups: readonly WorldBloomGroup[],
): EventRecordTableRow[] {
  const groupsByEvent = new Map(groups.map((group) => [group.eventId, group]))
  const merged: EventRecordTableRow[] = rows.map((row) => ({
    ...row,
    chapters: groupsByEvent.get(row.eventId)?.chapters ?? [],
  }))

  const recordedEventIds = new Set(rows.map((row) => row.eventId))
  for (const group of groups) {
    if (!recordedEventIds.has(group.eventId)) {
      merged.push({
        eventId: group.eventId,
        event: group.event,
        name: group.name,
        eventPoint: null,
        rank: null,
        chapters: group.chapters,
      })
    }
  }

  return merged.sort(compareByEventStartDesc)
}

/** Chronological (startAt asc) PT series; rows without a dated master event are skipped. */
export function buildEventPointTrend(
  rows: readonly EventRecordRow[],
  derivedRanks?: ReadonlyMap<string, EventRankTier>,
): EventPointTrendPoint[] {
  const points: EventPointTrendPoint[] = []
  for (const row of rows) {
    const startAt = row.event?.startAt
    if (startAt == null) {
      continue
    }

    points.push({
      eventId: row.eventId,
      name: row.name,
      startAt,
      eventPoint: row.eventPoint,
      rank: row.rank,
      derivedRank: row.rank == null
        ? derivedRanks?.get(derivedEventRankKey(row.eventId))?.toRank ?? null
        : null,
    })
  }

  return points.sort((a, b) => a.startAt - b.startAt || a.eventId - b.eventId)
}

/** Inclusive [start, end] index window over the trend series. */
export type TrendWindow = {
  start: number
  end: number
}

/** Above this many points the chart shows a brush strip and defaults to the most recent window. */
export const TREND_DEFAULT_WINDOW_SIZE = 40

/** Smallest number of points a zoom window may contain (a line needs two). */
export const TREND_MIN_WINDOW_SIZE = 2

/** Full series when short enough, otherwise the most recent `size` points. */
export function defaultTrendWindow(length: number, size: number = TREND_DEFAULT_WINDOW_SIZE): TrendWindow {
  const end = Math.max(0, length - 1)
  return length <= size ? { start: 0, end } : { start: length - size, end }
}

/**
 * Normalize a raw (possibly fractional, reversed, or out-of-bounds) brush
 * selection into valid inclusive indices spanning at least `minSize` points.
 */
export function clampTrendWindow(
  rawStart: number,
  rawEnd: number,
  length: number,
  minSize: number = TREND_MIN_WINDOW_SIZE,
): TrendWindow {
  const last = Math.max(0, length - 1)
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
    return { start: 0, end: last }
  }

  const clampIndex = (value: number) => Math.min(Math.max(Math.round(value), 0), last)
  let start = clampIndex(Math.min(rawStart, rawEnd))
  let end = clampIndex(Math.max(rawStart, rawEnd))

  // Widen too-small selections in place, preferring to grow rightwards.
  const minSpan = Math.min(Math.max(minSize, 1), Math.max(length, 1)) - 1
  if (end - start < minSpan) {
    end = Math.min(start + minSpan, last)
    start = Math.max(end - minSpan, 0)
  }

  return { start, end }
}

/** A ranking reward bracket; `toRank` is the tier ceiling shown as "T{toRank}". */
export type EventRankTier = {
  fromRank: number
  toRank: number
}

type HonorRankSource = {
  key: string
  tier: EventRankTier
}

export function derivedEventRankKey(eventId: number): string {
  return `event:${eventId}`
}

export function derivedChapterRankKey(eventId: number, gameCharacterId: number | null): string {
  return `chapter:${worldBloomChapterKey(eventId, gameCharacterId)}`
}

const EVENT_RANKING_BOX_PURPOSE = "event_ranking_reward"
const WORLD_BLOOM_CHAPTER_RANKING_BOX_PURPOSE = "world_bloom_chapter_ranking_reward"

/**
 * Honor ids per ranking resource box. jp/en nest detail rows inside
 * `resourceBoxes.json` (`details` arrays) while tw/kr/cn ship them flat in
 * `resourceBoxDetails.json`, so both sources are merged (same approach as
 * `buildChallengeBoxRewardMap`).
 */
function buildHonorIdsByResourceBox(
  rawBoxes: unknown,
  rawDetails: unknown,
  purpose: string,
): Map<number, number[]> {
  const details: Record<string, unknown>[] = []
  for (const record of normalizeCatalogRecords(rawBoxes)) {
    if (Array.isArray(record.details)) {
      appendCatalogRecords(details, record.details)
    } else {
      details.push(record)
    }
  }
  appendCatalogRecords(details, rawDetails)

  const map = new Map<number, number[]>()
  for (const record of details) {
    if (
      normalizeCatalogString(record.resourceBoxPurpose) !== purpose
      || normalizeCatalogString(record.resourceType) !== "honor"
    ) {
      continue
    }

    const resourceBoxId = normalizeCatalogNumber(record.resourceBoxId)
    const honorId = normalizeCatalogNumber(record.resourceId)
    if (resourceBoxId == null || honorId == null) {
      continue
    }

    const honorIds = map.get(resourceBoxId) ?? []
    honorIds.push(honorId)
    map.set(resourceBoxId, honorIds)
  }

  return map
}

function indexEventHonorRange(
  index: Map<number, HonorRankSource>,
  eventId: number,
  tier: EventRankTier,
  range: Record<string, unknown>,
  honorsByBox: ReadonlyMap<number, readonly number[]>,
): void {
  for (const reward of normalizeCatalogRecords(range.eventRankingRewards)) {
    const resourceBoxId = normalizeCatalogNumber(reward.resourceBoxId)
    const honorIds = resourceBoxId != null ? honorsByBox.get(resourceBoxId) ?? [] : []
    for (const honorId of honorIds) {
      index.set(honorId, { key: derivedEventRankKey(eventId), tier })
    }
  }
}

function indexEventRankingHonors(
  index: Map<number, HonorRankSource>,
  rawEvents: unknown,
  honorsByBox: ReadonlyMap<number, readonly number[]>,
): void {
  for (const eventRecord of normalizeCatalogRecords(rawEvents)) {
    const eventId = normalizeCatalogNumber(eventRecord.id)
    if (eventId == null) {
      continue
    }
    for (const range of normalizeCatalogRecords(eventRecord.eventRankingRewardRanges)) {
      const tier = normalizeRankTier(range)
      if (tier != null) {
        indexEventHonorRange(index, eventId, tier, range, honorsByBox)
      }
    }
  }
}

function indexChapterRankingHonors(
  index: Map<number, HonorRankSource>,
  rawChapterRanges: unknown,
  honorsByBox: ReadonlyMap<number, readonly number[]>,
): void {
  for (const range of normalizeCatalogRecords(rawChapterRanges)) {
    const eventId = normalizeCatalogNumber(range.eventId)
    const tier = normalizeRankTier(range)
    const resourceBoxId = normalizeCatalogNumber(range.resourceBoxId)
    if (eventId == null || tier == null || resourceBoxId == null) {
      continue
    }
    for (const honorId of honorsByBox.get(resourceBoxId) ?? []) {
      index.set(honorId, {
        key: derivedChapterRankKey(eventId, normalizeCatalogNumber(range.gameCharacterId)),
        tier,
      })
    }
  }
}

/**
 * Maps ranking honor ids to the event (or World Link chapter) rank bracket
 * they are awarded for. Main event brackets come embedded in `events.json`
 * (`eventRankingRewardRanges`), chapter brackets from
 * `worldBloomChapterRankingRewardRanges.json`; both resolve their reward
 * boxes' honors through `resourceBoxes`/`resourceBoxDetails`.
 */
export function buildHonorRankIndex(
  rawEvents: unknown,
  rawChapterRanges: unknown,
  rawResourceBoxes: unknown,
  rawResourceBoxDetails?: unknown,
): Map<number, HonorRankSource> {
  const index = new Map<number, HonorRankSource>()

  const eventHonorsByBox = buildHonorIdsByResourceBox(
    rawResourceBoxes,
    rawResourceBoxDetails,
    EVENT_RANKING_BOX_PURPOSE,
  )
  indexEventRankingHonors(index, rawEvents, eventHonorsByBox)

  const chapterHonorsByBox = buildHonorIdsByResourceBox(
    rawResourceBoxes,
    rawResourceBoxDetails,
    WORLD_BLOOM_CHAPTER_RANKING_BOX_PURPOSE,
  )
  indexChapterRankingHonors(index, rawChapterRanges, chapterHonorsByBox)

  return index
}

function normalizeRankTier(range: Record<string, unknown>): EventRankTier | null {
  const fromRank = normalizeCatalogNumber(range.fromRank)
  const toRank = normalizeCatalogNumber(range.toRank)
  if (fromRank == null || toRank == null || toRank <= 0) {
    return null
  }

  return { fromRank, toRank }
}

/** Parses a ranking honor name ("TOP100", "Top 1,000", "1位", "第1名", "1st", "3위") into a tier. */
export function parseHonorTierName(name: string): EventRankTier | null {
  const trimmed = name.trim()
  const top = /^top\s*([\d,]+)$/i.exec(trimmed)
  if (top) {
    const toRank = Number(top[1].replaceAll(",", ""))
    return Number.isFinite(toRank) && toRank > 0 ? { fromRank: 1, toRank } : null
  }

  const exact = /^第?(\d+)\s*(?:位|名|위)$/.exec(trimmed) ?? /^(\d+)(?:st|nd|rd|th)$/i.exec(trimmed)
  if (exact) {
    const rank = Number(exact[1])
    return Number.isFinite(rank) && rank > 0 ? { fromRank: rank, toRank: rank } : null
  }

  return null
}

/**
 * Fallback honor→rank index for dumps without `resourceBoxes.json` (currently
 * cn): honor groups are matched to events by name (any honorType — cn labels
 * old event groups `sekai_echo`) and the tier is parsed from the honor name.
 * Covers main event rankings only; the resource-box chain remains the
 * authoritative source where available.
 */
export function buildHonorRankIndexFromNames(
  rawHonors: unknown,
  rawHonorGroups: unknown,
  rawEvents: unknown,
): Map<number, HonorRankSource> {
  const eventIdByName = new Map<string, number>()
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    const name = normalizeCatalogString(record.name)
    if (id != null && name !== "" && !eventIdByName.has(name)) {
      eventIdByName.set(name, id)
    }
  }

  const eventIdByGroup = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawHonorGroups)) {
    const id = normalizeCatalogNumber(record.id)
    const eventId = eventIdByName.get(normalizeCatalogString(record.name))
    if (id != null && eventId != null) {
      eventIdByGroup.set(id, eventId)
    }
  }

  const index = new Map<number, HonorRankSource>()
  for (const record of normalizeCatalogRecords(rawHonors)) {
    const honorId = normalizeCatalogNumber(record.id)
    const groupId = normalizeCatalogNumber(record.groupId)
    const eventId = groupId != null ? eventIdByGroup.get(groupId) : undefined
    if (honorId == null || eventId == null) {
      continue
    }

    const tier = parseHonorTierName(normalizeCatalogString(record.name))
    if (tier != null) {
      index.set(honorId, { key: derivedEventRankKey(eventId), tier })
    }
  }

  return index
}

/** Owned honor ids from the suite `userHonors` array. */
export function normalizeUserHonorIds(value: unknown): Set<number> {
  const ids = new Set<number>()
  for (const record of normalizeCatalogRecords(value)) {
    const honorId = normalizeCatalogNumber(record.honorId)
    if (honorId != null && honorId > 0) {
      ids.add(honorId)
    }
  }

  return ids
}

/**
 * Best (lowest ceiling) rank bracket per event/chapter derived from the
 * player's owned ranking honors. Keys come from `derivedEventRankKey` /
 * `derivedChapterRankKey`.
 */
export function buildDerivedRankMap(
  ownedHonorIds: ReadonlySet<number>,
  honorRankIndex: ReadonlyMap<number, HonorRankSource>,
): Map<string, EventRankTier> {
  const map = new Map<string, EventRankTier>()
  for (const honorId of ownedHonorIds) {
    const source = honorRankIndex.get(honorId)
    if (source == null) {
      continue
    }

    const existing = map.get(source.key)
    if (existing == null || source.tier.toRank < existing.toRank) {
      map.set(source.key, source.tier)
    }
  }

  return map
}

/** "T{toRank}" label for a derived rank bracket (e.g. T100). */
export function formatDerivedRankTier(tier: EventRankTier): string {
  return `T${tier.toRank}`
}

export function summarizeEventRecords(records: readonly UserEventRecord[]): EventRecordsSummary {
  if (records.length === 0) {
    return { participated: 0, bestPoint: null, averagePoint: null }
  }

  let total = 0
  let best: number | null = null
  for (const record of records) {
    total += record.eventPoint
    if (best == null || record.eventPoint > best) {
      best = record.eventPoint
    }
  }

  return {
    participated: records.length,
    bestPoint: best,
    averagePoint: Math.round(total / records.length),
  }
}

/** Page filters over the merged record rows; every field is optional/empty for "no filter". */
export type EventRecordTableFilters = {
  from: number | null
  to: number | null
  types: readonly SekaiEventType[]
  units: readonly string[]
}

/**
 * Applies the time window, type and unit filters. Rows whose event is
 * missing from masterdata have no date, so they only survive an open window;
 * type / unit filters drop them outright.
 */
export function filterEventRecordTableRows(
  rows: readonly EventRecordTableRow[],
  filters: EventRecordTableFilters,
): EventRecordTableRow[] {
  return rows.filter((row) => {
    const startAt = row.event?.startAt ?? null
    if (filters.from != null || filters.to != null) {
      if (startAt == null) {
        return false
      }
      if (filters.from != null && startAt < filters.from) {
        return false
      }
      if (filters.to != null && startAt > filters.to) {
        return false
      }
    }

    if (filters.types.length > 0) {
      const eventType = row.event?.eventType ?? null
      if (eventType == null || !filters.types.includes(eventType)) {
        return false
      }
    }

    if (filters.units.length > 0) {
      const unit = row.event?.unit ?? null
      if (unit == null || !filters.units.includes(unit)) {
        return false
      }
    }

    return true
  })
}

/** Time window presets of the records page. */
export const EVENT_RECORD_TIME_MODES = ["year", "all", "custom"] as const

export type EventRecordTimeMode = (typeof EVENT_RECORD_TIME_MODES)[number]

export function isEventRecordTimeMode(value: string): value is EventRecordTimeMode {
  return (EVENT_RECORD_TIME_MODES as readonly string[]).includes(value)
}

export const EVENT_RECORD_SORTS = ["time", "point", "rank"] as const

export type EventRecordSort = (typeof EVENT_RECORD_SORTS)[number]

export function isEventRecordSort(value: string): value is EventRecordSort {
  return (EVENT_RECORD_SORTS as readonly string[]).includes(value)
}

/**
 * Sorted copy: newest first, highest PT first, or best rank first. `rankOf`
 * supplies the rank to compare (exact, or the tier ceiling derived from
 * honors); rows without one trail the ranked rows in time order.
 */
export function sortEventRecordTableRows(
  rows: readonly EventRecordTableRow[],
  sort: EventRecordSort,
  rankOf: (row: EventRecordTableRow) => number | null = (row) => row.rank,
): EventRecordTableRow[] {
  const sorted = [...rows]
  if (sort === "point") {
    return sorted.sort((a, b) =>
      (b.eventPoint ?? -1) - (a.eventPoint ?? -1) || compareByEventStartDesc(a, b))
  }

  if (sort === "rank") {
    return sorted.sort((a, b) => {
      const rankA = rankOf(a)
      const rankB = rankOf(b)
      if (rankA == null || rankB == null) {
        return (rankA == null ? 1 : 0) - (rankB == null ? 1 : 0) || compareByEventStartDesc(a, b)
      }
      return rankA - rankB || compareByEventStartDesc(a, b)
    })
  }

  return sorted.sort(compareByEventStartDesc)
}

export type EventRecordRowsSummary = EventRecordsSummary & {
  /** Best exact rank across the rows; null when no row carries one. */
  bestRank: number | null
  /** Rows with an exact rank. */
  rankedCount: number
}

/** Summary over the rows on screen (after filters); World Link rows without a main record are not participations. */
export function summarizeEventRecordTableRows(rows: readonly EventRecordTableRow[]): EventRecordRowsSummary {
  const participations = rows.filter((row) => row.eventPoint != null)
  const base = summarizeEventRecords(participations.map((row) => ({
    eventId: row.eventId,
    eventPoint: row.eventPoint ?? 0,
    rank: row.rank,
  })))

  let bestRank: number | null = null
  let rankedCount = 0
  for (const row of rows) {
    if (row.rank != null) {
      rankedCount += 1
      bestRank = bestRank == null ? row.rank : Math.min(bestRank, row.rank)
    }
  }

  return { ...base, bestRank, rankedCount }
}
