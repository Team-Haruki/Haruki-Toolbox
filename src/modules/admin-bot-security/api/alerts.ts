import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { encodePathSegment } from "@/core/http/url"
import { asRecord, readString, type UnknownRecord } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type {
  BotSecurityAlert,
  BotSecurityAlertListResponse,
  BotSecurityAlertStatus,
  BotSecurityAlertUpdatePayload,
  BotSecurityKindCount,
  BotSecuritySummary,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/bot-security"

function readCount(record: UnknownRecord | null, key: string): number {
  const value = record?.[key]
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

/** null, a missing member and "" all mean "absent" for the nullable members. */
function readNullableString(record: UnknownRecord, key: string): string | null {
  const value = record[key]
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === "" ? null : text
}

/**
 * Maps one alert from the backend. Client-controlled text (build id, client
 * version, reason) is kept verbatim: the page renders it as text only.
 */
export function normalizeBotSecurityAlert(value: unknown): BotSecurityAlert | null {
  const record = asRecord(value)
  if (!record) return null

  const id = readCount(record, "id")
  if (id <= 0) return null

  const handlerRecord = asRecord(record.handledBy)
  const handlerUserId = handlerRecord ? readString(handlerRecord, ["userId"]).trim() : ""

  return {
    id,
    kind: readString(record, ["kind"]).trim(),
    botId: readNullableString(record, "botId"),
    ownerQq: readNullableString(record, "ownerQq"),
    sourceIp: readString(record, ["sourceIp"]),
    buildId: readString(record, ["buildId"]),
    clientVersion: readString(record, ["clientVersion"]),
    reason: readString(record, ["reason"]),
    enforced: record.enforced === true,
    count: readCount(record, "count"),
    threshold: readCount(record, "threshold"),
    windowSeconds: readCount(record, "windowSeconds"),
    node: readString(record, ["node"]),
    alertTime: readString(record, ["alertTime"]),
    receivedAt: readString(record, ["receivedAt"]),
    // Unknown values are kept so the page shows what the backend sent.
    status: readString(record, ["status"]).trim().toLowerCase() as BotSecurityAlertStatus,
    note: readString(record, ["note"]),
    handledBy: handlerRecord && handlerUserId
      ? { userId: handlerUserId, name: readString(handlerRecord, ["name"]) }
      : null,
    handledAt: readNullableString(record, "handledAt"),
  }
}

export function normalizeBotSecurityAlertList(value: unknown): BotSecurityAlertListResponse {
  const record = asRecord(value)
  const rawItems = Array.isArray(record?.items) ? record.items : []
  const items = rawItems
    .map((item) => normalizeBotSecurityAlert(item))
    .filter((item): item is BotSecurityAlert => item !== null)

  return {
    items,
    total: record && "total" in record ? readCount(record, "total") : items.length,
    page: readCount(record, "page"),
    pageSize: readCount(record, "pageSize"),
  }
}

export function normalizeBotSecuritySummary(value: unknown): BotSecuritySummary {
  const record = asRecord(value)
  const rawByKind = Array.isArray(record?.byKind) ? record.byKind : []
  const byKind: BotSecurityKindCount[] = []
  for (const entry of rawByKind) {
    const entryRecord = asRecord(entry)
    const kind = entryRecord ? readString(entryRecord, ["kind"]).trim() : ""
    if (!kind) continue
    byKind.push({ kind, count: readCount(entryRecord, "count") })
  }

  return {
    open: readCount(record, "open"),
    byKind,
    last24h: readCount(record, "last24h"),
    last7d: readCount(record, "last7d"),
  }
}

export async function getBotSecurityAlerts(params?: QueryParams): Promise<BotSecurityAlertListResponse> {
  const res = await request<APIResponse<unknown>>(`${BASE}/alerts`, {
    method: "GET",
    params,
  })
  return normalizeBotSecurityAlertList(unwrapUpdatedData(res, translate("adminBotSecurity.toast.loadFailedTitle")))
}

export async function getBotSecuritySummary(): Promise<BotSecuritySummary> {
  const res = await request<APIResponse<unknown>>(`${BASE}/summary`, { method: "GET" })
  return normalizeBotSecuritySummary(unwrapUpdatedData(res, translate("adminBotSecurity.toast.loadSummaryFailedTitle")))
}

export async function updateBotSecurityAlert(
  alertId: number,
  payload: BotSecurityAlertUpdatePayload,
): Promise<BotSecurityAlert | null> {
  const res = await request<APIResponse<unknown>>(`${BASE}/alerts/${encodePathSegment(alertId)}`, {
    method: "PATCH",
    data: payload,
  })
  return normalizeBotSecurityAlert(unwrapUpdatedData(res, translate("adminBotSecurity.toast.updateFailedTitle")))
}
