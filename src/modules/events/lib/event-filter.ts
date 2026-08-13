import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"

export const SEKAI_EVENT_TYPES = ["marathon", "cheerful_carnival", "world_bloom"] as const

export type SekaiEventType = (typeof SEKAI_EVENT_TYPES)[number]

export type SekaiEventStatus = "upcoming" | "ongoing" | "ended"

export type SekaiEventItem = {
  id: number
  name: string
  eventType: SekaiEventType | null
  assetbundleName: string | null
  unit: string | null
  startAt: number | null
  aggregateAt: number | null
  closedAt: number | null
}

export type SekaiWorldBloomChapter = {
  id: number
  eventId: number
  gameCharacterId: number | null
  chapterNo: number | null
  chapterStartAt: number | null
  aggregateAt: number | null
  chapterEndAt: number | null
  chapterType: string | null
  isSupplemental: boolean
}

export type EventFilterOptions = {
  search?: string
  eventType?: SekaiEventType | null
  bonusAttr?: string | null
  year?: number | null
}

export function isSekaiEventType(value: unknown): value is SekaiEventType {
  return typeof value === "string" && (SEKAI_EVENT_TYPES as readonly string[]).includes(value)
}

/** Master data timestamps are epoch milliseconds; tolerate second-based values. */
export function normalizeEventTimestamp(value: unknown): number | null {
  const parsed = normalizeCatalogNumber(value)
  if (parsed == null || parsed <= 0) {
    return null
  }

  return parsed < 10_000_000_000 ? parsed * 1000 : parsed
}

export function normalizeEventItem(value: unknown): SekaiEventItem | null {
  if (value == null || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (!id || id <= 0) {
    return null
  }

  const eventType = normalizeCatalogString(record.eventType)
  const unit = normalizeCatalogString(record.unit)
  return {
    id,
    name: normalizeCatalogString(record.name) || `#${id}`,
    eventType: isSekaiEventType(eventType) ? eventType : null,
    assetbundleName: normalizeCatalogString(record.assetbundleName) || null,
    unit: unit && unit !== "none" ? unit : null,
    startAt: normalizeEventTimestamp(record.startAt),
    aggregateAt: normalizeEventTimestamp(record.aggregateAt),
    closedAt: normalizeEventTimestamp(record.closedAt),
  }
}

export function normalizeEventItems(value: unknown): SekaiEventItem[] {
  return normalizeCatalogRecords(value)
    .map((record) => normalizeEventItem(record))
    .filter((item): item is SekaiEventItem => item != null)
}

export function resolveEventStatus(event: SekaiEventItem, nowMs = Date.now()): SekaiEventStatus {
  if (event.startAt != null && nowMs < event.startAt) {
    return "upcoming"
  }

  const endAt = event.aggregateAt ?? event.closedAt
  if (event.startAt != null && endAt != null && nowMs <= endAt) {
    return "ongoing"
  }

  return "ended"
}

/** An event counts as unreleased while its start timestamp is in the future. */
export function isEventUnreleased(event: SekaiEventItem, nowMs = Date.now()): boolean {
  return isUnreleasedContent(event.startAt, nowMs)
}

export function excludeUnreleasedEvents(
  events: readonly SekaiEventItem[],
  nowMs = Date.now(),
): SekaiEventItem[] {
  return events.filter((event) => !isEventUnreleased(event, nowMs))
}

export function resolveEventYear(event: SekaiEventItem): number | null {
  if (event.startAt == null) {
    return null
  }

  return new Date(event.startAt).getFullYear()
}

export function collectEventYears(events: readonly SekaiEventItem[]): number[] {
  const years = new Set<number>()
  for (const event of events) {
    const year = resolveEventYear(event)
    if (year != null) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}

export function sortEventsByStartAtDesc(events: readonly SekaiEventItem[]): SekaiEventItem[] {
  return [...events].sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0) || b.id - a.id)
}

export function filterEvents(
  events: readonly SekaiEventItem[],
  options: EventFilterOptions,
  bonusAttrsByEventId?: ReadonlyMap<number, ReadonlySet<string>>,
): SekaiEventItem[] {
  const search = options.search?.trim().toLowerCase() ?? ""
  const eventType = options.eventType ?? null
  const bonusAttr = options.bonusAttr ?? null
  const year = options.year ?? null

  return events.filter((event) => {
    if (search && !event.name.toLowerCase().includes(search) && String(event.id) !== search) {
      return false
    }

    if (eventType && event.eventType !== eventType) {
      return false
    }

    if (bonusAttr && !(bonusAttrsByEventId?.get(event.id)?.has(bonusAttr) ?? false)) {
      return false
    }

    if (year != null && resolveEventYear(event) !== year) {
      return false
    }

    return true
  })
}

export type EventCountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Splits a positive millisecond delta into countdown parts; null when already elapsed. */
export function splitEventCountdown(targetMs: number, nowMs = Date.now()): EventCountdownParts | null {
  const diff = targetMs - nowMs
  if (diff <= 0) {
    return null
  }

  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function normalizeWorldBloomChapters(value: unknown, eventId: number): SekaiWorldBloomChapter[] {
  return normalizeCatalogRecords(value)
    .map((record): SekaiWorldBloomChapter | null => {
      const id = normalizeCatalogNumber(record.id)
      const chapterEventId = normalizeCatalogNumber(record.eventId)
      if (!id || chapterEventId !== eventId) {
        return null
      }

      return {
        id,
        eventId,
        gameCharacterId: normalizeCatalogNumber(record.gameCharacterId),
        chapterNo: normalizeCatalogNumber(record.chapterNo),
        chapterStartAt: normalizeEventTimestamp(record.chapterStartAt),
        aggregateAt: normalizeEventTimestamp(record.aggregateAt),
        chapterEndAt: normalizeEventTimestamp(record.chapterEndAt),
        chapterType: normalizeCatalogString(record.worldBloomChapterType) || null,
        isSupplemental: record.isSupplemental === true,
      }
    })
    .filter((chapter): chapter is SekaiWorldBloomChapter => chapter != null)
    .sort((a, b) => (a.chapterNo ?? Number.MAX_SAFE_INTEGER) - (b.chapterNo ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
}
