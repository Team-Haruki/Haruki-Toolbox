import { request } from "@/api/call-api"
import type { RiskEvent, RiskRule, CreateRiskEventRequest, PaginatedResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/risk"

export async function getRiskEvents(params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<RiskEvent>>>(`${BASE}/events`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export function createRiskEvent(data: CreateRiskEventRequest) {
    return request(`${BASE}/events`, { method: "POST", data })
}

export function resolveRiskEvent(eventId: string) {
    return request(`${BASE}/events/${eventId}/resolve`, { method: "POST" })
}

export async function getRiskRules() {
    const res = await request<APIResponse<RiskRule[]>>(`${BASE}/rules`, { method: "GET" })
    return res.updatedData ?? []
}

export function updateRiskRules(data: RiskRule[]) {
    return request(`${BASE}/rules`, { method: "PUT", data })
}
