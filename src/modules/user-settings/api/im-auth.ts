import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type {
  APIResponse,
  SocialPlatform,
  AddAuthorizeSocialPlatformAccountPayload,
  AuthorizeSocialPlatformUpdatedData,
} from "@/types"
import type { AxiosRequestConfig } from "axios"

export async function createAuthorizeSocialPlatformAccount(
  toolboxUserId: string,
  id: number,
  platform: SocialPlatform,
  userId: string,
  comment: string,
  allowFastVerification?: boolean,
  options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
  const payload: AddAuthorizeSocialPlatformAccountPayload = { platform, userId, comment, allowFastVerification }
  return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
    buildUserApiPath(toolboxUserId, "authorize-social-platform", id),
    {
      method: "POST",
      data: payload,
      ...options,
    }
  )
}

export async function addAuthorizeSocialPlatformAccount(
  toolboxUserId: string,
  id: number,
  platform: SocialPlatform,
  userId: string,
  comment: string,
  allowFastVerification?: boolean,
  options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
  const payload: AddAuthorizeSocialPlatformAccountPayload = { platform, userId, comment, allowFastVerification }
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
  id: number,
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
