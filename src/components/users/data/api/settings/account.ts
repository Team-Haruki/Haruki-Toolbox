import {toast} from "vue-sonner";
import {callApi} from "@/components/users/data/api/call-api"
import {
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

export async function updateUserProfile(name: string, avatar: File): Promise<APIResponse<{ name: string; avatarPath: string }>> {
    try {
        const avatarBase64 = await fileToBase64(avatar)
        const payload: UpdateUserProfilePayload = {name, avatarBase64}
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
