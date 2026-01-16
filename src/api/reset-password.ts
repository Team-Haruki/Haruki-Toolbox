import {useUserStore} from "@/store"
import {request} from "@/api/call-api"
import type { AxiosRequestConfig } from "axios"
import type {
    APIResponse,
    ResetPasswordPayload,
    SendResetPasswordEmailPayload,
} from "@/types"


export async function sendResetPasswordEmail(
    email: string,
    challengeToken: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const payload: SendResetPasswordEmailPayload = {email, challengeToken}
    return await request<APIResponse<null>>(
        "/api/user/reset-password/send",
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}

export async function resetPassword(email: string, oneTimeSecret: string, password: string): Promise<APIResponse<null>> {
    const payload: ResetPasswordPayload = {email, oneTimeSecret, password}
    const response = await request<APIResponse<null>>(
        "/api/user/reset-password",
        {
            method: "POST",
            data: payload
        }
    )
    const userStore = useUserStore()
    userStore.clearUser()
    return response
}
