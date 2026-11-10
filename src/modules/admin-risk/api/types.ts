/**
 * The risk API as the backend sends it (internal/modules/adminrisk in the
 * backend repository), after normalising. Optional members the backend omits
 * arrive here as "" / null, so the views never branch on `undefined`.
 */
export interface RiskEventItem {
  id: string
  /** RFC 3339. */
  eventTime: string
  /** "open" | "resolved"; an unknown value is kept and shown as is. */
  status: string
  /** "low" | "medium" | "high" | "critical"; an unknown value is kept and shown as is. */
  severity: string
  source: string
  actorUserId: string
  targetUserId: string
  ip: string
  action: string
  reason: string
  resolvedAt: string | null
  resolvedBy: string
  metadata: Record<string, unknown> | null
}

export interface RiskEventPage {
  items: RiskEventItem[]
  total: number
  /** The time window the backend applied (it defaults to the last 24 hours). */
  from: string
  to: string
}

export interface CreateRiskEventRequest {
  severity: string
  source: string
  targetUserId?: string
  action: string
  reason: string
}

/** A stored rule. `config` is always an object; `updatedBy` is a user id or "". */
export interface RiskRuleItem {
  key: string
  description: string
  config: Record<string, unknown>
  updatedAt: string
  updatedBy: string
}

/** What PUT /rules takes per rule: it upserts by `key` and never deletes. */
export interface RiskRuleDraft {
  key: string
  description: string
  config: Record<string, unknown>
}
