import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    ResetPasswordPayload,
    SendResetPasswordEmailPayload,
} from "@/components/users/data/types"


export async function sendResetPasswordEmail(email: string, challengeToken: string): Promise<APIResponse<string>> {
    const payload: SendResetPasswordEmailPayload = {email, challengeToken}
    return await callApi<string>(
        "/api/user/reset-password/send",
        "POST",
        payload
    )
}

export async function resetPassword(email: string, oneTimeSecret: string, password: string): Promise<APIResponse<string>> {
    const payload: ResetPasswordPayload = {email, oneTimeSecret, password}
    const response = await callApi<string>(
        "/api/user/reset-password",
        "POST",
        payload
    )
    const userStore = useUserStore()
    userStore.clearUser()
    return response
}