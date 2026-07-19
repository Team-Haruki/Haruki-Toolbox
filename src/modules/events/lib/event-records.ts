import { normalizeCatalogNumber, normalizeCatalogRecords } from "@/shared/sekai/catalog"
import { normalizeEventTimestamp, type SekaiEventItem } from "./event-filter"

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

/** Chronological (startAt asc) PT series; rows without a dated master event are skipped. */
export function buildEventPointTrend(rows: readonly EventRecordRow[]): EventPointTrendPoint[] {
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
    })
  }

  return points.sort((a, b) => a.startAt - b.startAt || a.eventId - b.eventId)
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
