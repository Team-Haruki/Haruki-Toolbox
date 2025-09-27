import {callApi} from "@/components/users/data/api/call-api"
import {
    APIResponse,
    SocialPlatform,
    AuthorizeSocialPlatformInfo,
    AddAuthorizeSocialPlatformAccountPayload
} from "@/components/users/data/types";


export async function addAuthorizeSocialPlatformAccount(id: int, platform: SocialPlatform, userId: string, comment: string): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    const payload: AddAuthorizeSocialPlatformAccountPayload = {id, platform, userId, comment}
    return await callApi<AuthorizeSocialPlatformInfo[]>(
        `/api/user/authorize-social-platform/${id}`,
        "PUT",
        payload
    )
}

export async function removeAuthorizeSocialPlatformAccount(id: int): Promise<APIResponse<AuthorizeSocialPlatformInfo[]>> {
    return await callApi<AuthorizeSocialPlatformInfo[]>(
        `/api/user/authorize-social-platform/${id}`,
        "DELETE",
    )
}
