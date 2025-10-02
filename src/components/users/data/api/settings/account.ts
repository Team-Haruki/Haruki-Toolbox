import {toast} from "vue-sonner";
import {callApi} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    ChangePasswordPayload,
    UpdateUserProfilePayload
} from "@/components/users/data/types";


function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}

export async function updateUserProfile(name: string, avatar: File | null): Promise<APIResponse<{ name: string; avatarPath: string }>> {
    try {
        let payload: UpdateUserProfilePayload;
        if (avatar) {
            const avatarBase64 = await fileToBase64(avatar)
            payload = {name, avatarBase64}
        } else {
            payload = {name}
        }
        return await callApi<{ name: string; avatarPath: string }>(
            "/api/user/{toolboxUserId}/profile",
            "PUT",
            payload
        )
    } catch (error) {
        toast.error(`更新用户资料失败: ${String(error)}`)
        throw error
    }
}

export async function changePassword(password: string): Promise<APIResponse<null>> {
    const payload: ChangePasswordPayload = {password}
    return await callApi<null>(
        "/api/user/{toolboxUserId}/change-password",
        "PUT",
        payload
    )
}
