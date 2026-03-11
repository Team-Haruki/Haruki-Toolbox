import { request } from "@/core/http/call-api"
import { normalizeFriendGroup, normalizeList } from "./normalize"

export async function getFriendGroups() {
  const payload = await request<unknown>("/misc/friend_groups", { method: "GET" })
  return normalizeList(payload, normalizeFriendGroup)
}
