import { readUpdatedItems, request } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { normalizeAuthorizedSocialPlatform, userBase } from "@/modules/admin-users/api/shared"
import type { EntityId } from "@/types/common"
import type { SocialPlatform } from "@/types/social-platform"
import type { APIResponse } from "@/types/response"
import type { UnknownRecord } from "@/lib/record-utils"

export async function getAuthorizedSocialPlatforms(userId: string) {
  const res = await request<APIResponse<{ total?: number; items?: UnknownRecord[] }>>(
    `${userBase(userId)}/authorized-social-platforms`,
    { method: "GET" }
  )
  const items = readUpdatedItems(res.updatedData)
  return items.map((item) => normalizeAuthorizedSocialPlatform(item))
}

export function updateAuthorizedSocialPlatform(
  userId: string,
  platformId: EntityId,
  data: { platform: SocialPlatform; userId: string; comment?: string }
) {
  const normalizedId = encodePathSegment(platformId)
  return request(`${userBase(userId)}/authorized-social-platforms/${normalizedId}`, {
    method: "PUT",
    data,
  })
}

export function deleteAuthorizedSocialPlatform(userId: string, platformId: EntityId) {
  const normalizedId = encodePathSegment(platformId)
  return request(`${userBase(userId)}/authorized-social-platforms/${normalizedId}`, {
    method: "DELETE",
  })
}
