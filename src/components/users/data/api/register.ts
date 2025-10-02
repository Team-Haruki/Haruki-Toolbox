import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {RegisterPayload, RegisterSuccessResponse} from "@/components/users/data/types"

export async function registerUser(
    name: string,
    email: string,
    password: string,
    oneTimePassword: string,
    challengeToken: string
): Promise<RegisterSuccessResponse> {
    const payload: RegisterPayload = {name, email, password, oneTimePassword, challengeToken}
    const response = await callApi<RegisterSuccessResponse>(
        "/api/user/register",
        "POST",
        payload
    )
    const userStore = useUserStore()
    userStore.setUser(response.userData)
    return response
}