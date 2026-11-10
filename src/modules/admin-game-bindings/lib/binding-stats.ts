import { PERMISSION_BOT_NAME_KEYS } from "@/lib/game-binding-permission-meta"
import { asRecord, readString } from "@/lib/record-utils"

/**
 * Figures of the bindings page. The site-wide ones come from the dashboard
 * statistics (`bindings` of GET /api/admin/statistics/dashboard); the sharing
 * ones are computed from the rows the list is showing and labelled that way.
 */

export type GameBindingStats = {
  total: number
  verified: number
  /** Bindings per server, largest first. */
  byServer: Array<{ server: string; count: number }>
}

function readCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

/** The `bindings` member of the dashboard statistics; null when it is missing or malformed. */
export function normalizeGameBindingStats(dashboard: unknown): GameBindingStats | null {
  const bindings = asRecord(asRecord(dashboard)?.bindings)
  if (!bindings) return null

  const total = readCount(bindings.total)
  const verified = readCount(bindings.verified)
  if (total == null || verified == null) return null

  const byServer: GameBindingStats["byServer"] = []
  for (const entry of Array.isArray(bindings.byServer) ? bindings.byServer : []) {
    const record = asRecord(entry)
    // The backend names the member `key`; older payloads called it `server`.
    const server = record ? readString(record, ["key", "server"]).trim().toLowerCase() : ""
    const count = readCount(record?.count)
    if (server && count != null) byServer.push({ server, count })
  }
  byServer.sort((a, b) => b.count - a.count || (a.server < b.server ? -1 : a.server > b.server ? 1 : 0))

  return { total, verified, byServer }
}

/** Bindings that are not verified. Never negative, even if the two counts were read apart. */
export function unverifiedBindingCount(stats: Pick<GameBindingStats, "total" | "verified">): number {
  return Math.max(0, stats.total - stats.verified)
}

/** A suite / mysekai settings object; interfaces carry no index signature, hence `object`. */
type SharingSettings = object | null | undefined

function isOn(settings: SharingSettings, key: string): boolean {
  return !!settings && (settings as Record<string, unknown>)[key] === true
}

export type SharingCount = { on: number; total: number }

/** How many of an upload's sharing switches are on; null when the binding carries no settings for it. */
export function countSharing(settings: SharingSettings): SharingCount | null {
  if (settings == null) return null
  const values = Object.values(settings)
  return { on: values.filter((value) => value === true).length, total: values.length }
}

function hasBotSync(settings: SharingSettings): boolean {
  if (!settings) return false
  return Object.keys(settings).some((key) => PERMISSION_BOT_NAME_KEYS[key] !== undefined && isOn(settings, key))
}

type SharingBinding = { suite?: SharingSettings; mysekai?: SharingSettings }

/** Whether a binding exposes an upload to anyone who knows the UID. */
export function hasPublicApiSharing(binding: SharingBinding): boolean {
  return isOn(binding.suite, "allowPublicApi") || isOn(binding.mysekai, "allowPublicApi")
}

export const PAGE_SHARING_KEYS = ["suitePublicApi", "suiteBots", "mysekaiPublicApi", "mysekaiFixtureApi", "mysekaiBots"] as const
export type PageSharingKey = (typeof PAGE_SHARING_KEYS)[number]

/** For each kind of sharing, how many of the given bindings have it on. */
export function summarizePageSharing(bindings: readonly SharingBinding[]): Record<PageSharingKey, number> {
  const summary: Record<PageSharingKey, number> = {
    suitePublicApi: 0,
    suiteBots: 0,
    mysekaiPublicApi: 0,
    mysekaiFixtureApi: 0,
    mysekaiBots: 0,
  }
  for (const binding of bindings) {
    if (isOn(binding.suite, "allowPublicApi")) summary.suitePublicApi += 1
    if (hasBotSync(binding.suite)) summary.suiteBots += 1
    if (isOn(binding.mysekai, "allowPublicApi")) summary.mysekaiPublicApi += 1
    if (isOn(binding.mysekai, "allowFixtureApi")) summary.mysekaiFixtureApi += 1
    if (hasBotSync(binding.mysekai)) summary.mysekaiBots += 1
  }
  return summary
}
