import {request} from "@/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    AddAuthorizeSocialPlatformAccountPayload,
    AuthorizeSocialPlatformUpdatedData
} from "@/types";
import type { AxiosRequestConfig } from "axios";


export async function createAuthorizeSocialPlatformAccount(
    toolboxUserId: string,
    platform: SocialPlatform,
    userId: string,
    comment: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {platform, userId, comment}
    return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
        `/api/user/${toolboxUserId}/authorize-social-platform`,
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}

export async function addAuthorizeSocialPlatformAccount(
    toolboxUserId: string,
    id: number,
    platform: SocialPlatform,
    userId: string,
    comment: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {platform, userId, comment}
    return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
        `/api/user/${toolboxUserId}/authorize-social-platform/${id}`,
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}

export async function removeAuthorizeSocialPlatformAccount(
    toolboxUserId: string,
    id: number,
    options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformUpdatedData>> {
    return await request<APIResponse<AuthorizeSocialPlatformUpdatedData>>(
        `/api/user/${toolboxUserId}/authorize-social-platform/${id}`,
        {
            method: "DELETE",
            ...options
        }
    )
}
