import {toast} from "vue-sonner";
import {callApi} from "@/components/users/data/api/call-api"
import type {ChangePasswordPayload, ChangePasswordResponse} from "@/components/users/data/types"

export async function changePassword(password: string) {
    try {
        const payload: ChangePasswordPayload = {password}
        return await callApi<ChangePasswordResponse>(
            "/api/user/change-password",
            "PUT",
            payload
        )
    } catch (error) {
        toast.error("修改密码失败:", error)
        throw error
    }
}
