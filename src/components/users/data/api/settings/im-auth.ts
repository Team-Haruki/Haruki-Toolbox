import {callApi} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    AuthorizeSocialPlatformInfo,
    AddAuthorizeSocialPlatformAccountPayload
} from "@/components/users/data/types";


export async function addAuthorizeSocialPlatformAccount(id: number, platform: SocialPlatform, userId: string, comment: string): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {platform, userId, comment}
    return await callApi<AuthorizeSocialPlatformInfo[]>(
        `/api/user/{toolboxUserId}/authorize-social-platform/${id}`,
        "PUT",
        payload
    )
}

export async function removeAuthorizeSocialPlatformAccount(id: number): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    return await callApi<AuthorizeSocialPlatformInfo[]>(
        `/api/user/{toolboxUserId}/authorize-social-platform/${id}`,
        "DELETE",
    )
}
