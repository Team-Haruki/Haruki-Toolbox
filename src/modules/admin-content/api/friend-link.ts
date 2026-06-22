import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { normalizeExternalHttpUrl } from "@/lib/external-url"
import { normalizeEntityId, readOptionalString, readString, readStringArray } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { AdminFriendLink } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/content"

function normalizeFriendLink(link: unknown): AdminFriendLink | null {
  if (!link || typeof link !== "object" || Array.isArray(link)) return null

  const name = readString(link, ["name"]).trim()
  if (!name) return null

  const url = readOptionalString(link, ["url"])
  const tags = readStringArray(link, ["tags"])

  return {
    id: String(normalizeEntityId((link as { id?: unknown }).id)),
    name,
    description: readString(link, ["description", "detail"]),
    avatar: readString(link, ["avatar"]),
    url: url ? normalizeExternalHttpUrl(url) ?? url : "",
    tags: tags.length > 0 ? tags : undefined,
  }
}

export async function getFriendLinks() {
  const res = await request<APIResponse<{ items: AdminFriendLink[] }>>(`${BASE}/friend-links`, { method: "GET" })
  const updatedData = unwrapUpdatedData(res, translate("adminContent.toast.loadLinksFailedTitle"))
  const items = Array.isArray(updatedData.items) ? updatedData.items : []
  return items
    .map((item) => normalizeFriendLink(item))
    .filter((item): item is AdminFriendLink => item !== null)
}

export function createFriendLink(data: Omit<AdminFriendLink, "id">) {
  return request(`${BASE}/friend-links`, { method: "POST", data })
}

export function updateFriendLink(id: string, data: Partial<AdminFriendLink>) {
  return request(`${BASE}/friend-links/${encodePathSegment(id)}`, { method: "PUT", data })
}

export function deleteFriendLink(id: string) {
  return request(`${BASE}/friend-links/${encodePathSegment(id)}`, { method: "DELETE" })
}
