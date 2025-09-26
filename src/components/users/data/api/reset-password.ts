import {toast} from "vue-sonner";
import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {
    ResetPasswordPayload,
    ResetPasswordResponse,
    SendResetPasswordEmailPayload,
    SendResetPasswordEmailResponse
} from "@/components/users/data/types"


export async function sendResetPasswordEmail(email: string) {
    try {
        const payload: SendResetPasswordEmailPayload = {email}
        return await callApi<SendResetPasswordEmailResponse>(
            "/api/user/reset-password/send",
            "POST",
            payload
        )
    } catch (error) {
        toast.error("发送重置密码邮件失败:", error)
        throw error
    }
}

export async function resetPassword(email: string, oneTimeSecret: string, password: string) {
    try {
        const payload: ResetPasswordPayload = {email, oneTimeSecret, password}
        const response = await callApi<ResetPasswordResponse>(
            "/api/user/reset-password",
            "POST",
            payload
        )
        const userStore = useUserStore()
        userStore.clearUser()
        return response
    } catch (error) {
        toast.error("重置密码失败:", error)
        throw error
    }
}
