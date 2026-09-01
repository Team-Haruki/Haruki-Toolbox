import type { CatalogStatus } from "@/shared/components/catalog/types"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"
import { resolveEventEndAt } from "@/modules/events/lib/event-list"

export type EventTimelineRowKey = "start" | "aggregate" | "rankingAnnounce" | "distributionStart" | "closed"

export type EventTimelineRow = {
  key: EventTimelineRowKey
  at: number | null
  /** The instant is in the past at `nowMs`. */
  reached: boolean
}

type TimelineEvent = Pick<SekaiEventItem, "startAt" | "aggregateAt" | "rankingAnnounceAt" | "distributionStartAt" | "closedAt">

/**
 * Timeline rows in chronological order. Start / aggregate / closed always
 * render (with a dash when unknown); ranking announcement and reward
 * distribution only when the dump carries them.
 */
export function buildEventTimeline(event: TimelineEvent, nowMs: number): EventTimelineRow[] {
  const rows: EventTimelineRow[] = [
    { key: "start", at: event.startAt, reached: event.startAt != null && event.startAt <= nowMs },
    { key: "aggregate", at: event.aggregateAt, reached: event.aggregateAt != null && event.aggregateAt <= nowMs },
  ]
  if (event.rankingAnnounceAt != null) {
    rows.push({ key: "rankingAnnounce", at: event.rankingAnnounceAt, reached: event.rankingAnnounceAt <= nowMs })
  }
  if (event.distributionStartAt != null) {
    rows.push({ key: "distributionStart", at: event.distributionStartAt, reached: event.distributionStartAt <= nowMs })
  }
  rows.push({ key: "closed", at: event.closedAt, reached: event.closedAt != null && event.closedAt <= nowMs })
  return rows
}

export type EventCountdownTarget = {
  kind: "start" | "aggregate"
  targetMs: number
  /** Window start for the progress bar (ongoing only). */
  startMs: number | null
}

/** What the detail countdown counts towards, if anything. */
export function resolveEventCountdownTarget(event: TimelineEvent, status: CatalogStatus): EventCountdownTarget | null {
  if (status === "upcoming" && event.startAt != null) {
    return { kind: "start", targetMs: event.startAt, startMs: null }
  }
  const endAt = resolveEventEndAt(event)
  if (status === "ongoing" && endAt != null) {
    return { kind: "aggregate", targetMs: endAt, startMs: event.startAt }
  }
  return null
}
