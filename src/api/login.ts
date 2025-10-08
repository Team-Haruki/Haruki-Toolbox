import {useUserStore} from "@/store"
import {callApiRaw} from "@/api/call-api"
import type {
    LoginRequest,
    LoginResponse
} from "@/types"

export async function login(
    email: string,
    password: string,
    challengeToken: string
): Promise<LoginResponse> {
    const payload: LoginRequest = { email, password, challengeToken }
    const response = await callApiRaw<LoginResponse>("/api/user/login", "POST", payload)

    if (response.status === 200 && response.userData) {
        const userStore = useUserStore()
        userStore.setUser(response.userData)
    }

    return response
}