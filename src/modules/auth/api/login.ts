import {request} from "@/core/http/call-api"
import type {AxiosRequestConfig} from "axios"
import type {LoginRequest, LoginResponse} from "@/types"

export async function login(
    email: string,
    password: string,
    challengeToken: string,
    options?: AxiosRequestConfig
): Promise<LoginResponse> {
    const payload: LoginRequest = { email, password, challengeToken }
    return await request<LoginResponse>("/api/user/login", {
        method: "POST",
        data: payload,
        ...options
    })
}