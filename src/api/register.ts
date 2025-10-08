import {useUserStore} from "@/store"
import {callApiRaw} from "@/api/call-api"
import type {RegisterPayload, RegisterSuccessResponse} from "@/types"

export async function registerUser(
    name: string,
    email: string,
    password: string,
    oneTimePassword: string,
    challengeToken: string
): Promise<RegisterSuccessResponse> {
    const payload: RegisterPayload = {name, email, password, oneTimePassword, challengeToken}
    const response = await callApiRaw<RegisterSuccessResponse>(
        "/api/user/register",
        "POST",
        payload
    )
    const userStore = useUserStore()
    userStore.setUser(response.userData)
    return response
}