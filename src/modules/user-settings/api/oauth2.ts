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

export interface OAuthChallengeClient {
    client_id?: string
    client_name?: string
    grant_types?: string[]
    scope?: string
}

export interface OAuthLoginChallenge {
    challenge?: string
    skip?: boolean
    subject?: string
    request_url?: string
    requested_scope?: string[]
    requested_access_token_audience?: string[]
    client?: OAuthChallengeClient | null
}

export interface OAuthConsentChallenge {
    challenge?: string
    skip?: boolean
    subject?: string
    request_url?: string
    requested_scope?: string[]
    requested_access_token_audience?: string[]
    client?: OAuthChallengeClient | null
}

export interface OAuthRedirectResponse {
    redirect_to?: string
    redirect_url?: string
    redirectUrl?: string
}

export interface OAuthLoginAcceptPayload {
    remember?: boolean
    rememberFor?: number
    acr?: string
}

export interface OAuthLoginRejectPayload {
    error?: string
    errorDescription?: string
    statusCode?: number
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

export interface OAuthConsentAcceptPayload {
    grantScope?: string[]
    grantAccessTokenAudience?: string[]
    remember?: boolean
    rememberFor?: number
}

export interface OAuthConsentRejectPayload {
    error?: string
    errorDescription?: string
    statusCode?: number
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

function withChallenge(path: string, key: "login_challenge" | "consent_challenge", challenge: string) {
    const params = new URLSearchParams()
    params.set(key, challenge)
    return `${path}?${params.toString()}`
}

export function resolveOAuthRedirectUrl(payload: OAuthRedirectResponse | OAuthConsentResponse | null | undefined): string {
    return payload?.redirect_to ?? payload?.redirectUrl ?? payload?.redirect_url ?? ""
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

export async function getOAuthLoginChallenge(
    challenge: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthLoginChallenge>> {
    return await request<APIResponse<OAuthLoginChallenge>>(
        withChallenge("/api/oauth2/login", "login_challenge", challenge),
        { method: "GET", ...options }
    )
}

export async function acceptOAuthLoginChallenge(
    challenge: string,
    payload?: OAuthLoginAcceptPayload,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthRedirectResponse>> {
    return await request<APIResponse<OAuthRedirectResponse>>(
        withChallenge("/api/oauth2/login/accept", "login_challenge", challenge),
        {
            method: "POST",
            data: payload,
            ...options,
        }
    )
}

export async function rejectOAuthLoginChallenge(
    challenge: string,
    payload?: OAuthLoginRejectPayload,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthRedirectResponse>> {
    return await request<APIResponse<OAuthRedirectResponse>>(
        withChallenge("/api/oauth2/login/reject", "login_challenge", challenge),
        {
            method: "POST",
            data: payload,
            ...options,
        }
    )
}

export async function getOAuthConsentChallenge(
    challenge: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthConsentChallenge>> {
    return await request<APIResponse<OAuthConsentChallenge>>(
        withChallenge("/api/oauth2/consent", "consent_challenge", challenge),
        { method: "GET", ...options }
    )
}

export async function acceptOAuthConsentChallenge(
    challenge: string,
    payload?: OAuthConsentAcceptPayload,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthRedirectResponse>> {
    return await request<APIResponse<OAuthRedirectResponse>>(
        withChallenge("/api/oauth2/consent/accept", "consent_challenge", challenge),
        {
            method: "POST",
            data: payload,
            ...options,
        }
    )
}

export async function rejectOAuthConsentChallenge(
    challenge: string,
    payload?: OAuthConsentRejectPayload,
    options?: AxiosRequestConfig
): Promise<APIResponse<OAuthRedirectResponse>> {
    return await request<APIResponse<OAuthRedirectResponse>>(
        withChallenge("/api/oauth2/consent/reject", "consent_challenge", challenge),
        {
            method: "POST",
            data: payload,
            ...options,
        }
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
