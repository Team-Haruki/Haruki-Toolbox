import type { BotSecurityAlert } from "@/types/admin"

/**
 * Figures behind the alert overview. Anything computed from `alerts` only
 * covers the rows the list is showing; the page labels it that way.
 */

export type BotSecurityKindTone = "danger" | "warning" | "info" | "neutral"

const KIND_TONES: Readonly<Record<string, BotSecurityKindTone>> = {
  // Someone presenting a credential or request that is not theirs to use.
  auth_failed: "danger",
  replay_detected: "danger",
  session_revoked: "danger",
  // A client held back by a limit or a build check.
  rate_limited: "warning",
  build_rejected: "warning",
  // Something about a known client changed.
  login_source_changed: "info",
  client_changed: "info",
}

/** The tint of a kind's chip. Kinds this build does not know stay neutral. */
export function botSecurityKindTone(kind: string): BotSecurityKindTone {
  const value = kind.trim()
  return Object.hasOwn(KIND_TONES, value) ? KIND_TONES[value]! : "neutral"
}

export type BotSecurityRowStats = {
  total: number
  /** Rows Cloud blocked / only logged. */
  enforced: number
  logOnly: number
  /** Counting windows of the rows, most frequent first, then the shorter window. */
  byWindow: Array<{ seconds: number; count: number }>
}

export function summarizeBotSecurityRows(alerts: readonly BotSecurityAlert[]): BotSecurityRowStats {
  const windows = new Map<number, number>()
  let enforced = 0
  for (const alert of alerts) {
    if (alert.enforced) enforced += 1
    if (Number.isFinite(alert.windowSeconds) && alert.windowSeconds > 0) {
      windows.set(alert.windowSeconds, (windows.get(alert.windowSeconds) ?? 0) + 1)
    }
  }
  return {
    total: alerts.length,
    enforced,
    logOnly: alerts.length - enforced,
    byWindow: [...windows]
      .map(([seconds, count]) => ({ seconds, count }))
      .sort((a, b) => b.count - a.count || a.seconds - b.seconds),
  }
}

export type BotSecurityTimeline = {
  /** Rows per equal slice of the span, oldest first. */
  counts: number[]
  /** Alert time of the oldest and newest row, as epoch milliseconds. */
  from: number
  to: number
}

/**
 * When the rows fired, as counts over equal slices between the oldest and the
 * newest alert time. null when there is no span to draw: fewer than two rows
 * with a readable time, or all of them at the same instant.
 */
export function buildBotSecurityTimeline(
  alerts: readonly Pick<BotSecurityAlert, "alertTime">[],
  buckets = 12,
): BotSecurityTimeline | null {
  const times = alerts
    .map((alert) => Date.parse(alert.alertTime))
    .filter((time) => Number.isFinite(time))
  if (times.length < 2 || buckets < 2) return null

  const from = Math.min(...times)
  const to = Math.max(...times)
  const span = to - from
  if (span <= 0) return null

  const counts = Array.from({ length: buckets }, () => 0)
  for (const time of times) {
    const index = Math.min(buckets - 1, Math.floor(((time - from) / span) * buckets))
    counts[index] = (counts[index] ?? 0) + 1
  }
  return { counts, from, to }
}

/** Resolved plus ignored, or null while either count is unknown. */
export function handledAlertTotal(resolved: number | null, ignored: number | null): number | null {
  return resolved == null || ignored == null ? null : resolved + ignored
}

/** Alerts per day over the 7-day figure, to one decimal. */
export function dailyAlertAverage(last7d: number): number {
  if (!Number.isFinite(last7d) || last7d <= 0) return 0
  return Math.round((last7d / 7) * 10) / 10
}
