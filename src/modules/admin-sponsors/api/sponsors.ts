import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { asRecord, readBoolean, readRecord, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { AdminSponsorListResponse, AdminSponsorProfile, AdminSponsorUpdatePayload } from "@/types/admin"
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

function readDateString(record: Record<string, unknown> | null, keys: readonly string[]): string {
  if (!record) {
    return ""
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      const date = new Date(value > 9_999_999_999 ? value : value * 1000)
      if (!Number.isNaN(date.valueOf())) {
        return date.toISOString()
      }
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) {
        continue
      }

      const numeric = Number(trimmed)
      if (Number.isFinite(numeric)) {
        const date = new Date(numeric > 9_999_999_999 ? numeric : numeric * 1000)
        if (!Number.isNaN(date.valueOf())) {
          return date.toISOString()
        }
      }

      return trimmed
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

  return {
    id,
    name: readFirstString(user, ["name", "nickname", "userName", "user_name"])
      || readFirstString(record, ["name", "nickname", "userName", "user_name", "displayName", "display_name"]),
    avatar: readFirstString(user, ["avatar", "avatarUrl", "avatar_url"])
      || readFirstString(record, ["avatar", "avatarUrl", "avatar_url"]),
    planName,
    message: readFirstString(record, ["message", "remark", "memo"]),
    source: readFirstString(record, ["source", "origin", "category", "kind", "type"]),
    isActive: readBoolean(record, ["isActive", "is_active", "active"], Boolean(planName)),
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
    planExpiresAt: readDateString(plan, ["expiresAt", "expires_at", "expireTime", "expire_time"])
      || readDateString(record, ["planExpiresAt", "plan_expires_at", "expiresAt", "expires_at"]),
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

export async function listAdminSponsors(): Promise<AdminSponsorListResponse> {
  const response = await request<APIResponse<unknown>>(BASE, { method: "GET" })
  return normalizeAdminSponsorList(unwrapUpdatedData(response, translate("adminSponsors.toast.loadFailedTitle")))
}

export async function updateAdminSponsorProfile(sponsorId: string, payload: AdminSponsorUpdatePayload) {
  const response = await request<APIResponse<unknown>>(`${BASE}/${encodePathSegment(sponsorId)}`, {
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
