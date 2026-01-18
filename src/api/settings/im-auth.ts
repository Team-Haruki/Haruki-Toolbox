import {request} from "@/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    AuthorizeSocialPlatformInfo,
    AddAuthorizeSocialPlatformAccountPayload
} from "@/types";
import type { AxiosRequestConfig } from "axios";


export async function addAuthorizeSocialPlatformAccount(
    toolboxUserId: string,
    id: number,
    platform: SocialPlatform,
    userId: string,
    comment: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {platform, userId, comment}
    return await request<APIResponse<AuthorizeSocialPlatformInfo[]>>(
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
): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    return await request<APIResponse<AuthorizeSocialPlatformInfo[]>>(
        `/api/user/${toolboxUserId}/authorize-social-platform/${id}`,
        {
            method: "DELETE",
            ...options
        }
    )
}
