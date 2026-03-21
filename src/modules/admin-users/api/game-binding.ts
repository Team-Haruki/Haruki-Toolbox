import { readUpdatedItems, request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { normalizeGameAccountBinding, userBase } from "@/modules/admin-users/api/shared"
import { translate } from "@/shared/i18n"
import type { AdminGameAccountBinding } from "@/types/admin"
import type { MysekaiDataPrivacySettings, SekaiRegion, SuiteDataPrivacySettings } from "@/types/store"
import type { APIResponse } from "@/types/response"
import type { UnknownRecord } from "@/lib/record-utils"

export async function getGameAccountBindings(userId: string) {
  const res = await request<APIResponse<{ total?: number; items?: UnknownRecord[] }>>(
    `${userBase(userId)}/game-account-bindings`,
    { method: "GET" }
  )
  const updatedData = unwrapUpdatedData(res, translate("adminUsers.detail.toast.loadGameBindingsFailedTitle"))
  const items = readUpdatedItems(updatedData)
  return items
    .map((item) => normalizeGameAccountBinding(item))
    .filter((item): item is AdminGameAccountBinding => item !== null)
}

export function updateGameAccountBinding(
  userId: string,
  server: SekaiRegion,
  gameUserId: string,
  options: {
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
  }
) {
  const data: {
    suite?: SuiteDataPrivacySettings
    mysekai?: MysekaiDataPrivacySettings
  } = {}
  if (options.suite) data.suite = options.suite
  if (options.mysekai) data.mysekai = options.mysekai
  const normalizedServer = encodePathSegment(server)
  const normalizedGameUserId = encodePathSegment(gameUserId)
  return request(`${userBase(userId)}/game-account-bindings/${normalizedServer}/${normalizedGameUserId}`, {
    method: "PUT",
    data,
  })
}

export function updateAllowCNMysekai(userId: string, allow: boolean) {
  return request(`${userBase(userId)}/allow-cn-mysekai`, {
    method: "PUT",
    data: { allowCNMysekai: allow },
  })
}

export function deleteGameAccountBinding(userId: string, server: SekaiRegion, gameUserId: string) {
  const normalizedServer = encodePathSegment(server)
  const normalizedGameUserId = encodePathSegment(gameUserId)
  return request(`${userBase(userId)}/game-account-bindings/${normalizedServer}/${normalizedGameUserId}`, {
    method: "DELETE",
  })
}
