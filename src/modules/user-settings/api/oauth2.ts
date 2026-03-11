import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types"
import type { AxiosRequestConfig } from "axios"

export interface OAuthAuthorization {
    clientId: string
    clientName: string
    clientType: string
    scopes: string[]
    createdAt: string
}

export interface OAuthConsentPayload {
    clientId: string
    redirectUri: string
    scope: string
    state?: string
    codeChallenge?: string
    codeChallengeMethod?: string
    approved: boolean
}

export interface OAuthConsentResponse {
    redirectUrl?: string
    redirect_url?: string
    message?: string
    errorDescription?: string
    error_description?: string
}

const scopeLabelKeys: Record<string, string> = {
    "user:read": "oauth.scope.userRead",
    "bindings:read": "oauth.scope.bindingsRead",
    "game-data:read": "oauth.scope.gameDataRead",
    "game-data:write": "oauth.scope.gameDataWrite",
}

export function getScopeLabel(scope: string): string {
    const key = scopeLabelKeys[scope]
    return key ? translate(key) : scope
}

export async function listOAuthAuthorizations(
    toolboxUserId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthAuthorization[]>> {
    return await request<APIResponse<OAuthAuthorization[]>>(
        buildUserApiPath(toolboxUserId, "oauth2", "authorizations"),
        { method: "GET", ...options }
    )
}

export async function revokeOAuthAuthorization(
    toolboxUserId: string,
    clientId: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<string>> {
    return await request<APIResponse<string>>(
        buildUserApiPath(toolboxUserId, "oauth2", "authorizations", clientId),
        { method: "DELETE", ...options }
    )
}

export async function submitOAuthConsent(
    payload: OAuthConsentPayload,
    options?: AxiosRequestConfig
): Promise<OAuthConsentResponse> {
    return await request<OAuthConsentResponse>(
        "/api/oauth2/authorize/consent",
        {
            method: "POST",
            data: {
                client_id: payload.clientId,
                redirect_uri: payload.redirectUri,
                scope: payload.scope,
                state: payload.state,
                code_challenge: payload.codeChallenge,
                code_challenge_method: payload.codeChallengeMethod,
                approved: payload.approved,
            },
            ...options,
        }
    )
}
