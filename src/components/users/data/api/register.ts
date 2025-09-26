import {useUserStore} from "@/components/users/data/store"
import {callApi} from "@/components/users/data/api/call-api"
import type {RegisterErrorResponse, RegisterPayload, RegisterSuccessResponse,} from "@/components/users/data/types"

export async function registerUser(name: string, email: string, password: string) {
    try {
        const payload: RegisterPayload = {name, email, password}
        const response = await callApi<RegisterSuccessResponse>(
            "/api/user/register",
            "POST",
            payload
        )
        const userStore = useUserStore()
        userStore.setUser(response.userData)
        return response
    } catch (error: any) {
        throw RegisterErrorResponse = {
            status: error?.response?.status || 500,
            message: error?.message || "注册失败",
        }
    }
}