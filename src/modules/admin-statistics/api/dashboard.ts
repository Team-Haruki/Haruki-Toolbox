import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import type { DashboardData, TimeseriesResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const STATS_BASE = "/api/admin/statistics"

export async function getDashboard(params?: QueryParams) {
  const res = await request<APIResponse<DashboardData>>(`${STATS_BASE}/dashboard`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.dashboard.toast.loadFailedTitle"))
}

export async function getTimeseries(params?: QueryParams) {
  const res = await request<APIResponse<TimeseriesResponse>>(`${STATS_BASE}/timeseries`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.dashboard.toast.loadChartFailedTitle"))
}
