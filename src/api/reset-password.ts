import {useUserStore} from "@/store"
import {callApiResponse} from "@/api/call-api"
import type {
    APIResponse,
    ResetPasswordPayload,
    SendResetPasswordEmailPayload,
} from "@/types"


export async function sendResetPasswordEmail(email: string, challengeToken: string): Promise<APIResponse<null>> {
    const payload: SendResetPasswordEmailPayload = {email, challengeToken}
    return await callApiResponse<null>(
        "/api/user/reset-password/send",
        "POST",
        payload
    )
}

export async function resetPassword(email: string, oneTimeSecret: string, password: string): Promise<APIResponse<null>> {
    const payload: ResetPasswordPayload = {email, oneTimeSecret, password}
    const response = await callApiResponse<null>(
        "/api/user/reset-password",
        "POST",
        payload
    )
    const userStore = useUserStore()
    userStore.clearUser()
    return response
}