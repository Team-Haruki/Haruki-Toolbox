import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { translate } from "@/shared/i18n"
import type { PublicApiKeys } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/config"

export async function getPublicApiKeys() {
  const res = await request<APIResponse<PublicApiKeys>>(`${BASE}/public-api-keys`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminConfig.toast.loadApiKeysFailedTitle"))
}

export function updatePublicApiKeys(data: PublicApiKeys) {
  return request(`${BASE}/public-api-keys`, { method: "PUT", data })
}
