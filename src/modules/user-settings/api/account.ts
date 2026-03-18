import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type {
    APIResponse,
    UpdateUserProfilePayload
} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function updateUserProfile(
    userId: string,
    avatarBase64: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<{ avatarPath: string }>> {
    const payload: UpdateUserProfilePayload = { avatarBase64 }

    return await request<APIResponse<{ avatarPath: string }>>(
        buildUserApiPath(userId, "profile"),
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}
