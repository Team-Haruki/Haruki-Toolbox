import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { userBase } from "@/modules/admin-users/api/shared"
import { translate } from "@/shared/i18n"
import type { UserSocialPlatform } from "@/types/admin"
import type { SocialPlatform } from "@/types/social-platform"
import type { APIResponse } from "@/types/response"

export async function getSocialPlatform(userId: string) {
  const res = await request<APIResponse<{ socialPlatform?: UserSocialPlatform | null }>>(
    `${userBase(userId)}/social-platform`,
    { method: "GET" }
  )
  const updatedData = unwrapUpdatedData(res, translate("adminUsers.detail.toast.loadSocialFailedTitle"))
  return updatedData.socialPlatform ?? null
}

export function updateSocialPlatform(
  userId: string,
  data: { platform: SocialPlatform; userId: string; verified?: boolean }
) {
  return request(`${userBase(userId)}/social-platform`, {
    method: "PUT",
    data,
  })
}

export function deleteSocialPlatform(userId: string) {
  return request(`${userBase(userId)}/social-platform`, { method: "DELETE" })
}
