import { readUpdatedItems, request, unwrapUpdatedData } from "@/core/http/call-api"
import type { APIResponse } from "@/types/response"
import { userBase, type UserOAuthAuthorization } from "@/modules/admin-users/api/shared"
import { translate } from "@/shared/i18n"

export async function getUserOAuthAuthorizations(userId: string): Promise<UserOAuthAuthorization[]> {
  const res = await request<APIResponse<UserOAuthAuthorization[] | { items?: UserOAuthAuthorization[] }>>(
    `${userBase(userId)}/oauth-authorizations`,
    { method: "GET" }
  )
  const data = unwrapUpdatedData(res, translate("adminUsers.detail.toast.loadOAuthFailedTitle"))
  return readUpdatedItems<UserOAuthAuthorization>(data)
}

export function revokeUserOAuth(userId: string) {
  return request(`${userBase(userId)}/revoke-oauth`, { method: "POST" })
}

export type { UserOAuthAuthorization } from "@/modules/admin-users/api/shared"
