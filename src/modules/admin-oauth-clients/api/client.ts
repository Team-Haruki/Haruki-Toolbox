import { readUpdatedItems, readUpdatedTotal, request, unwrapUpdatedData } from "@/core/http/call-api"
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
    OAuthClientWebhookCreatePayload,
    OAuthClientWebhookListResponse,
    OAuthClientWebhookMutationResponse,
    OAuthClientWebhookUpdatePayload,
    PaginatedResponse,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"
import {
    normalizeOAuthClientWebhook,
    readOAuthClientWebhookMutation,
} from "@/modules/admin-oauth-clients/lib/webhook"

const BASE = "/api/admin/oauth-clients"

function readNumber(record: UnknownRecord, keys: readonly string[], fallback = 0): number {
    for (const key of keys) {
        const value = record[key]
        if (typeof value === "number" && Number.isFinite(value)) {
            return value
        }
        if (typeof value === "string" && value.trim() !== "") {
            const parsed = Number(value)
            if (Number.isFinite(parsed)) {
                return parsed
            }
        }
    }

    return fallback
}

function normalizeOAuthClientStatistics(record: UnknownRecord): OAuthClientStatistics {
    return {
        totalAuthorizations: readNumber(record, ["totalAuthorizations", "total_authorizations"]),
        activeAuthorizations: readNumber(record, ["activeAuthorizations", "active_authorizations"]),
        last30DaysAuthorizations: readNumber(record, [
            "last30DaysAuthorizations",
            "last_30_days_authorizations",
        ]),
    }
}

function normalizeOAuthClientType(value: unknown): OAuthClient["clientType"] {
    return value === "public" ? "public" : "confidential"
}

function normalizeScopeList(item: UnknownRecord): string[] {
    const scopeList = readStringArray(item, ["scopes"])
    if (scopeList.length > 0) {
        return scopeList.flatMap((scope) =>
            scope
                .split(/[,\s]+/)
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    }

    const scope = readOptionalString(item, ["scope"])
    if (!scope) {
        return []
    }

    return scope
        .split(/[,\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
}

function normalizeOAuthClient(item: UnknownRecord): OAuthClient {
    const redirectUris = readStringArray(item, ["redirectUris", "redirect_uris"])
    const redirectUri = readOptionalString(item, ["redirectUri", "redirect_uri"])

    return {
        clientId: readString(item, ["clientId", "client_id"]),
        clientSecret: readOptionalString(item, ["clientSecret", "client_secret"]),
        name: readString(item, ["name"]),
        clientType: normalizeOAuthClientType(item.clientType ?? item.client_type),
        scopes: normalizeScopeList(item),
        redirectUri: redirectUri ?? (redirectUris[0] ?? ""),
        redirectUris: redirectUris.length > 0 ? redirectUris : (redirectUri ? [redirectUri] : []),
        active: readBoolean(item, ["active"], true),
        createdAt: readString(item, ["createdAt", "created_at"]),
        updatedAt: readOptionalString(item, ["updatedAt", "updated_at"]),
        deleted: readBoolean(item, ["deleted"]),
    }
}

export async function createOAuthClient(data: Partial<OAuthClient>) {
    const res = await request<APIResponse<OAuthClient>>(BASE, { method: "POST", data })
    return unwrapUpdatedData(res, translate("adminOAuthClients.toast.createFailedTitle"))
}

export async function getOAuthClients(params?: QueryParams) {
    const res = await request<APIResponse<{ items?: UnknownRecord[]; total?: number }>>(BASE, {
        method: "GET",
        params,
    })
    const rawItems = readUpdatedItems(res.updatedData)
    return {
        items: rawItems.map((item) => normalizeOAuthClient(item)),
        total: readUpdatedTotal(res.updatedData),
    }
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
    const res = await request<APIResponse<UnknownRecord>>(`${BASE}/${encodePathSegment(clientId)}/rotate-secret`, {
        method: "POST",
    })
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.rotateFailedTitle"))
    const clientSecret = readString(updatedData, ["clientSecret", "client_secret"]).trim()
    if (!clientSecret) {
        throw new Error(translate("common.missingUpdatedData", { context: translate("adminOAuthClients.toast.rotateFailedTitle") }))
    }
    return clientSecret
}

export function deleteOAuthClient(clientId: string) {
    return request(`${BASE}/${encodePathSegment(clientId)}`, { method: "DELETE" })
}

export async function getOAuthClientStatistics(clientId: string, params?: QueryParams) {
    const res = await request<APIResponse<UnknownRecord>>(`${BASE}/${encodePathSegment(clientId)}/statistics`, {
        method: "GET",
        params,
    })
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.loadStatsFailedTitle"))
    return normalizeOAuthClientStatistics(updatedData)
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
    const res = await request<APIResponse>(`${BASE}/${encodePathSegment(clientId)}/audit-summary`, { method: "GET" })
    return res.updatedData
}

const webhooksBase = (clientId: string) => `${BASE}/${encodePathSegment(clientId)}/webhooks`

export async function getOAuthClientWebhooks(clientId: string): Promise<OAuthClientWebhookListResponse> {
    const res = await request<APIResponse<UnknownRecord>>(webhooksBase(clientId), { method: "GET" })
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.loadWebhooksFailedTitle"))
    const items = Array.isArray(updatedData.items)
        ? updatedData.items
            .map((item) => asWebhookRecord(item))
            .filter((item): item is UnknownRecord => item !== null)
            .map((item) => normalizeOAuthClientWebhook(item))
        : []
    return {
        generatedAt: readString(updatedData, ["generatedAt", "generated_at"]),
        clientId: readString(updatedData, ["clientId", "client_id"], clientId),
        total: Number(updatedData.total ?? items.length),
        items,
    }
}

export async function createOAuthClientWebhook(
    clientId: string,
    data: OAuthClientWebhookCreatePayload
): Promise<OAuthClientWebhookMutationResponse> {
    const res = await request<APIResponse<UnknownRecord>>(webhooksBase(clientId), { method: "POST", data })
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.saveWebhookFailedTitle"))
    return {
        generatedAt: readString(updatedData, ["generatedAt", "generated_at"]),
        clientId: readString(updatedData, ["clientId", "client_id"], clientId),
        webhook: readOAuthClientWebhookMutation(updatedData),
    }
}

export async function updateOAuthClientWebhook(
    clientId: string,
    webhookId: string,
    data: OAuthClientWebhookUpdatePayload
): Promise<OAuthClientWebhookMutationResponse> {
    const res = await request<APIResponse<UnknownRecord>>(
        `${webhooksBase(clientId)}/${encodePathSegment(webhookId)}`,
        { method: "PUT", data }
    )
    const updatedData = unwrapUpdatedData(res, translate("adminOAuthClients.toast.saveWebhookFailedTitle"))
    return {
        generatedAt: readString(updatedData, ["generatedAt", "generated_at"]),
        clientId: readString(updatedData, ["clientId", "client_id"], clientId),
        webhook: readOAuthClientWebhookMutation(updatedData),
    }
}

export function deleteOAuthClientWebhook(clientId: string, webhookId: string) {
    return request(`${webhooksBase(clientId)}/${encodePathSegment(webhookId)}`, { method: "DELETE" })
}

function asWebhookRecord(value: unknown): UnknownRecord | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as UnknownRecord)
        : null
}
