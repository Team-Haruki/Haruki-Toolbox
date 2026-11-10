import { asRecord } from "@/lib/record-utils"
import { UnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"

/**
 * The part of `GET /api/admin/statistics/upload-analytics` the dashboard
 * shows. JSON names follow `uploadAnalyticsResponse`, `uploadAnalyticsMetrics`
 * and `uploadMigrationMetrics` in the backend's adminstats module.
 */
export interface UploadAnalyticsMetrics {
  attemptCount: number
  successCount: number
  failureCount: number
  /** 0..1; null when the window saw no attempt. */
  successRate: number | null
  /** Distinct verified game accounts with a successful upload. */
  activeGameAccounts: number
  /** Processing time percentiles; null when no attempt recorded a duration. */
  latencyP50Ms: number | null
  latencyP95Ms: number | null
}

export interface UploadAnalyticsMethodRow extends UploadAnalyticsMetrics {
  /** `upload_method` of the group; empty when the log row has none. */
  method: string
}

export interface UploadAnalytics {
  summary: UploadAnalyticsMetrics
  /** One row per upload method, most attempts first. */
  methods: UploadAnalyticsMethodRow[]
  /** Failed attempts per failure stage, most frequent first. */
  failureStages: Array<{ key: string; count: number }>
  /** HarukiProxy protocol split of successful uploads. */
  migration: {
    v2Success: number
    v3Success: number
    /** v3 / (v2 + v3), 0..1; null when neither occurred. */
    v3Share: number | null
    /** Verified accounts that only uploaded over protocol 2. */
    v2OnlyAccounts: number
  }
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readMetrics(record: Record<string, unknown>): UploadAnalyticsMetrics {
  return {
    attemptCount: count(record.attemptCount),
    successCount: count(record.successCount),
    failureCount: count(record.failureCount),
    successRate: optionalNumber(record.successRate),
    activeGameAccounts: count(record.activeGameAccounts),
    latencyP50Ms: optionalNumber(record.latencyP50Ms),
    latencyP95Ms: optionalNumber(record.latencyP95Ms),
  }
}

/**
 * Narrows the analytics payload to what the dashboard renders, or throws
 * `UnexpectedPayloadError` when the response has no `summary` object (a 200
 * with another shape must land in the panel's error state, not in a render).
 */
export function parseUploadAnalytics(value: unknown): UploadAnalytics {
  const record = asRecord(value)
  const summary = asRecord(record?.summary)
  if (!record || !summary || typeof summary.attemptCount !== "number") {
    throw new UnexpectedPayloadError("/api/admin/statistics/upload-analytics")
  }

  const methods: UploadAnalyticsMethodRow[] = []
  for (const entry of Array.isArray(record.groups) ? record.groups : []) {
    const group = asRecord(entry)
    if (!group) continue
    const method = asRecord(group.dimensions)?.upload_method
    methods.push({ method: typeof method === "string" ? method.trim() : "", ...readMetrics(group) })
  }
  methods.sort((a, b) => b.attemptCount - a.attemptCount || a.method.localeCompare(b.method))

  const failureStages = Object.entries(asRecord(record.byFailureStage) ?? {})
    .map(([key, value]) => ({ key, count: count(value) }))
    .filter((stage) => stage.count > 0)
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

  const migration = asRecord(record.migration) ?? {}
  return {
    summary: readMetrics(summary),
    methods,
    failureStages,
    migration: {
      v2Success: count(migration.v2Success),
      v3Success: count(migration.v3Success),
      v3Share: optionalNumber(migration.v3Share),
      v2OnlyAccounts: count(migration.v2OnlyAccounts),
    },
  }
}
