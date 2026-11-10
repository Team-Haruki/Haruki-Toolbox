import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { asRecord } from "@/lib/record-utils"
import { readAllowedKeys } from "@/modules/admin-config/lib/allowed-keys"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/config"

/** The allowlist of top-level game-data keys, in the backend's order. */
export async function getPublicApiKeys(): Promise<string[]> {
  const res = await request<APIResponse<unknown>>(`${BASE}/public-api-keys`, { method: "GET" })
  return readAllowedKeys(unwrapUpdatedData(res, translate("adminConfig.allowedKeys.loadFailed")))
}

/**
 * Replaces the allowlist; the backend drops its game-data cache in the same
 * step. Resolves with the list the backend stored, or with the list sent when
 * the response carries none.
 */
export async function updatePublicApiKeys(keys: readonly string[]): Promise<string[]> {
  const sent = [...keys]
  const res = await request<APIResponse<unknown>>(`${BASE}/public-api-keys`, {
    method: "PUT",
    data: { publicApiAllowedKeys: sent },
  })
  const stored = asRecord(res?.updatedData)
  return Array.isArray(stored?.publicApiAllowedKeys) ? readAllowedKeys(stored) : sent
}
