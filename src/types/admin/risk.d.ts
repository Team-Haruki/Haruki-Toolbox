export interface RiskEvent {
  id: string
  severity: "low" | "medium" | "high" | "critical"
  source: string
  targetUserId?: string
  userName?: string
  action: string
  reason: string
  status: "open" | "resolved"
  metadata?: Record<string, unknown>
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface CreateRiskEventRequest {
  severity: string
  source: string
  targetUserId?: string
  action: string
  reason: string
  metadata?: Record<string, unknown>
}

export interface RiskRule {
  id: string
  name: string
  description: string
  enabled: boolean
  config?: Record<string, unknown>
}
