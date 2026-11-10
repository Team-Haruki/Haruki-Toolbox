/**
 * The arithmetic behind the stat panels of the two admin log pages (system
 * logs and upload logs): rates, ranked breakdowns, the upload volume series
 * and the small value formats. Pure, so it can be unit tested; the labels and
 * the i18n live in the components.
 */

export type CategoryCount = { key: string; count: number }

/** `success` out of everything counted, as 0–100; null when nothing was counted. */
export function successRatePercent(success: number, failed: number): number | null {
  if (!Number.isFinite(success) || !Number.isFinite(failed)) {
    return null
  }
  const counted = Math.max(0, success) + Math.max(0, failed)
  if (counted <= 0) {
    return null
  }
  return (Math.max(0, success) / counted) * 100
}

export type RankedCounts = {
  /** The largest entries, biggest first (ties by key). */
  items: CategoryCount[]
  /** Everything counted, the folded entries included. */
  total: number
  /** Sum of the entries beyond `limit`. */
  otherCount: number
  /** How many entries were folded into `otherCount`. */
  otherKinds: number
}

/**
 * A breakdown ready for a meter list: entries with the same key merged,
 * non-positive counts dropped, sorted biggest first, and everything beyond
 * `limit` folded into one "other" figure so a long tail never floods a panel.
 */
export function rankCategoryCounts(
  entries: readonly CategoryCount[] | null | undefined,
  limit = Number.POSITIVE_INFINITY,
): RankedCounts {
  const merged = new Map<string, number>()
  for (const entry of entries ?? []) {
    if (!entry || !Number.isFinite(entry.count) || entry.count <= 0) {
      continue
    }
    const key = entry.key ?? ""
    merged.set(key, (merged.get(key) ?? 0) + entry.count)
  }

  const sorted = Array.from(merged, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  const total = sorted.reduce((sum, entry) => sum + entry.count, 0)
  const size = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : sorted.length
  const items = sorted.slice(0, size)
  const rest = sorted.slice(size)

  return {
    items,
    total,
    otherCount: rest.reduce((sum, entry) => sum + entry.count, 0),
    otherKinds: rest.length,
  }
}

/** How many rows share each key; rows whose key is null or undefined are left out. */
export function countRowsBy<T>(
  rows: readonly T[] | null | undefined,
  keyOf: (row: T) => string | null | undefined,
): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const row of rows ?? []) {
    const key = keyOf(row)
    if (key == null) {
      continue
    }
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts, ([key, count]) => ({ key, count }))
}

/**
 * `part` of `total` as a whole percentage for a meter's figure. A non-zero
 * share that rounds to 0 reads "<1%" (and one that rounds to 100 without
 * being all of it reads ">99%"), so a present category never claims nothing.
 */
export function formatShare(part: number, total: number): string {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part <= 0) {
    return "0%"
  }
  const percent = Math.min(100, (part / total) * 100)
  if (percent < 1) {
    return "<1%"
  }
  if (percent > 99 && part < total) {
    return ">99%"
  }
  return `${Math.round(percent)}%`
}

export type BreakdownMeterItem = { key: string; label: string; value: number; text: string }

/**
 * The lines of a breakdown panel: each ranked entry with its label and a
 * "count · share" figure, the share taken against everything counted (the
 * folded tail included).
 */
export function buildBreakdownMeterItems(
  ranked: RankedCounts,
  labelOf: (key: string) => string,
  formatCount: (value: number) => string = String,
): BreakdownMeterItem[] {
  return ranked.items.map((entry) => ({
    key: entry.key,
    label: labelOf(entry.key),
    value: entry.count,
    text: `${formatCount(entry.count)} · ${formatShare(entry.count, ranked.total)}`,
  }))
}

/** A processing time:"842 ms" under a second, "1.24 s" under a minute, "2 min 05 s" above. Null when unknown. */
export function formatDurationMs(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return null
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`
  }
  if (value < 60_000) {
    return `${(value / 1000).toFixed(value < 10_000 ? 2 : 1)} s`
  }
  const totalSeconds = Math.round(value / 1000)
  return `${Math.floor(totalSeconds / 60)} min ${String(totalSeconds % 60).padStart(2, "0")} s`
}

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const

/** A request size in binary units: "812 B", "1.4 KB", "12 MB". Null when unknown. */
export function formatByteSize(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return null
  }
  let amount = value
  let unit = 0
  while (amount >= 1024 && unit < BYTE_UNITS.length - 1) {
    amount /= 1024
    unit += 1
  }
  const digits = unit === 0 || amount >= 10 ? 0 : 1
  return `${amount.toFixed(digits)} ${BYTE_UNITS[unit]}`
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export type UploadVolumeInterval = "hour" | "day"

/** The backend's window when the query names no start: the 24 hours before its end. */
export const DEFAULT_LOG_WINDOW_MS = DAY_MS

/**
 * Bucket size for the upload volume series: hours while the queried range is
 * at most three days, days beyond that, so the series stays within a
 * sparkline's worth of points and under the backend's group limit.
 */
export function pickUploadVolumeInterval(
  from: Date | null | undefined,
  to: Date | null | undefined,
  nowMs: number = Date.now(),
): UploadVolumeInterval {
  const end = to?.getTime() ?? nowMs
  const start = from?.getTime() ?? end - DEFAULT_LOG_WINDOW_MS
  return end - start > 3 * DAY_MS ? "day" : "hour"
}

/** The slice of an upload-analytics group the log page reads. */
export type UploadVolumeGroup = {
  dimensions?: Record<string, string | null | undefined> | null
  attemptCount?: number | null
  successCount?: number | null
  failureCount?: number | null
}

export type UploadVolumePoint = {
  /** Bucket start, epoch milliseconds (UTC hour or UTC day). */
  time: number
  attempts: number
  failures: number
}

const MAX_VOLUME_POINTS = 800

function count(value: number | null | undefined): number {
  return value != null && Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Uploads per bucket across the whole queried range. The backend only returns
 * buckets that had uploads (one group per dimension value and bucket), so the
 * groups are summed per bucket and every empty bucket between `from` and `to`
 * (exclusive) is filled with zero. Empty when the range is unusable.
 */
export function buildUploadVolumeSeries(
  groups: readonly UploadVolumeGroup[] | null | undefined,
  from: string | null | undefined,
  to: string | null | undefined,
  interval: UploadVolumeInterval,
): UploadVolumePoint[] {
  const step = interval === "day" ? DAY_MS : HOUR_MS
  const fromMs = from ? Date.parse(from) : Number.NaN
  const toMs = to ? Date.parse(to) : Number.NaN
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return []
  }

  const first = Math.floor(fromMs / step) * step
  const last = Math.floor((toMs - 1) / step) * step
  const size = Math.round((last - first) / step) + 1
  if (size <= 0 || size > MAX_VOLUME_POINTS) {
    return []
  }

  const points: UploadVolumePoint[] = Array.from({ length: size }, (_, index) => ({
    time: first + index * step,
    attempts: 0,
    failures: 0,
  }))
  for (const group of groups ?? []) {
    const bucket = group.dimensions?.bucket
    const bucketMs = bucket ? Date.parse(bucket) : Number.NaN
    if (!Number.isFinite(bucketMs)) {
      continue
    }
    const point = points[Math.round((Math.floor(bucketMs / step) * step - first) / step)]
    if (!point) {
      continue
    }
    const attempts = count(group.attemptCount)
    point.attempts += attempts
    point.failures += group.failureCount != null
      ? count(group.failureCount)
      : Math.max(0, attempts - count(group.successCount))
  }
  return points
}

/** Upload attempts per value of one analytics dimension, summed over the buckets. A missing value counts under "". */
export function sumUploadAttemptsByDimension(
  groups: readonly UploadVolumeGroup[] | null | undefined,
  dimension: string,
): CategoryCount[] {
  return rankCategoryCounts(
    (groups ?? []).map((group) => ({
      key: group.dimensions?.[dimension] ?? "",
      count: count(group.attemptCount),
    })),
  ).items
}

/** The `byFailureStage` map of the analytics response as ranked entries. */
export function failureStageCounts(stages: Record<string, number> | null | undefined): CategoryCount[] {
  return rankCategoryCounts(
    Object.entries(stages ?? {}).map(([key, value]) => ({ key, count: value })),
  ).items
}
