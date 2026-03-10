import { readUpdatedItems, request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import { translate } from "@/shared/i18n"
import {
    type UnknownRecord,
    readBoolean,
    readOptionalString,
    readString,
    readStringArray,
} from "@/lib/record-utils"
import type {
    OAuthClient,
    OAuthClientStatistics,
    OAuthClientAuthorization,
    OAuthAuditLog,
    PaginatedResponse,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/oauth-clients"

function normalizeOAuthClientType(value: unknown): OAuthClient["clientType"] {
    return value === "public" ? "public" : "confidential"
}

function normalizeOAuthClient(item: UnknownRecord): OAuthClient {
    const redirectUris = readStringArray(item, ["redirectUris", "redirect_uris"])
    const redirectUri = readOptionalString(item, ["redirectUri", "redirect_uri"])

    return {
        clientId: readString(item, ["clientId", "client_id"]),
        clientSecret: readOptionalString(item, ["clientSecret", "client_secret"]),
        name: readString(item, ["name"]),
        clientType: normalizeOAuthClientType(item.clientType ?? item.client_type),
        scopes: readStringArray(item, ["scopes"]),
        redirectUri: redirectUri ?? (redirectUris[0] ?? ""),
        redirectUris: redirectUris.length > 0 ? redirectUris : (redirectUri ? [redirectUri] : []),
        active: readBoolean(item, ["active"], true),
        createdAt: readString(item, ["createdAt", "created_at"]),
        updatedAt: readOptionalString(item, ["updatedAt", "updated_at"]),
        deleted: readBoolean(item, ["deleted"]),
    }
}

export async function createOAuthClient(data: Partial<OAuthClient>) {
    const res = await request<APIResponse<OAuthClient>>(`${BASE}/`, { method: "POST", data })
    return unwrapUpdatedData(res, translate("adminOAuthClients.toast.createFailedTitle"))
}

export async function getOAuthClients(params?: QueryParams) {
    const res = await request<APIResponse<{ items?: UnknownRecord[]; total?: number }>>(`${BASE}/`, {
        method: "GET",
        params,
    })
    const rawItems = readUpdatedItems(res.updatedData)
    return rawItems.map((item) => normalizeOAuthClient(item))
}

export function updateOAuthClient(clientId: string, data: Partial<OAuthClient>) {
    return request(`${BASE}/${encodePathSegment(clientId)}`, { method: "PUT", data })
}

export function setOAuthClientActive(clientId: string, active: boolean) {
    return request(`${BASE}/${encodePathSegment(clientId)}/active`, {
        method: "PUT",
        data: { active },
    })
}

export async function rotateClientSecret(clientId: string) {
    const res = await request<APIResponse<{ clientSecret: string }>>(`${BASE}/${encodePathSegment(clientId)}/rotate-secret`, {
        method: "POST",
    })
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.rotateFailedTitle"))
    const clientSecret = typeof updatedData.clientSecret === "string" ? updatedData.clientSecret.trim() : ""
    if (!clientSecret) {
        throw new Error(translate("common.missingUpdatedData", { context: translate("adminOAuthClients.toast.rotateFailedTitle") }))
    }
    return clientSecret
}

export function deleteOAuthClient(clientId: string) {
    return request(`${BASE}/${encodePathSegment(clientId)}`, { method: "DELETE" })
}

export async function getOAuthClientStatistics(clientId: string, params?: QueryParams) {
    const res = await request<APIResponse<OAuthClientStatistics>>(`${BASE}/${encodePathSegment(clientId)}/statistics`, {
        method: "GET",
        params,
    })
    return unwrapUpdatedData(res, translate("adminOAuthClients.toast.loadStatsFailedTitle"))
}

export async function getOAuthClientAuthorizations(clientId: string, params?: QueryParams) {
    const res = await request<APIResponse<PaginatedResponse<OAuthClientAuthorization>>>(`${BASE}/${encodePathSegment(clientId)}/authorizations`, {
        method: "GET",
        params,
    })
    return unwrapUpdatedData(res, translate("adminOAuthClients.toast.loadAuthorizationsFailedTitle"))
}

export function revokeOAuthClient(clientId: string) {
    return request(`${BASE}/${encodePathSegment(clientId)}/revoke`, { method: "POST" })
}

export function restoreOAuthClient(clientId: string) {
    return request(`${BASE}/${encodePathSegment(clientId)}/restore`, { method: "POST" })
}

export async function getOAuthClientAuditLogs(clientId: string, params?: QueryParams) {
    const res = await request<APIResponse<PaginatedResponse<OAuthAuditLog>>>(`${BASE}/${encodePathSegment(clientId)}/audit-logs`, {
        method: "GET",
        params,
    })
    return unwrapUpdatedData(res, translate("adminOAuthClients.toast.loadAuditLogsFailedTitle"))
}

export async function getOAuthClientAuditSummary(clientId: string) {
    const res = await request<APIResponse<unknown>>(`${BASE}/${encodePathSegment(clientId)}/audit-summary`, { method: "GET" })
    return res.updatedData
}
