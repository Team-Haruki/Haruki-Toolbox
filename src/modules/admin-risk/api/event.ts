import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { encodePathSegment } from "@/core/http/url"
import { isJsonRecord } from "@/lib/json-utils"
import { asRecord, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types/response"
import type { CreateRiskEventRequest, RiskEventItem, RiskEventPage } from "./types"

const BASE = "/api/admin/risk"

function readId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return typeof value === "string" ? value.trim() : ""
}

/** One event from the backend; null when it has no id. */
export function normalizeRiskEvent(value: unknown): RiskEventItem | null {
  const record = asRecord(value)
  if (!record) return null

  const id = readId(record.id)
  if (!id) return null

  const resolvedAt = readString(record, ["resolvedAt"]).trim()
  return {
    id,
    // `createdAt` is what older builds of this page expected; the backend sends `eventTime`.
    eventTime: readString(record, ["eventTime", "createdAt"]).trim(),
    status: readString(record, ["status"]).trim().toLowerCase(),
    severity: readString(record, ["severity"]).trim().toLowerCase(),
    source: readString(record, ["source"]).trim(),
    actorUserId: readString(record, ["actorUserId"]).trim(),
    targetUserId: readString(record, ["targetUserId"]).trim(),
    ip: readString(record, ["ip"]).trim(),
    action: readString(record, ["action"]),
    reason: readString(record, ["reason"]),
    resolvedAt: resolvedAt || null,
    resolvedBy: readString(record, ["resolvedBy"]).trim(),
    metadata: isJsonRecord(record.metadata) && Object.keys(record.metadata).length > 0 ? record.metadata : null,
  }
}

export function normalizeRiskEventPage(value: unknown): RiskEventPage {
  const record = asRecord(value)
  const rawItems = Array.isArray(record?.items) ? record.items : []
  const items = rawItems
    .map((item) => normalizeRiskEvent(item))
    .filter((item): item is RiskEventItem => item !== null)
  const total = record?.total
  return {
    items,
    total: typeof total === "number" && Number.isFinite(total) ? total : items.length,
    from: record ? readString(record, ["from"]).trim() : "",
    to: record ? readString(record, ["to"]).trim() : "",
  }
}

export async function getRiskEvents(params?: QueryParams): Promise<RiskEventPage> {
  const res = await request<APIResponse<unknown>>(`${BASE}/events`, {
    method: "GET",
    params,
  })
  return normalizeRiskEventPage(unwrapUpdatedData(res, translate("adminRisk.toast.loadEventsFailedTitle")))
}

/**
 * How many events match `filters` (from / to / status / severity): the list's
 * `total`, asked for with a single row. There is no summary endpoint.
 */
export async function getRiskEventTotal(filters: QueryParams): Promise<number> {
  const page = await getRiskEvents({ ...filters, page: 1, page_size: 1 })
  return page.total
}

export function createRiskEvent(data: CreateRiskEventRequest) {
  return request(`${BASE}/events`, { method: "POST", data })
}

export function resolveRiskEvent(eventId: string) {
  return request(`${BASE}/events/${encodePathSegment(eventId)}/resolve`, { method: "POST" })
}
