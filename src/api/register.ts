import {request} from "@/api/call-api"
import type {RegisterPayload, RegisterSuccessResponse} from "@/types"
import type {AxiosRequestConfig} from "axios"

export async function registerUser(
    name: string,
    email: string,
    password: string,
    oneTimePassword: string,
    challengeToken: string,
    options?: AxiosRequestConfig
): Promise<RegisterSuccessResponse> {
    const payload: RegisterPayload = {name, email, password, oneTimePassword, challengeToken}
    const response = await request<RegisterSuccessResponse>(
        "/api/user/register",
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
    return response
}