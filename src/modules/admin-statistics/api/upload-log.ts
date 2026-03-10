import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import type { UploadLogsResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const STATS_BASE = "/api/admin/statistics"

export async function getUploadLogs(params?: QueryParams) {
  const res = await request<APIResponse<UploadLogsResponse>>(`${STATS_BASE}/upload-logs`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminStatistics.uploadLogs.toast.loadFailedTitle"))
}
