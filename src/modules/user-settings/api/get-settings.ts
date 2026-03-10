import {request} from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"

import type {
    APIResponse,
    UserSettings
} from "@/types"
import type { AxiosRequestConfig } from "axios"


export async function getSettings(
    userId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<UserSettings>> {
    return await request<APIResponse<UserSettings>>(buildUserApiPath(userId, "get-settings"), {
        method: "GET",
        ...options
    })
}
