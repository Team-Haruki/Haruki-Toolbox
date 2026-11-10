import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import type { PaginatedResponse, SystemLog, SystemLogSummary } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const LOGS_BASE = "/api/admin/system-logs"

type CategoryCount = { key: string; count: number }

/**
 * A system log as the backend sends it (`admincore.SystemLogListItem`): on top
 * of the shared `SystemLog` fields it names the kind of actor, the thing acted
 * on, the request id and a free-form metadata object.
 */
export type SystemLogEntry = SystemLog & {
  /** anonymous / user / admin / system */
  actorType?: string
  targetType?: string
  targetId?: string
  requestId?: string
  metadata?: Record<string, unknown> | null
}

/** The list answers for a time window: the last 24 hours unless `from`/`to` say otherwise. */
export type SystemLogListResponse = PaginatedResponse<SystemLogEntry> & {
  from?: string
  to?: string
}

/**
 * `GET /system-logs/summary` (`adminsyslog.systemLogSummaryResponse`): the
 * counts and breakdowns of every log matching the filters inside the window,
 * not of one page.
 */
export type SystemLogSummaryDetail = SystemLogSummary & {
  generatedAt?: string
  from?: string
  to?: string
  byAction?: CategoryCount[] | null
  byActorType?: CategoryCount[] | null
  byResult?: CategoryCount[] | null
  /** Failed logs by `metadata.reason`; "unknown" when a log carries none. */
  byReason?: CategoryCount[] | null
}

export async function getSystemLogs(params?: QueryParams) {
  const res = await request<APIResponse<SystemLogListResponse>>(LOGS_BASE, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.systemLogs.toast.loadFailedTitle"))
}

/** Takes the same filters as the list (`action`, `result`, `actor_type`, `from`, `to`). */
export async function getSystemLogSummary(params?: QueryParams) {
  const res = await request<APIResponse<SystemLogSummaryDetail>>(`${LOGS_BASE}/summary`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.systemLogs.toast.loadSummaryFailedTitle"))
}

export function exportSystemLogs(params?: QueryParams) {
  return request<Blob>(`${LOGS_BASE}/export`, {
    method: "GET",
    params,
    responseType: "blob",
  })
}

export async function getSystemLogDetail(id: string) {
  const res = await request<APIResponse<SystemLogEntry>>(`${LOGS_BASE}/${encodePathSegment(id)}`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminStatistics.systemLogs.toast.loadDetailFailedTitle"))
}
