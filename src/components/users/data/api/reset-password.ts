import {toast} from "vue-sonner";
import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {
    ResetPasswordPayload,
    ResetPasswordResponse,
    SendResetPasswordEmailPayload,
    SendResetPasswordEmailResponse
} from "@/components/users/data/types"


export async function sendResetPasswordEmail(email: string, challengeToken: string): Promise<SendResetPasswordEmailResponse> {
    const payload: SendResetPasswordEmailPayload = {email, challengeToken}
    return callApi<SendResetPasswordEmailResponse>(
        "/api/user/reset-password/send",
        "POST",
        payload
    )
}

export async function resetPassword(email: string, oneTimeSecret: string, password: string): Promise<ResetPasswordResponse> {
    const payload: ResetPasswordPayload = {email, oneTimeSecret, password}
    const response = await callApi<ResetPasswordResponse>(
        "/api/user/reset-password",
        "POST",
        payload
    )
    const userStore = useUserStore()
    userStore.clearUser()
    return response
}