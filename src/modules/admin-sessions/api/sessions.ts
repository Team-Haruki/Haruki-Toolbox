import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { translate } from "@/shared/i18n"
import type { AdminSession } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/me"

interface SessionsResponse {
  userId: string
  total: number
  items: AdminSession[]
}

export async function getAdminSessions() {
  const res = await request<APIResponse<SessionsResponse>>(`${BASE}/sessions`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminSessions.toast.loadFailedTitle")).items
}

export function deleteAdminSession(tokenId: string) {
  return request(`${BASE}/sessions/${encodePathSegment(tokenId)}`, { method: "DELETE" })
}
