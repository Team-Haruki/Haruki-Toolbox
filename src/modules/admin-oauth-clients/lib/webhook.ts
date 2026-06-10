import {
  type UnknownRecord,
  readBoolean,
  readOptionalString,
  readRecord,
  readString,
} from "@/lib/record-utils"
import type {
  OAuthClientWebhook,
  OAuthClientWebhookCreatePayload,
  OAuthClientWebhookUpdatePayload,
} from "@/types/admin"

export function normalizeOAuthClientWebhook(raw: UnknownRecord): OAuthClientWebhook {
  return {
    id: readString(raw, ["id", "webhookId", "webhook_id"]),
    clientId: readString(raw, ["clientId", "client_id"]),
    callbackUrl: readString(raw, ["callbackUrl", "callback_url"]),
    bearerSet: readBoolean(raw, ["bearerSet", "bearer_set"]),
    enabled: readBoolean(raw, ["enabled"], true),
    createdAt: readString(raw, ["createdAt", "created_at"]),
    updatedAt: readOptionalString(raw, ["updatedAt", "updated_at"]),
  }
}

export function readOAuthClientWebhookMutation(raw: UnknownRecord): OAuthClientWebhook {
  const webhook = readRecord(raw, ["webhook"])
  return normalizeOAuthClientWebhook(webhook ?? raw)
}

function normalizeBearer(value: string): string | undefined {
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

export function buildOAuthClientWebhookCreatePayload(input: {
  callbackUrl: string
  bearer: string
  enabled: boolean
}): OAuthClientWebhookCreatePayload {
  const payload: OAuthClientWebhookCreatePayload = {
    callbackUrl: input.callbackUrl.trim(),
    enabled: input.enabled,
  }
  const bearer = normalizeBearer(input.bearer)
  if (bearer) payload.bearer = bearer
  return payload
}

export function buildOAuthClientWebhookUpdatePayload(input: {
  callbackUrl: string
  bearer: string
  enabled: boolean
  clearBearer: boolean
}): OAuthClientWebhookUpdatePayload {
  const payload: OAuthClientWebhookUpdatePayload = {
    callbackUrl: input.callbackUrl.trim(),
    enabled: input.enabled,
  }
  const bearer = normalizeBearer(input.bearer)
  if (input.clearBearer) {
    payload.clearBearer = true
  } else if (bearer) {
    payload.bearer = bearer
  }
  return payload
}
