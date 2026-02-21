import { request } from "@/api/call-api"
import type { APIResponse } from "@/types"
import type { AxiosRequestConfig } from "axios"

export interface OAuthAuthorization {
    clientId: string
    clientName: string
    clientType: string
    scopes: string[]
    createdAt: string
}

const scopeLabels: Record<string, string> = {
    "user:read": "读取个人资料",
    "bindings:read": "读取绑定账号",
    "game-data:read": "读取游戏数据",
    "game-data:write": "上传游戏数据",
}

export function getScopeLabel(scope: string): string {
    return scopeLabels[scope] ?? scope
}

export async function listOAuthAuthorizations(
    toolboxUserId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthAuthorization[]>> {
    return await request<APIResponse<OAuthAuthorization[]>>(
        `/api/user/${toolboxUserId}/oauth2/authorizations`,
        { method: "GET", ...options }
    )
}

export async function revokeOAuthAuthorization(
    toolboxUserId: string,
    clientId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<string>> {
    return await request<APIResponse<string>>(
        `/api/user/${toolboxUserId}/oauth2/authorizations/${clientId}`,
        { method: "DELETE", ...options }
    )
}
