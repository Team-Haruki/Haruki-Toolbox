import { request } from "@/core/http/call-api"
import type { RiskRule } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/risk"

export async function getRiskRules() {
  const res = await request<APIResponse<RiskRule[]>>(`${BASE}/rules`, { method: "GET" })
  return res.updatedData ?? []
}

export function updateRiskRules(data: RiskRule[]) {
  return request(`${BASE}/rules`, { method: "PUT", data })
}
