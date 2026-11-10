import type { LocationQuery } from "vue-router"
import type { QueryParams } from "@/core/http/query"
import { readQueryEnum, readQueryString } from "@/lib/query-codec"

/**
 * The system-log page's filters: what the URL carries and what the backend
 * is asked (`GET /api/admin/system-logs` and `/summary` take the same
 * filters: `action`, `result`, `actor_type`, `from`).
 */

/** How far back the page looks. The backend covers 24 hours unless asked for more, and at most 30 days. */
export const SYSTEM_LOG_RANGES = ["24h", "7d", "30d"] as const
export type SystemLogRange = (typeof SYSTEM_LOG_RANGES)[number]
export const DEFAULT_SYSTEM_LOG_RANGE: SystemLogRange = "24h"

export const SYSTEM_LOG_RESULT_FILTERS = ["all", "success", "failure"] as const
export type SystemLogResultFilter = (typeof SYSTEM_LOG_RESULT_FILTERS)[number]

export const SYSTEM_LOG_ACTOR_TYPE_FILTERS = ["all", "anonymous", "user", "admin", "system"] as const
export type SystemLogActorTypeFilter = (typeof SYSTEM_LOG_ACTOR_TYPE_FILTERS)[number]

export type SystemLogFilters = {
  /** Matches part of the action name, case-insensitively. */
  search: string
  result: SystemLogResultFilter
  actorType: SystemLogActorTypeFilter
  range: SystemLogRange
}

export function createDefaultSystemLogFilters(): SystemLogFilters {
  return { search: "", result: "all", actorType: "all", range: DEFAULT_SYSTEM_LOG_RANGE }
}

/** Filters from a shared or restored URL; unknown values fall back to the defaults. */
export function parseSystemLogFiltersQuery(query: LocationQuery): SystemLogFilters {
  return {
    search: readQueryString(query.q) ?? "",
    result: readQueryEnum(query.result, SYSTEM_LOG_RESULT_FILTERS) ?? "all",
    actorType: readQueryEnum(query.actor, SYSTEM_LOG_ACTOR_TYPE_FILTERS) ?? "all",
    range: readQueryEnum(query.range, SYSTEM_LOG_RANGES) ?? DEFAULT_SYSTEM_LOG_RANGE,
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
// The backend rejects a range longer than 30 days measured against its own
// clock, so the longest preset stops a few minutes short of it.
const RANGE_MARGIN_MS = 10 * 60 * 1000

/** The `from` to send for a range; null for the default 24 hours, which the backend applies by itself. */
export function resolveSystemLogRangeStart(range: SystemLogRange, nowMs: number): string | null {
  switch (range) {
    case "7d":
      return new Date(nowMs - 7 * DAY_MS).toISOString()
    case "30d":
      return new Date(nowMs - 30 * DAY_MS + RANGE_MARGIN_MS).toISOString()
    default:
      return null
  }
}

/** The filter part of a list, summary or export request (paging is added by the caller). */
export function buildSystemLogFilterParams(filters: SystemLogFilters, nowMs: number): QueryParams {
  const params: QueryParams = {}
  const action = filters.search.trim()
  if (action) {
    params.action = action
  }
  if (filters.result !== "all") {
    params.result = filters.result
  }
  if (filters.actorType !== "all") {
    params.actor_type = filters.actorType
  }
  const from = resolveSystemLogRangeStart(filters.range, nowMs)
  if (from) {
    params.from = from
  }
  return params
}

/** How many filters narrow the list (the range is a scope, not a narrowing). */
export function countActiveSystemLogFilters(filters: SystemLogFilters): number {
  return (filters.search.trim() ? 1 : 0) + (filters.result !== "all" ? 1 : 0) + (filters.actorType !== "all" ? 1 : 0)
}

/** "type:id" of the thing a log acted on, or null when it names neither. */
export function resolveSystemLogTarget(log: { targetType?: string | null; targetId?: string | null }): string | null {
  const type = log.targetType?.trim() ?? ""
  const id = log.targetId?.trim() ?? ""
  if (!type && !id) {
    return null
  }
  return type && id ? `${type}:${id}` : type || id
}

/**
 * What the detail dialog prints under "Detail": the log's metadata object
 * (older payloads carried a JSON string in `detail`), pretty-printed when it
 * is JSON and as the raw text otherwise. Empty when there is nothing to show.
 */
export function formatSystemLogMetadata(log: { metadata?: unknown; detail?: string | null } | null | undefined): string {
  if (!log) {
    return ""
  }
  const metadata = log.metadata
  if (metadata != null && typeof metadata === "object") {
    if (Object.keys(metadata).length === 0) {
      return ""
    }
    try {
      return JSON.stringify(metadata, null, 2)
    } catch {
      return ""
    }
  }
  const raw = (typeof metadata === "string" ? metadata : log.detail ?? "").trim()
  if (!raw) {
    return ""
  }
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
