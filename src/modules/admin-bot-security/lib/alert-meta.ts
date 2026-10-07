import type { QueryParams } from "@/core/http/query"
import type {
  BotSecurityAlert,
  BotSecurityAlertHandler,
  BotSecurityAlertStatus,
  BotSecurityAlertUpdatePayload,
} from "@/types/admin"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string
type Option = { value: string; label: string }

export const BOT_SECURITY_PAGE_SIZE = 20
export const BOT_SECURITY_NOTE_MAX_LENGTH = 1000
/** Select value for "no filter"; never sent to the backend. */
export const BOT_SECURITY_FILTER_ALL = "all"
export const BOT_SECURITY_DEFAULT_STATUS_FILTER: BotSecurityAlertStatus = "open"

export const BOT_SECURITY_ALERT_STATUSES = ["open", "resolved", "ignored"] as const satisfies readonly BotSecurityAlertStatus[]

/** Kinds Haruki Cloud is known to send. Others still arrive and render as raw text. */
export const BOT_SECURITY_KNOWN_KINDS = [
  "auth_failed",
  "replay_detected",
  "rate_limited",
  "build_rejected",
  "session_revoked",
  "login_source_changed",
  "client_changed",
  "policy_unavailable",
] as const

const KIND_LABEL_KEY: Record<(typeof BOT_SECURITY_KNOWN_KINDS)[number], string> = {
  auth_failed: "adminBotSecurity.kind.authFailed",
  replay_detected: "adminBotSecurity.kind.replayDetected",
  rate_limited: "adminBotSecurity.kind.rateLimited",
  build_rejected: "adminBotSecurity.kind.buildRejected",
  session_revoked: "adminBotSecurity.kind.sessionRevoked",
  login_source_changed: "adminBotSecurity.kind.loginSourceChanged",
  client_changed: "adminBotSecurity.kind.clientChanged",
  policy_unavailable: "adminBotSecurity.kind.policyUnavailable",
}

const STATUS_LABEL_KEY: Record<BotSecurityAlertStatus, string> = {
  open: "adminBotSecurity.status.open",
  resolved: "adminBotSecurity.status.resolved",
  ignored: "adminBotSecurity.status.ignored",
}

export type BotSecurityAlertAction = "resolve" | "ignore" | "reopen"

export const BOT_SECURITY_ACTION_TARGET: Record<BotSecurityAlertAction, BotSecurityAlertStatus> = {
  resolve: "resolved",
  ignore: "ignored",
  reopen: "open",
}

export type BotSecurityAlertFilters = {
  status: string
  kind: string
  botId: string
  from?: Date
  to?: Date
}

export function createDefaultBotSecurityFilters(): BotSecurityAlertFilters {
  return {
    status: BOT_SECURITY_DEFAULT_STATUS_FILTER,
    kind: BOT_SECURITY_FILTER_ALL,
    botId: "",
    from: undefined,
    to: undefined,
  }
}

export function isBotSecurityAlertStatus(value: unknown): value is BotSecurityAlertStatus {
  return typeof value === "string" && (BOT_SECURITY_ALERT_STATUSES as readonly string[]).includes(value)
}

function isKnownKind(kind: string): kind is keyof typeof KIND_LABEL_KEY {
  return Object.hasOwn(KIND_LABEL_KEY, kind)
}

/** Localized label for a kind; unknown kinds render as their raw value. */
export function resolveBotSecurityKindLabel(kind: string | null | undefined, t: TranslateFn): string {
  const value = (kind ?? "").trim()
  if (!value) return t("adminBotSecurity.common.fallback")
  return isKnownKind(value) ? t(KIND_LABEL_KEY[value]) : value
}

export function resolveBotSecurityStatusLabel(status: string | null | undefined, t: TranslateFn): string {
  const value = (status ?? "").trim()
  if (!value) return t("adminBotSecurity.common.fallback")
  return isBotSecurityAlertStatus(value) ? t(STATUS_LABEL_KEY[value]) : value
}

export function getBotSecurityStatusOptions(t: TranslateFn): Option[] {
  return [
    ...BOT_SECURITY_ALERT_STATUSES.map((status) => ({ value: status, label: t(STATUS_LABEL_KEY[status]) })),
    { value: BOT_SECURITY_FILTER_ALL, label: t("adminBotSecurity.filters.allStatuses") },
  ]
}

/**
 * Kind filter options: every known kind, then any other kind seen in the
 * summary or currently selected, so a new Cloud kind can still be filtered on.
 */
export function getBotSecurityKindOptions(t: TranslateFn, extraKinds: readonly string[] = []): Option[] {
  const known = new Set<string>(BOT_SECURITY_KNOWN_KINDS)
  const extras = Array.from(new Set(
    extraKinds
      .map((kind) => kind.trim())
      .filter((kind) => kind !== "" && kind !== BOT_SECURITY_FILTER_ALL && !known.has(kind)),
  )).sort()

  return [
    { value: BOT_SECURITY_FILTER_ALL, label: t("adminBotSecurity.filters.allKinds") },
    ...BOT_SECURITY_KNOWN_KINDS.map((kind) => ({ value: kind, label: t(KIND_LABEL_KEY[kind]) })),
    ...extras.map((kind) => ({ value: kind, label: kind })),
  ]
}

export function hasInvalidBotSecurityTimeRange(filters: Pick<BotSecurityAlertFilters, "from" | "to">): boolean {
  return !!filters.from && !!filters.to && filters.from.getTime() > filters.to.getTime()
}

/** Query for GET /api/admin/bot-security/alerts; "all" and blank filters are left out. */
export function buildBotSecurityAlertQuery(
  filters: BotSecurityAlertFilters,
  page: number,
  pageSize: number,
): QueryParams {
  const params: QueryParams = { page, pageSize }
  const status = filters.status.trim()
  if (status && status !== BOT_SECURITY_FILTER_ALL) params.status = status
  const kind = filters.kind.trim()
  if (kind && kind !== BOT_SECURITY_FILTER_ALL) params.kind = kind
  const botId = filters.botId.trim()
  if (botId) params.botId = botId
  if (filters.from) params.from = filters.from.toISOString()
  if (filters.to) params.to = filters.to.toISOString()
  return params
}

/**
 * PATCH body for a status change. The note is only sent when it differs from
 * the stored one: the backend keeps the note when it is omitted, and "" clears it.
 */
export function buildBotSecurityAlertUpdatePayload(
  alert: Pick<BotSecurityAlert, "note">,
  status: BotSecurityAlertStatus,
  noteDraft: string,
): BotSecurityAlertUpdatePayload {
  const note = noteDraft.trim()
  return note === alert.note.trim() ? { status } : { status, note }
}

/** Status changes offered for an alert in the given status. */
export function botSecurityActionsFor(status: string): BotSecurityAlertAction[] {
  switch (status) {
    case "open":
      return ["resolve", "ignore"]
    case "resolved":
      return ["reopen", "ignore"]
    case "ignored":
      return ["reopen", "resolve"]
    default:
      return []
  }
}

/** "10 min", "1 h", "45 s"; the largest unit that divides the window evenly. */
export function formatBotSecurityWindow(seconds: number, t: TranslateFn): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return t("adminBotSecurity.common.fallback")
  if (seconds % 86_400 === 0) return t("adminBotSecurity.window.days", { count: seconds / 86_400 })
  if (seconds % 3_600 === 0) return t("adminBotSecurity.window.hours", { count: seconds / 3_600 })
  if (seconds % 60 === 0) return t("adminBotSecurity.window.minutes", { count: seconds / 60 })
  return t("adminBotSecurity.window.seconds", { count: seconds })
}

/** Display name of the handler; a deleted user (empty name) falls back to the user id. */
export function resolveBotSecurityHandlerLabel(handler: BotSecurityAlertHandler | null): string {
  if (!handler) return ""
  return handler.name.trim() || handler.userId
}
