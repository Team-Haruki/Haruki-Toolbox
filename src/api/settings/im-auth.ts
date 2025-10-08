import {callApiResponse} from "@/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    AuthorizeSocialPlatformInfo,
    AddAuthorizeSocialPlatformAccountPayload
} from "@/types";


export async function addAuthorizeSocialPlatformAccount(id: number, platform: SocialPlatform, userId: string, comment: string): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {platform, userId, comment}
    return await callApiResponse<AuthorizeSocialPlatformInfo[]>(
        `/api/user/{toolboxUserId}/authorize-social-platform/${id}`,
        "PUT",
        payload
    )
}

export async function removeAuthorizeSocialPlatformAccount(id: number): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    return await callApiResponse<AuthorizeSocialPlatformInfo[]>(
        `/api/user/{toolboxUserId}/authorize-social-platform/${id}`,
        "DELETE",
    )
}
