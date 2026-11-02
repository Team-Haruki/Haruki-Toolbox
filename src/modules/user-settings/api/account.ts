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

export async function updateIOSModuleNotifications(
    userId: string,
    enabled: boolean,
    options?: AxiosRequestConfig
): Promise<APIResponse<{ iosModuleNotificationsEnabled?: boolean }>> {
    const payload: UpdateUserProfilePayload = { iosModuleNotificationsEnabled: enabled }

    return await request<APIResponse<{ iosModuleNotificationsEnabled?: boolean }>>(
        buildUserApiPath(userId, "profile"),
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}
