import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { encodePathSegment } from "@/core/http/url"
import { translate } from "@/shared/i18n"
import type { CreateRiskEventRequest, PaginatedResponse, RiskEvent } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/risk"

export async function getRiskEvents(params?: QueryParams) {
  const res = await request<APIResponse<PaginatedResponse<RiskEvent>>>(`${BASE}/events`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminRisk.toast.loadEventsFailedTitle"))
}

export function createRiskEvent(data: CreateRiskEventRequest) {
  return request(`${BASE}/events`, { method: "POST", data })
}

export function resolveRiskEvent(eventId: string) {
  return request(`${BASE}/events/${encodePathSegment(eventId)}/resolve`, { method: "POST" })
}
