import { request } from "@/core/http/call-api"
import { ADMIN_REAUTH_ENDPOINT } from "@/lib/admin-reauth"
import type { AdminReauthResult } from "@/types/admin"
import type { APIResponse } from "@/types/response"

/** Confirms the admin's password and marks the current session as recently re-authenticated. */
export function reauthenticateAdmin(password: string) {
  return request<APIResponse<AdminReauthResult>>(ADMIN_REAUTH_ENDPOINT, {
    method: "POST",
    data: { password },
    skipAdminReauth: true,
  })
}
