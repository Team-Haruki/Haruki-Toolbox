import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { translate } from "@/shared/i18n"
import type { RuntimeConfig } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/config"

export async function getRuntimeConfig() {
  const res = await request<APIResponse<RuntimeConfig>>(`${BASE}/runtime`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminConfig.toast.loadRuntimeFailedTitle"))
}

export function updateRuntimeConfig(data: RuntimeConfig) {
  return request(`${BASE}/runtime`, { method: "PUT", data })
}
