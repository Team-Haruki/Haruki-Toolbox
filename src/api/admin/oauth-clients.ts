import { request } from "@/api/call-api"
import type {
    OAuthClient,
    OAuthClientStatistics,
    OAuthClientAuthorization,
    OAuthAuditLog,
    PaginatedResponse,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/oauth-clients"

export async function createOAuthClient(data: Partial<OAuthClient>) {
    const res = await request<APIResponse<OAuthClient>>(`${BASE}/`, { method: "POST", data })
    return res.updatedData
}

export async function getOAuthClients(params?: Record<string, string | number>) {
    const res = await request<APIResponse<{ items?: Array<Record<string, unknown>>; total?: number }>>(`${BASE}/`, {
        method: "GET",
        params,
    })
    const data = res.updatedData
    const rawItems = data?.items ?? (Array.isArray(data) ? data : [])
    return rawItems.map(item => {
        const uris = (item.redirectUris ?? item.redirect_uris) as string[] | undefined
        const uri = (item.redirectUri ?? item.redirect_uri) as string | undefined
        return {
            clientId: (item.clientId ?? item.client_id ?? '') as string,
            clientSecret: (item.clientSecret ?? item.client_secret) as string | undefined,
            name: (item.name ?? '') as string,
            clientType: (item.clientType ?? item.client_type ?? 'confidential') as 'public' | 'confidential',
            scopes: (item.scopes ?? []) as string[],
            redirectUri: uri ?? (uris?.[0] ?? ''),
            redirectUris: uris ?? (uri ? [uri] : []),
            active: !!(item.active ?? true),
            createdAt: (item.createdAt ?? item.created_at ?? '') as string,
            updatedAt: (item.updatedAt ?? item.updated_at) as string | undefined,
            deleted: !!item.deleted,
        } as OAuthClient
    })
}

export function updateOAuthClient(clientId: string, data: Partial<OAuthClient>) {
    return request(`${BASE}/${clientId}`, { method: "PUT", data })
}

export function setOAuthClientActive(clientId: string, active: boolean) {
    return request(`${BASE}/${clientId}/active`, {
        method: "PUT",
        data: { active },
    })
}

export async function rotateClientSecret(clientId: string) {
    const res = await request<APIResponse<{ clientSecret: string }>>(`${BASE}/${clientId}/rotate-secret`, { method: "POST" })
    return res.updatedData
}

export function deleteOAuthClient(clientId: string) {
    return request(`${BASE}/${clientId}`, { method: "DELETE" })
}

export async function getOAuthClientStatistics(clientId: string) {
    const res = await request<APIResponse<OAuthClientStatistics>>(`${BASE}/${clientId}/statistics`, { method: "GET" })
    return res.updatedData!
}

export async function getOAuthClientAuthorizations(clientId: string, params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<OAuthClientAuthorization>>>(`${BASE}/${clientId}/authorizations`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export function revokeOAuthClient(clientId: string) {
    return request(`${BASE}/${clientId}/revoke`, { method: "POST" })
}

export function restoreOAuthClient(clientId: string) {
    return request(`${BASE}/${clientId}/restore`, { method: "POST" })
}

export async function getOAuthClientAuditLogs(clientId: string, params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<OAuthAuditLog>>>(`${BASE}/${clientId}/audit-logs`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export async function getOAuthClientAuditSummary(clientId: string) {
    const res = await request<APIResponse<unknown>>(`${BASE}/${clientId}/audit-summary`, { method: "GET" })
    return res.updatedData
}
