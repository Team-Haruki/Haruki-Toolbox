import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { asRecord, readBoolean, readDateString, readRecord, readString } from "@/lib/record-utils"
import { readSponsorCategory } from "@/modules/sponsor/lib/categories"
import { translate } from "@/shared/i18n"
import type {
  AdminAfdianOrder,
  AdminAfdianOrderKind,
  AdminManualDuration,
  AdminManualDurationPayload,
  AdminSponsorCreatePayload,
  AdminSponsorDetail,
  AdminSponsorListResponse,
  AdminSponsorProfile,
  AdminSponsorUpdatePayload,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/sponsors"

function readNumber(record: Record<string, unknown> | null, keys: readonly string[]): number | null {
  if (!record) {
    return null
  }

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

  return null
}

function readFirstString(record: Record<string, unknown> | null, keys: readonly string[]): string {
  if (!record) {
    return ""
  }

  for (const key of keys) {
    const value = readString(record, [key]).trim()
    if (value) {
      return value
    }
  }

  return ""
}

function normalizeSponsorProfile(value: unknown): AdminSponsorProfile | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const user = readRecord(record, ["user", "sponsor", "supporter"])
  const plan = readRecord(record, ["plan", "currentPlan", "current_plan"])
  const id = readFirstString(user, ["id", "userId", "user_id"])
    || readFirstString(record, ["id", "userId", "user_id", "afdianUserId", "afdian_user_id", "outTradeNo", "out_trade_no"])
  if (!id) {
    return null
  }

  const planName = readFirstString(plan, ["name", "title"])
    || readFirstString(record, ["planName", "plan_name", "title"])

  const planExpiresAt = readDateString(plan, ["expiresAt", "expires_at", "expireTime", "expire_time"])
    || readDateString(record, ["planExpiresAt", "plan_expires_at", "expiresAt", "expires_at"])

  const activeFallback = planExpiresAt
    ? new Date(planExpiresAt).valueOf() > Date.now()
    : false
  // The backend's category decides; isActive only feeds the fallback for
  // payloads without one.
  const category = readSponsorCategory(record.category, {
    isActive: readBoolean(record, ["isActive", "is_active", "active"], activeFallback),
  })

  return {
    id,
    name: readFirstString(user, ["name", "nickname", "userName", "user_name"])
      || readFirstString(record, ["name", "nickname", "userName", "user_name", "displayName", "display_name"]),
    avatar: readFirstString(user, ["avatar", "avatarUrl", "avatar_url"])
      || readFirstString(record, ["avatar", "avatarUrl", "avatar_url"]),
    planName,
    message: readFirstString(record, ["message", "remark", "memo"]),
    source: readFirstString(record, ["source", "origin", "category", "kind", "type"]),
    category,
    isActive: category === "current",
    afdianSyncDisabled: readBoolean(record, [
      "afdianSyncDisabled",
      "afdian_sync_disabled",
      "disableAfdianSync",
      "disable_afdian_sync",
      "manualProfile",
      "manual_profile",
    ], false),
    totalAmount: readNumber(record, ["totalAmount", "total_amount", "allSumAmount", "all_sum_amount", "showAmount", "show_amount", "amount"]),
    month: readNumber(record, ["month", "months"]),
    paidAt: readDateString(record, ["paidAt", "paid_at", "lastPayTime", "last_pay_time", "createdAt", "created_at"]),
    planExpiresAt,
    afdianExpiresAt: readDateString(record, ["afdianExpiresAt", "afdian_expires_at"]),
    afdianMonths: readNumber(record, ["afdianMonths", "afdian_months"]) ?? 0,
    durationMigrationPending: readBoolean(record, ["durationMigrationPending"], false),
    createdAt: readDateString(record, ["createdAt", "created_at"]),
    updatedAt: readDateString(record, ["updatedAt", "updated_at"]),
  }
}

export function normalizeAdminSponsorList(value: unknown): AdminSponsorListResponse {
  const record = asRecord(value)
  const rawItems = Array.isArray(value)
    ? value
    : Array.isArray(record?.items)
      ? record.items
      : Array.isArray(record?.supporters)
        ? record.supporters
        : Array.isArray(record?.sponsors)
          ? record.sponsors
          : []
  const items = rawItems
    .map((item) => normalizeSponsorProfile(item))
    .filter((item): item is AdminSponsorProfile => item !== null)

  return {
    generatedAt: record ? readString(record, ["generatedAt", "generated_at", "updatedAt", "updated_at"]).trim() : "",
    total: readNumber(record, ["total", "totalCount", "total_count"]) ?? items.length,
    items,
  }
}

const ORDER_KINDS: readonly AdminAfdianOrderKind[] = ["duration", "no_time", "ignored"]

function normalizeAfdianOrder(value: unknown): AdminAfdianOrder | null {
  const record = asRecord(value)
  const outTradeNo = readFirstString(record, ["outTradeNo"])
  if (!record || !outTradeNo) {
    return null
  }
  const kind = readString(record, ["kind"]) as AdminAfdianOrderKind
  return {
    outTradeNo,
    planId: readFirstString(record, ["planId"]),
    planTitle: readFirstString(record, ["planTitle"]),
    productType: readNumber(record, ["productType"]) ?? 0,
    month: readNumber(record, ["month"]) ?? 0,
    kind: ORDER_KINDS.includes(kind) ? kind : "ignored",
    totalAmount: readNumber(record, ["totalAmount"]),
    showAmount: readNumber(record, ["showAmount"]),
    remark: readFirstString(record, ["remark"]),
    paidAt: readDateString(record, ["paidAt"]),
  }
}

function normalizeManualDuration(value: unknown): AdminManualDuration | null {
  const record = asRecord(value)
  const id = readNumber(record, ["id"])
  if (!record || id === null) {
    return null
  }
  return {
    id,
    amount: readNumber(record, ["amount"]) ?? 0,
    unit: readString(record, ["unit"]) === "month" ? "month" : "day",
    startsAt: readDateString(record, ["startsAt"]),
    note: readFirstString(record, ["note"]),
    origin: readString(record, ["origin"]) === "migration" ? "migration" : "admin",
    createdBy: readFirstString(record, ["createdBy"]),
    createdAt: readDateString(record, ["createdAt"]),
    updatedBy: readFirstString(record, ["updatedBy"]),
    updatedAt: readDateString(record, ["updatedAt"]),
  }
}

export function normalizeAdminSponsorDetail(value: unknown): AdminSponsorDetail | null {
  const record = asRecord(value)
  const sponsor = normalizeSponsorProfile(readRecord(record ?? {}, ["sponsor"]))
  if (!record || !sponsor) {
    return null
  }
  const afdian = readRecord(record, ["afdian"])
  const orders = Array.isArray(afdian?.orders) ? afdian.orders : []
  const entries = Array.isArray(record.manualDurations) ? record.manualDurations : []
  return {
    sponsor,
    afdian: {
      expiresAt: readDateString(afdian, ["expiresAt"]),
      months: readNumber(afdian, ["months"]) ?? 0,
      reportedExpiresAt: readDateString(afdian, ["reportedExpiresAt"]),
      orders: orders.map(normalizeAfdianOrder).filter((item): item is AdminAfdianOrder => item !== null),
    },
    manualDurations: entries.map(normalizeManualDuration).filter((item): item is AdminManualDuration => item !== null),
    effectiveExpiresAt: readDateString(record, ["effectiveExpiresAt"]),
  }
}

async function requestDetail(url: string, method: "GET" | "POST" | "PUT" | "DELETE", failedTitleKey: string, data?: unknown) {
  // A retried DELETE would answer 404 for an entry the first try removed.
  const response = await request<APIResponse<unknown>>(url, { method, data, retry: method === "DELETE" ? 0 : undefined })
  const detail = normalizeAdminSponsorDetail(unwrapUpdatedData(response, translate(failedTitleKey)))
  if (!detail) {
    throw new Error(translate(failedTitleKey))
  }
  return detail
}

function sponsorPath(sponsorId: string) {
  return `${BASE}/${encodePathSegment(sponsorId)}`
}

export function getAdminSponsorDetail(sponsorId: string) {
  return requestDetail(sponsorPath(sponsorId), "GET", "adminSponsors.toast.loadFailedTitle")
}

export function createAdminSponsor(payload: AdminSponsorCreatePayload) {
  return requestDetail(BASE, "POST", "adminSponsors.toast.saveFailedTitle", payload)
}

export function addAdminSponsorManualDuration(sponsorId: string, payload: AdminManualDurationPayload) {
  return requestDetail(`${sponsorPath(sponsorId)}/manual-durations`, "POST", "adminSponsors.toast.manualSaveFailedTitle", payload)
}

export function updateAdminSponsorManualDuration(sponsorId: string, entryId: number, payload: AdminManualDurationPayload) {
  return requestDetail(`${sponsorPath(sponsorId)}/manual-durations/${entryId}`, "PUT", "adminSponsors.toast.manualSaveFailedTitle", payload)
}

export function deleteAdminSponsorManualDuration(sponsorId: string, entryId: number) {
  return requestDetail(`${sponsorPath(sponsorId)}/manual-durations/${entryId}`, "DELETE", "adminSponsors.toast.manualDeleteFailedTitle")
}

export async function listAdminSponsors(): Promise<AdminSponsorListResponse> {
  const response = await request<APIResponse<unknown>>(BASE, { method: "GET" })
  return normalizeAdminSponsorList(unwrapUpdatedData(response, translate("adminSponsors.toast.loadFailedTitle")))
}

export async function updateAdminSponsorProfile(sponsorId: string, payload: AdminSponsorUpdatePayload) {
  const response = await request<APIResponse<unknown>>(sponsorPath(sponsorId), {
    method: "PUT",
    data: payload,
  })
  const updatedData = unwrapUpdatedData(response, translate("adminSponsors.toast.saveFailedTitle"))
  const record = asRecord(updatedData)
  return normalizeSponsorProfile(readRecord(record ?? {}, ["sponsor"]) ?? updatedData)
}

export async function syncAdminSponsorsFromAfdian() {
  await request<APIResponse<unknown>>(`${BASE}/sync/afdian`, {
    method: "POST",
  })
}
