import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import type { PaginatedResponse, SystemLog, SystemLogSummary } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const LOGS_BASE = "/api/admin/system-logs"

export async function getSystemLogs(params?: QueryParams) {
  const res = await request<APIResponse<PaginatedResponse<SystemLog>>>(LOGS_BASE, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.systemLogs.toast.loadFailedTitle"))
}

export async function getSystemLogSummary() {
  const res = await request<APIResponse<SystemLogSummary>>(`${LOGS_BASE}/summary`, { method: "GET" })
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
  const res = await request<APIResponse<SystemLog>>(`${LOGS_BASE}/${encodePathSegment(id)}`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminStatistics.systemLogs.toast.loadDetailFailedTitle"))
}
