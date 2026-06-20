import { asRecord, readRecord, readString } from "@/lib/record-utils"
import type { SponsorPageData, SponsorSummary, SponsorSupporter } from "@/modules/sponsor/types"

const SUCCESS_ORDER_STATUS = 2

function unwrapData(payload: unknown): unknown {
  const record = asRecord(payload)
  if (!record) {
    return payload
  }

  return record.updatedData ?? record.data ?? payload
}

function readNumber(record: Record<string, unknown> | null, keys: readonly string[]): number | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
    if (typeof value === "string") {
      const parsed = Number(value.trim())
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

function extractSponsorItems(payload: unknown): unknown[] {
  const data = unwrapData(payload)
  if (Array.isArray(data)) {
    return data
  }

  const record = asRecord(data)
  if (!record) {
    return []
  }

  for (const key of ["items", "supporters", "sponsors", "orders", "list"]) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  const order = readRecord(record, ["order"])
  if (order) {
    return [order]
  }

  return []
}

function normalizeSponsorItem(value: unknown, index: number): SponsorSupporter | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const status = readNumber(record, ["status"])
  if (status !== null && status !== SUCCESS_ORDER_STATUS) {
    return null
  }

  const user = readRecord(record, ["user", "sponsor", "supporter"])
  const plan = readRecord(record, ["plan", "currentPlan", "current_plan"])
  const id = readFirstString(user, ["id", "userId", "user_id"])
    || readFirstString(record, ["id", "userId", "user_id", "outTradeNo", "out_trade_no"])
    || `sponsor-${index}`
  const name = readFirstString(user, ["name", "nickname", "userName", "user_name"])
    || readFirstString(record, ["name", "nickname", "userName", "user_name", "displayName", "display_name"])
  const planName = readFirstString(plan, ["name", "title"])
    || readFirstString(record, ["planName", "plan_name", "title"])
  const planId = readFirstString(plan, ["id", "planId", "plan_id"])
  const source = readFirstString(record, ["source", "origin", "category", "kind", "type"])

  return {
    id,
    name,
    avatar: readFirstString(user, ["avatar", "avatarUrl", "avatar_url"])
      || readFirstString(record, ["avatar", "avatarUrl", "avatar_url"]),
    planName,
    planPrice: readNumber(plan, ["price", "showPrice", "show_price"]),
    planRank: readNumber(plan, ["rank", "rankType", "rank_type"]),
    planPayMonths: readNumber(plan, ["payMonth", "pay_month", "month", "months"]),
    planExpiresAt: readDateString(plan, ["expiresAt", "expires_at", "expireTime", "expire_time"]),
    source,
    isActive: Boolean(planName || planId),
    totalAmount: readNumber(record, ["totalAmount", "total_amount", "allSumAmount", "all_sum_amount", "showAmount", "show_amount", "amount"]),
    month: readNumber(record, ["month", "months"]),
    paidAt: readDateString(record, [
      "paidAt",
      "paid_at",
      "lastPayTime",
      "last_pay_time",
      "firstPayTime",
      "first_pay_time",
      "createdAt",
      "created_at",
      "createTime",
      "create_time",
      "updatedAt",
      "updated_at",
    ]),
    message: readFirstString(record, ["remark", "message", "memo"]),
  }
}

function normalizeSponsorSummary(payload: unknown, supporters: SponsorSupporter[]): SponsorSummary {
  const data = unwrapData(payload)
  const record = asRecord(data)
  const summary = readRecord(record ?? {}, ["summary", "stats", "meta"])
  const source = summary ?? record
  const fallbackTotal = supporters.reduce((sum, supporter) => sum + (supporter.totalAmount ?? 0), 0)
  const totalAmount = readNumber(source, ["totalAmount", "total_amount", "allSumAmount", "all_sum_amount", "amount"])
  const supporterCount = readNumber(source, ["supporterCount", "supporter_count", "sponsorCount", "sponsor_count", "totalCount", "total_count", "total"]) ?? supporters.length

  return {
    totalAmount: totalAmount ?? (supporters.length > 0 ? fallbackTotal : null),
    supporterCount,
    generatedAt: readFirstString(source, ["generatedAt", "generated_at", "updatedAt", "updated_at"]),
  }
}

export function normalizeSponsorPageData(payload: unknown): SponsorPageData {
  const supporters = extractSponsorItems(payload)
    .map((item, index) => normalizeSponsorItem(item, index))
    .filter((item): item is SponsorSupporter => item !== null)

  return {
    summary: normalizeSponsorSummary(payload, supporters),
    supporters,
  }
}
