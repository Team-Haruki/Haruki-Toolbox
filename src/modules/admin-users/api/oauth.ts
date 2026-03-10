import { request } from "@/core/http/call-api"
import type { APIResponse } from "@/types/response"
import { userBase, type UserOAuthAuthorization } from "@/modules/admin-users/api/shared"

export function getUserOAuthAuthorizations(userId: string): Promise<UserOAuthAuthorization[]> {
  return request<APIResponse<UserOAuthAuthorization[] | { items?: UserOAuthAuthorization[] }>>(
    `${userBase(userId)}/oauth-authorizations`,
    { method: "GET" }
  ).then((res) => {
    const data = res.updatedData
    if (Array.isArray(data)) return data
    return data?.items ?? []
  })
}

export function revokeUserOAuth(userId: string) {
  return request(`${userBase(userId)}/revoke-oauth`, { method: "POST" })
}

export type { UserOAuthAuthorization } from "@/modules/admin-users/api/shared"
