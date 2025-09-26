import {toast} from "vue-sonner";
import {callApi} from "@/components/users/data/api/call-api"
import {
    UpdateUserProfilePayload,
    UpdateUserProfileResponse
} from "@/components/users/data/types";


function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}

export async function updateUserProfile(name: string, avatar: File) {
    try {
        const avatarBase64 = await fileToBase64(avatar)
        const payload: UpdateUserProfilePayload = {name, avatarBase64}
        return await callApi<UpdateUserProfileResponse>(
            "/api/user/profile",
            "PUT",
            payload
        )
    } catch (error) {
        toast.error("更新用户资料失败:", error)
        throw error
    }
}