import {request} from "@/api/call-api"

import type {
    APIResponse,
    UserSettings
} from "@/types"
import type { AxiosRequestConfig } from "axios"


export async function getSettings(
    userId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<UserSettings>> {
    return await request<APIResponse<UserSettings>>(`/api/user/${userId}/get-settings`, {
        method: "GET",
        ...options
    })
}
