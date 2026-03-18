import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type {
  APIResponse,
  SocialPlatform,
  EntityId,
  AddAuthorizeSocialPlatformAccountPayload,
  AuthorizeSocialPlatformUpdatedData,
} from "@/types"
import type { AxiosRequestConfig } from "axios"

export async function createAuthorizeSocialPlatformAccount(
  toolboxUserId: string,
  platform: SocialPlatform,
  userId: string,
  comment: string,
  options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
  const payload: AddAuthorizeSocialPlatformAccountPayload = { platform, userId, comment }
  return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
    buildUserApiPath(toolboxUserId, "authorize-social-platform"),
    {
      method: "POST",
      data: payload,
      ...options,
    }
  )
}

export async function addAuthorizeSocialPlatformAccount(
  toolboxUserId: string,
  id: EntityId,
  platform: SocialPlatform,
  userId: string,
  comment: string,
  options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
  const payload: AddAuthorizeSocialPlatformAccountPayload = { platform, userId, comment }
  return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
    buildUserApiPath(toolboxUserId, "authorize-social-platform", id),
    {
      method: "PUT",
      data: payload,
      ...options,
    }
  )
}

export async function removeAuthorizeSocialPlatformAccount(
  toolboxUserId: string,
  id: EntityId,
  options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
  return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
    buildUserApiPath(toolboxUserId, "authorize-social-platform", id),
    {
      method: "DELETE",
      ...options,
    }
  )
}
