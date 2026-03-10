import { request } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { AdminFriendLink } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/content"

export async function getFriendLinks() {
  const res = await request<APIResponse<{ items: AdminFriendLink[] }>>(`${BASE}/friend-links/`, { method: "GET" })
  return res.updatedData?.items ?? []
}

export function createFriendLink(data: Omit<AdminFriendLink, "id">) {
  return request(`${BASE}/friend-links/`, { method: "POST", data })
}

export function updateFriendLink(id: string, data: Partial<AdminFriendLink>) {
  return request(`${BASE}/friend-links/${encodePathSegment(id)}`, { method: "PUT", data })
}

export function deleteFriendLink(id: string) {
  return request(`${BASE}/friend-links/${encodePathSegment(id)}`, { method: "DELETE" })
}
