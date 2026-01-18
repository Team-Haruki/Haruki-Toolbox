import { request } from "@/api/call-api"
import type {
    APIResponse,
    ChangePasswordPayload,
    UpdateUserProfilePayload
} from "@/types";
import type { AxiosRequestConfig } from "axios";


function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}

export async function updateUserProfile(
    userId: string,
    name: string,
    avatar: File | null,
    options?: AxiosRequestConfig
): Promise<APIResponse<{ name: string; avatarPath: string }>> {
    let payload: UpdateUserProfilePayload;
    if (avatar) {
        const avatarBase64 = await fileToBase64(avatar)
        payload = { name, avatarBase64 }
    } else {
        payload = { name }
    }
    return await request<APIResponse<{ name: string; avatarPath: string }>>(
        `/api/user/${userId}/profile`,
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
        `/api/user/${userId}/change-password`,
        {
            method: "PUT",
            data: payload,
            ...options
        }
    )
}
