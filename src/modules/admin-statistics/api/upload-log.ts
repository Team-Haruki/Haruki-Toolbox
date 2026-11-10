import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import type { UploadLogsResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const STATS_BASE = "/api/admin/statistics"

/** The figures the backend computes for the whole range and for each group (`adminstats.uploadAnalyticsMetrics`). */
export interface UploadLogAnalyticsMetrics {
  attemptCount: number
  successCount: number
  failureCount: number
  /** 0–1; null when nothing was attempted. */
  successRate: number | null
  /** Distinct verified game accounts with a successful upload. */
  activeGameAccounts: number
  /** How many uploads recorded a processing time. */
  latencySampleCount: number
  latencyP50Ms: number | null
  latencyP95Ms: number | null
  metadataCount: number
  metadataCoverage: number | null
}

export interface UploadLogAnalyticsGroup extends UploadLogAnalyticsMetrics {
  /** One entry per `group_by` dimension, plus `bucket` (UTC bucket start) when an interval was asked for. */
  dimensions: Record<string, string | null>
}

/**
 * `GET /statistics/upload-analytics` (`adminstats.uploadAnalyticsResponse`):
 * aggregates over every upload matching the filters, not over one page. Only
 * the fields the log page reads are typed here.
 */
export interface UploadLogAnalyticsResponse {
  from: string
  to: string
  groupBy: string[]
  interval?: string
  summary: UploadLogAnalyticsMetrics
  groups: UploadLogAnalyticsGroup[] | null
  /** Failed uploads by the stage they failed at; "unknown" when none was recorded. */
  byFailureStage: Record<string, number> | null
}

export async function getUploadLogs(params?: QueryParams) {
  const res = await request<APIResponse<UploadLogsResponse>>(`${STATS_BASE}/upload-logs`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.uploadLogs.toast.loadFailedTitle"))
}

/**
 * Takes the upload-log filters (`from`, `to`, `game_user_id`, `upload_method`,
 * `data_type`, `server`, `success`) plus `group_by` (up to two dimensions)
 * and `interval` (`hour` or `day`).
 */
export async function getUploadLogAnalytics(params?: QueryParams) {
  const res = await request<APIResponse<UploadLogAnalyticsResponse>>(`${STATS_BASE}/upload-analytics`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.uploadLogs.toast.loadAnalyticsFailedTitle"))
}
