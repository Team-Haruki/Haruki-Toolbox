import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import { readFileAsDataUrl } from "@/lib/file-reader"
import type {
    APIResponse,
    ChangePasswordPayload,
    UpdateUserProfilePayload
} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function updateUserProfile(
    userId: string,
    name: string,
    avatar: File | null,
    options?: AxiosRequestConfig
): Promise<APIResponse<{ name: string; avatarPath: string }>> {
    let payload: UpdateUserProfilePayload;
    if (avatar) {
        const avatarBase64 = await readFileAsDataUrl(avatar)
        payload = { name, avatarBase64 }
    } else {
        payload = { name }
    }
    return await request<APIResponse<{ name: string; avatarPath: string }>>(
        buildUserApiPath(userId, "profile"),
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}

export async function changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const payload: ChangePasswordPayload = { oldPassword, newPassword }
    return await request<APIResponse<null>>(
        buildUserApiPath(userId, "change-password"),
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}
