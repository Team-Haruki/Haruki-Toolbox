import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { translate } from "@/shared/i18n"
import type { AdminSession } from "@/types/admin"
import type { APIResponse } from "@/types/response"
import type { AxiosRequestConfig } from "axios"

const BASE = "/api/admin/me"

interface SessionsResponse {
  userId: string
  total: number
  items: AdminSession[]
}

export async function getAdminSessions(options?: AxiosRequestConfig) {
  const res = await request<APIResponse<SessionsResponse>>(`${BASE}/sessions`, { method: "GET", ...options })
  return unwrapUpdatedData(res, translate("adminSessions.toast.loadFailedTitle")).items
}

export function deleteAdminSession(tokenId: string, options?: AxiosRequestConfig) {
  return request(`${BASE}/sessions/${encodePathSegment(tokenId)}`, { method: "DELETE", ...options })
}
