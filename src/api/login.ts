import {request} from "@/api/call-api"
import type { AxiosRequestConfig } from "axios"
import type {
    LoginRequest,
    LoginResponse
} from "@/types"

export async function login(
    email: string,
    password: string,
    challengeToken: string,
    options?: AxiosRequestConfig
): Promise<LoginResponse> {
    const payload: LoginRequest = { email, password, challengeToken }
    const response = await request<LoginResponse>("/api/user/login", {
        method: "POST",
        data: payload,
        ...options
    })

    return response
}