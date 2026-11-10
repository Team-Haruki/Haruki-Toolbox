import { sharePercent } from "@/modules/admin/lib/stat-visuals"

/**
 * Time windows, severities and the small figures of the risk events page.
 * The backend lists the last 24 hours unless `from` is sent, and accepts a
 * window of at most 366 days.
 */
export const RISK_EVENT_RANGES = ["24h", "7d", "30d", "90d", "365d"] as const
export type RiskEventRange = (typeof RISK_EVENT_RANGES)[number]
export const RISK_EVENT_DEFAULT_RANGE: RiskEventRange = "30d"

const RANGE_HOURS: Record<RiskEventRange, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "30d": 30 * 24,
  "90d": 90 * 24,
  "365d": 365 * 24,
}

export const RISK_EVENT_RANGE_LABEL_KEYS: Record<RiskEventRange, string> = {
  "24h": "adminRisk.range.last24h",
  "7d": "adminRisk.range.last7d",
  "30d": "adminRisk.range.last30d",
  "90d": "adminRisk.range.last90d",
  "365d": "adminRisk.range.last365d",
}

/** Start of the window that ends at `now`. */
export function riskEventRangeStart(range: RiskEventRange, now: Date): Date {
  return new Date(now.getTime() - RANGE_HOURS[range] * 3_600_000)
}

/** Most severe first: the order of the breakdown and of the filter. */
export const RISK_SEVERITIES = ["critical", "high", "medium", "low"] as const
export type RiskSeverity = (typeof RISK_SEVERITIES)[number]
export const RISK_EVENT_STATUSES = ["open", "resolved"] as const

export function isRiskSeverity(value: unknown): value is RiskSeverity {
  return typeof value === "string" && (RISK_SEVERITIES as readonly string[]).includes(value)
}

export type RiskSeverityTone = "danger" | "warning" | "info" | "neutral"

const SEVERITY_TONES: Record<RiskSeverity, RiskSeverityTone> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
}

/** The tint of a severity chip; an unknown severity stays neutral. */
export function riskSeverityTone(severity: string): RiskSeverityTone {
  return isRiskSeverity(severity) ? SEVERITY_TONES[severity] : "neutral"
}

export type RiskSourceCount = { source: string; count: number }

/** Events per source, most frequent first, then by name. "" stands for an event without a source. */
export function countRiskEventSources(events: readonly { source: string }[]): RiskSourceCount[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    const source = event.source.trim()
    counts.set(source, (counts.get(source) ?? 0) + 1)
  }
  return [...counts]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || (a.source < b.source ? -1 : a.source > b.source ? 1 : 0))
}

/** Resolved share of all events as 0–100, or null when there are none (or a count is unknown). */
export function riskResolutionRate(open: number | null, resolved: number | null): number | null {
  if (open == null || resolved == null || open + resolved <= 0) return null
  return sharePercent(resolved, open + resolved)
}

/** a + b, or null while either is unknown. */
export function sumKnown(a: number | null, b: number | null): number | null {
  return a == null || b == null ? null : a + b
}
