import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {
    LoginResult,
    LoginRequest,
    LoginResponse,
} from "@/components/users/data/types";

export async function login(email: string, password: string, challengeToken: string): Promise<LoginResult> {
    try {
        const payload: LoginRequest = {email, password, challengeToken}
        const response = await callApi<LoginResponse>("/api/user/login", "POST", payload)
        if (response.status === 200 && response.userData) {
            const userStore = useUserStore()
            userStore.setUser(response.userData)
            return {success: true, data: response.userData}
        } else {
            return {success: false, message: "登录失败"}
        }
    } catch (error: any) {
        console.error("Login error:", error.message)
        return {success: false, message: error.message || "登录失败"}
    }
}