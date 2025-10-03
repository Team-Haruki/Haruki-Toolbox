import {useUserStore} from "@/components/users/data/store"
import {callApiResponse} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    ResetPasswordPayload,
    SendResetPasswordEmailPayload,
} from "@/components/users/data/types"


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