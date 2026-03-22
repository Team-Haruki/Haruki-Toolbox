import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { normalizeExternalHttpUrl } from "@/lib/external-url"
import { normalizeEntityId, readOptionalString, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/content"

function normalizeFriendGroupItem(item: unknown): AdminFriendGroupItem | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null

  const name = readString(item, ["name"]).trim()
  if (!name) return null

  const url = readOptionalString(item, ["url"])

  return {
    id: normalizeEntityId((item as { id?: unknown }).id),
    name,
    avatar: readString(item, ["avatar"]),
    bg: readString(item, ["bg"]),
    groupInfo: readOptionalString(item, ["groupInfo", "group_info"]),
    detail: readOptionalString(item, ["detail", "description"]),
    url: url ? normalizeExternalHttpUrl(url) ?? undefined : undefined,
  }
}

function normalizeFriendGroup(group: unknown): AdminFriendGroup | null {
  if (!group || typeof group !== "object" || Array.isArray(group)) return null

  const normalizedGroup = readString(group, ["group", "name"]).trim()
  if (!normalizedGroup) return null

  const rawItems = Array.isArray((group as { groupList?: unknown[]; group_list?: unknown[] }).groupList)
    ? (group as { groupList: unknown[] }).groupList
    : Array.isArray((group as { group_list?: unknown[] }).group_list)
      ? (group as { group_list: unknown[] }).group_list
      : []

  return {
    id: normalizeEntityId((group as { id?: unknown }).id),
    group: normalizedGroup,
    groupList: rawItems
      .map((item) => normalizeFriendGroupItem(item))
      .filter((item): item is AdminFriendGroupItem => item !== null),
  }
}

export async function getFriendGroups() {
  const res = await request<APIResponse<{ items: AdminFriendGroup[] }>>(`${BASE}/friend-groups`, { method: "GET" })
  const updatedData = unwrapUpdatedData(res, translate("adminContent.toast.loadGroupsFailedTitle"))
  const items = Array.isArray(updatedData.items) ? updatedData.items : []
  return items
    .map((item) => normalizeFriendGroup(item))
    .filter((item): item is AdminFriendGroup => item !== null)
}

export function createFriendGroup(data: Omit<AdminFriendGroup, "id" | "groupList">) {
  return request(`${BASE}/friend-groups`, { method: "POST", data })
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
