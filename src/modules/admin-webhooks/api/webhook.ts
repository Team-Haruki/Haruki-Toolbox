import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { asRecord, readBoolean, readRecord, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types/response"
import type {
  AdminWebhookCreatePayload,
  AdminWebhookEndpoint,
  AdminWebhookListResponse,
  AdminWebhookMutationResponse,
  AdminWebhookSettings,
  AdminWebhookSubscriber,
  AdminWebhookSubscriberListResponse,
  AdminWebhookUpdatePayload,
} from "@/types/admin"

const BASE = "/api/admin/webhooks"

function readNumber(record: Record<string, unknown>, keys: readonly string[], fallback = 0): number {
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

function normalizeWebhookEndpoint(value: unknown): AdminWebhookEndpoint | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const id = readString(record, ["id"]).trim()
  const credential = readString(record, ["credential"]).trim()
  const callbackUrl = readString(record, ["callbackUrl", "callback_url"]).trim()
  if (!id || !credential || !callbackUrl) {
    return null
  }

  return {
    id,
    credential,
    callbackUrl,
    bearer: readString(record, ["bearer"]).trim(),
    enabled: readBoolean(record, ["enabled"], true),
    subscriptionCount: readNumber(record, ["subscriptionCount", "subscription_count"]),
    createdAt: readString(record, ["createdAt", "created_at"]).trim(),
  }
}

function normalizeWebhookSettings(value: unknown): AdminWebhookSettings {
  const record = asRecord(value)
  if (!record) {
    return {
      enabled: false,
      jwtSecretConfigured: false,
    }
  }

  return {
    enabled: readBoolean(record, ["enabled"], false),
    jwtSecretConfigured: readBoolean(record, ["jwtSecretConfigured", "jwt_secret_configured"], false),
  }
}

function normalizeWebhookMutationResponse(value: unknown): AdminWebhookMutationResponse {
  const record = asRecord(value)
  const webhook = normalizeWebhookEndpoint(readRecord(record ?? {}, ["webhook"])) ?? {
    id: "",
    credential: "",
    callbackUrl: "",
    bearer: "",
    enabled: true,
    subscriptionCount: 0,
    createdAt: "",
  }

  return {
    webhook,
    token: record ? readString(record, ["token"]).trim() : "",
    tokenHeaderName: record ? readString(record, ["tokenHeaderName", "token_header_name"]).trim() : "",
  }
}

function normalizeWebhookSubscriber(value: unknown): AdminWebhookSubscriber | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const userId = readString(record, ["userId", "user_id"]).trim()
  const server = readString(record, ["server"]).trim()
  const dataType = readString(record, ["dataType", "data_type"]).trim()
  if (!userId || !server || !dataType) {
    return null
  }

  return {
    userId,
    server,
    dataType,
    createdAt: readString(record, ["createdAt", "created_at"]).trim(),
  }
}

export async function getAdminWebhookSettings() {
  const response = await request<APIResponse<unknown>>(`${BASE}/settings`, { method: "GET" })
  return normalizeWebhookSettings(unwrapUpdatedData(response, translate("adminWebhooks.toast.loadSettingsFailedTitle")))
}

export async function updateAdminWebhookSettings(payload: { enabled?: boolean; jwtSecret?: string }) {
  const response = await request<APIResponse<unknown>>(`${BASE}/settings`, {
    method: "PUT",
    data: payload,
  })
  return normalizeWebhookSettings(response.updatedData)
}

export async function listAdminWebhookEndpoints(): Promise<AdminWebhookListResponse> {
  const response = await request<APIResponse<unknown>>(BASE, { method: "GET" })
  const updatedData = unwrapUpdatedData(response, translate("adminWebhooks.toast.loadEndpointsFailedTitle"))
  const record = asRecord(updatedData)
  const rawItems = Array.isArray(record?.items) ? record.items : []

  return {
    generatedAt: record ? readString(record, ["generatedAt", "generated_at"]).trim() : "",
    total: record ? readNumber(record, ["total"], rawItems.length) : rawItems.length,
    items: rawItems
      .map((item) => normalizeWebhookEndpoint(item))
      .filter((item): item is AdminWebhookEndpoint => item !== null),
  }
}

export async function createAdminWebhookEndpoint(payload: AdminWebhookCreatePayload) {
  const response = await request<APIResponse<unknown>>(BASE, {
    method: "POST",
    data: payload,
  })
  return normalizeWebhookMutationResponse(unwrapUpdatedData(response, translate("adminWebhooks.toast.createFailedTitle")))
}

export async function updateAdminWebhookEndpoint(webhookId: string, payload: AdminWebhookUpdatePayload) {
  const response = await request<APIResponse<unknown>>(`${BASE}/${encodePathSegment(webhookId)}`, {
    method: "PUT",
    data: payload,
  })
  return normalizeWebhookMutationResponse(unwrapUpdatedData(response, translate("adminWebhooks.toast.saveFailedTitle")))
}

export async function deleteAdminWebhookEndpoint(webhookId: string) {
  await request<APIResponse<null>>(`${BASE}/${encodePathSegment(webhookId)}`, {
    method: "DELETE",
  })
}

export async function getAdminWebhookSubscribers(webhookId: string): Promise<AdminWebhookSubscriberListResponse> {
  const response = await request<APIResponse<unknown>>(`${BASE}/${encodePathSegment(webhookId)}/subscribers`, {
    method: "GET",
  })
  const updatedData = unwrapUpdatedData(response, translate("adminWebhooks.toast.loadSubscribersFailedTitle"))
  const record = asRecord(updatedData)
  const rawItems = Array.isArray(record?.items) ? record.items : []

  return {
    generatedAt: record ? readString(record, ["generatedAt", "generated_at"]).trim() : "",
    webhookId: record ? readString(record, ["webhookId", "webhook_id"]).trim() : webhookId,
    total: record ? readNumber(record, ["total"], rawItems.length) : rawItems.length,
    items: rawItems
      .map((item) => normalizeWebhookSubscriber(item))
      .filter((item): item is AdminWebhookSubscriber => item !== null),
  }
}
