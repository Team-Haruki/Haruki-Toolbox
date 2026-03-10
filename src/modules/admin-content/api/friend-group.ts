import { request } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/content"

export async function getFriendGroups() {
  const res = await request<APIResponse<{ items: AdminFriendGroup[] }>>(`${BASE}/friend-groups/`, { method: "GET" })
  return res.updatedData?.items ?? []
}

export function createFriendGroup(data: Omit<AdminFriendGroup, "id" | "groupList">) {
  return request(`${BASE}/friend-groups/`, { method: "POST", data })
}

export function deleteFriendGroup(groupId: string) {
  return request(`${BASE}/friend-groups/${encodePathSegment(groupId)}`, { method: "DELETE" })
}

export function createFriendGroupItem(groupId: string, data: Omit<AdminFriendGroupItem, "id">) {
  return request(`${BASE}/friend-groups/${encodePathSegment(groupId)}/items`, { method: "POST", data })
}

export function updateFriendGroupItem(groupId: string, itemId: string, data: Partial<AdminFriendGroupItem>) {
  return request(`${BASE}/friend-groups/${encodePathSegment(groupId)}/items/${encodePathSegment(itemId)}`, { method: "PUT", data })
}

export function deleteFriendGroupItem(groupId: string, itemId: string) {
  return request(`${BASE}/friend-groups/${encodePathSegment(groupId)}/items/${encodePathSegment(itemId)}`, { method: "DELETE" })
}
