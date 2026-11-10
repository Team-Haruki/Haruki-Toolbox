import { asRecord, readOptionalString } from "@/lib/record-utils"
import type { OAuthClient, OAuthClientTrendPoint } from "@/types/admin"

/**
 * The numbers behind the OAuth client page's stat panel, the statistics
 * dialog's chart and its audit section. Everything here is counted from a
 * response the page already holds; nothing is estimated.
 */

export type KeyCount = { key: string; count: number }

export type OAuthClientListSummary = {
  /** Clients in the list that was loaded (one page of up to 200). */
  loaded: number
  enabled: number
  disabled: number
  deleted: number
  confidential: number
  public: number
  /** Clients registered for the device code grant. */
  device: number
}

type ListedClient = Pick<OAuthClient, "active" | "deleted" | "clientType" | "deviceEnabled" | "scopes" | "grantTypes">

export function summarizeOAuthClients(clients: readonly ListedClient[]): OAuthClientListSummary {
  const summary: OAuthClientListSummary = {
    loaded: clients.length,
    enabled: 0,
    disabled: 0,
    deleted: 0,
    confidential: 0,
    public: 0,
    device: 0,
  }
  for (const client of clients) {
    if (client.deleted) {
      summary.deleted += 1
    } else if (client.active) {
      summary.enabled += 1
    } else {
      summary.disabled += 1
    }
    if (client.clientType === "public") {
      summary.public += 1
    } else {
      summary.confidential += 1
    }
    if (client.deviceEnabled) {
      summary.device += 1
    }
  }
  return summary
}

function countClientsBy(clients: readonly ListedClient[], read: (client: ListedClient) => readonly string[]): KeyCount[] {
  const counts = new Map<string, number>()
  for (const client of clients) {
    // A value listed twice on one client still counts that client once.
    for (const key of new Set(read(client))) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return sortKeyCounts([...counts].map(([key, count]) => ({ key, count })))
}

/** How many of the clients register each scope, most used first. */
export function countClientsByScope(clients: readonly ListedClient[]): KeyCount[] {
  return countClientsBy(clients, (client) => client.scopes ?? [])
}

/** How many of the clients may use each grant type, most used first. */
export function countClientsByGrantType(clients: readonly ListedClient[]): KeyCount[] {
  return countClientsBy(clients, (client) => client.grantTypes ?? [])
}

function sortKeyCounts(rows: KeyCount[]): KeyCount[] {
  return rows.sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
}

export type OAuthClientTrendSummary = {
  /** Per-bucket values, in bucket order, for the sparklines. */
  authorizations: number[]
  tokens: number[]
  authorizationSum: number
  tokenSum: number
  /** Buckets in which anything happened. */
  activeBuckets: number
  /** The busiest bucket by authorizations + tokens, or null when every bucket is zero. */
  peak: { index: number; bucketStart: string; authorizations: number; tokens: number } | null
}

export function summarizeOAuthClientTrend(trend: readonly OAuthClientTrendPoint[]): OAuthClientTrendSummary {
  const summary: OAuthClientTrendSummary = {
    authorizations: [],
    tokens: [],
    authorizationSum: 0,
    tokenSum: 0,
    activeBuckets: 0,
    peak: null,
  }
  let peakValue = 0
  trend.forEach((point, index) => {
    const authorizations = Math.max(0, point.authorizationCreated)
    const tokens = Math.max(0, point.tokenIssued)
    summary.authorizations.push(authorizations)
    summary.tokens.push(tokens)
    summary.authorizationSum += authorizations
    summary.tokenSum += tokens
    const combined = authorizations + tokens
    if (combined > 0) {
      summary.activeBuckets += 1
    }
    if (combined > peakValue) {
      peakValue = combined
      summary.peak = { index, bucketStart: point.bucketStart, authorizations, tokens }
    }
  })
  return summary
}

/**
 * At most `maxTicks` evenly spread indexes of a series of `length` points,
 * always including the first and the last, for the chart's x axis.
 */
export function pickTickIndexes(length: number, maxTicks: number): number[] {
  if (!Number.isInteger(length) || length <= 0) {
    return []
  }
  const limit = Math.max(2, Math.floor(maxTicks))
  if (length <= limit) {
    return Array.from({ length }, (_, index) => index)
  }
  const last = length - 1
  const ticks = new Set<number>()
  for (let step = 0; step < limit; step += 1) {
    ticks.add(Math.round((last * step) / (limit - 1)))
  }
  return [...ticks].sort((left, right) => left - right)
}

/**
 * Whole-number ticks for a count axis that starts at zero: steps of 1, 2 or 5
 * times a power of ten, at most `maxIntervals` of them, ending on the first
 * tick at or above `max` (so the top of the axis is a labelled value). A flat
 * zero series still gets 0–`maxIntervals`.
 */
export function integerAxisTicks(max: number, maxIntervals = 4): number[] {
  const intervals = Math.max(1, Math.floor(maxIntervals))
  const top = Number.isFinite(max) && max > 0 ? Math.ceil(max) : 0
  if (top <= intervals) {
    return Array.from({ length: intervals + 1 }, (_, index) => index)
  }
  const rough = top / intervals
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ?? 10 * magnitude
  const ticks: number[] = []
  for (let value = 0; value < top + step; value += step) {
    ticks.push(value)
  }
  return ticks
}

/** `part` of `total` as a percentage, or null when there is nothing to divide by. */
export function ratePercent(part: number, total: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return null
  }
  return Math.min(100, Math.max(0, (part / total) * 100))
}

export type OAuthClientAuditSummary = {
  from?: string
  to?: string
  /** Audit log entries that target this client in the range. */
  total: number
  success: number
  failure: number
  byAction: KeyCount[]
}

function readCount(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

function readKeyCounts(value: unknown): KeyCount[] {
  if (!Array.isArray(value)) {
    return []
  }
  const rows: KeyCount[] = []
  for (const entry of value) {
    const record = asRecord(entry)
    const key = record ? (readOptionalString(record, ["key"]) ?? "").trim() : ""
    const count = record ? readCount(record, "count") : 0
    if (key && count > 0) {
      rows.push({ key, count })
    }
  }
  return sortKeyCounts(rows)
}

/**
 * Reads `GET /api/admin/oauth-clients/:client_id/audit-summary` (adminoauth
 * `adminOAuthClientAuditSummaryResponse`: total, success, failure and
 * `{ key, count }` lists). A payload that is not an object reads as empty.
 */
export function normalizeOAuthClientAuditSummary(value: unknown): OAuthClientAuditSummary {
  const record = asRecord(value) ?? {}
  return {
    from: readOptionalString(record, ["from"]),
    to: readOptionalString(record, ["to"]),
    total: readCount(record, "total"),
    success: readCount(record, "success"),
    failure: readCount(record, "failure"),
    byAction: readKeyCounts(record.byAction),
  }
}

/**
 * Audit actions the backend writes for an OAuth client (adminoauth
 * `adminAuditActionOAuthClient*`) and the message key that names each one,
 * under `adminOAuthClients.statsDialog.audit.action`. An action that is not
 * listed is shown as the backend spells it.
 */
export const OAUTH_CLIENT_AUDIT_ACTION_KEYS: ReadonlyMap<string, string> = new Map([
  ["admin.oauth_client.create", "create"],
  ["admin.oauth_client.update", "update"],
  ["admin.oauth_client.active.update", "activeUpdate"],
  ["admin.oauth_client.rotate_secret", "rotateSecret"],
  ["admin.oauth_client.delete", "delete"],
  ["admin.oauth_client.restore", "restore"],
  ["admin.oauth_client.revoke", "revoke"],
  ["admin.oauth_client.statistics.query", "statisticsQuery"],
  ["admin.oauth_client.authorizations.list", "authorizationsList"],
  ["admin.oauth_client.audit_logs.query", "auditLogsQuery"],
  ["admin.oauth_client.audit_summary.query", "auditSummaryQuery"],
  ["admin.oauth_client.webhook.list", "webhookList"],
  ["admin.oauth_client.webhook.create", "webhookCreate"],
  ["admin.oauth_client.webhook.update", "webhookUpdate"],
  ["admin.oauth_client.webhook.delete", "webhookDelete"],
])
