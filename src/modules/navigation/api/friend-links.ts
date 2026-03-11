import { request } from "@/core/http/call-api"
import { normalizeFriendLink, normalizeList } from "./normalize"

export async function getFriendLinks() {
  const payload = await request<unknown>("/misc/friend_links", { method: "GET" })
  return normalizeList(payload, normalizeFriendLink)
}
