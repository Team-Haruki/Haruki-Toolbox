export type BotSecurityAlertStatus = "open" | "resolved" | "ignored"

/** The admin who last moved an alert out of open. `name` is "" once that user is deleted. */
export interface BotSecurityAlertHandler {
  userId: string
  name: string
}

/**
 * One bot-client security alert reported by Haruki Cloud. Text members are ""
 * when absent; `kind` may be a value this build does not know yet.
 */
export interface BotSecurityAlert {
  id: number
  kind: string
  botId: string | null
  ownerQq: string | null
  sourceIp: string
  buildId: string
  clientVersion: string
  reason: string
  /** Whether Cloud blocked the action (false = log-only). */
  enforced: boolean
  count: number
  threshold: number
  windowSeconds: number
  node: string
  alertTime: string
  receivedAt: string
  status: BotSecurityAlertStatus
  note: string
  handledBy: BotSecurityAlertHandler | null
  handledAt: string | null
}

export interface BotSecurityAlertListResponse {
  items: BotSecurityAlert[]
  total: number
  page: number
  pageSize: number
}

export interface BotSecurityKindCount {
  kind: string
  count: number
}

export interface BotSecuritySummary {
  /** Open alerts. */
  open: number
  /** Open alerts per kind, largest first. */
  byKind: BotSecurityKindCount[]
  /** Alerts of any status raised in the last 24 hours / 7 days. */
  last24h: number
  last7d: number
}

export interface BotSecurityAlertUpdatePayload {
  status: BotSecurityAlertStatus
  /** Omitted keeps the stored note; "" clears it. */
  note?: string
}
