/**
 * Pure arithmetic behind the admin dashboard: rates, period totals, peaks,
 * failure extremes, period-over-period comparison and the method × data type
 * matrix. Everything here works on numbers the two statistics responses
 * already carry; nothing is estimated.
 */

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/** `part / total`, or null when there is no usable total (so the UI shows "—", not 0%). */
export function ratio(part: number | null | undefined, total: number | null | undefined): number | null {
  if (!isCount(part) || !isCount(total) || total <= 0) {
    return null
  }
  return part / total
}

export interface SeriesSummary {
  total: number
  /** Mean per bucket; null for an empty series. */
  average: number | null
  /** The largest bucket (first one on a tie); null when every bucket is zero. */
  peak: { index: number; value: number } | null
}

/** Sum, mean and peak of one series of bucket counts. Non-finite values count as zero. */
export function summarizeSeries(values: readonly number[]): SeriesSummary {
  let total = 0
  let peak: SeriesSummary["peak"] = null
  values.forEach((raw, index) => {
    const value = isCount(raw) ? raw : 0
    total += value
    if (value > 0 && (peak === null || value > peak.value)) {
      peak = { index, value }
    }
  })
  return { total, average: values.length > 0 ? total / values.length : null, peak }
}

export interface FailureBucket {
  uploads: number
  uploadFailures: number
}

export interface FailureExtreme {
  index: number
  /** Failures / uploads of that bucket, 0..1. */
  rate: number
  failures: number
  uploads: number
}

/**
 * The buckets with the highest and the lowest failure rate. Buckets without
 * uploads have no rate and are skipped; ties keep the earlier bucket for the
 * worst and the later one for the best (the freshest clean bucket).
 */
export function findFailureExtremes(points: readonly FailureBucket[]): { worst: FailureExtreme | null; best: FailureExtreme | null } {
  let worst: FailureExtreme | null = null
  let best: FailureExtreme | null = null
  points.forEach((point, index) => {
    const rate = ratio(point.uploadFailures, point.uploads)
    if (rate === null) {
      return
    }
    const entry = { index, rate, failures: point.uploadFailures, uploads: point.uploads }
    if (worst === null || rate > worst.rate) {
      worst = entry
    }
    if (best === null || rate <= best.rate) {
      best = entry
    }
  })
  return { worst, best }
}

export interface PeriodComparison {
  /** Sum of the latest `size` complete buckets. */
  current: number
  /** Sum of the `size` complete buckets before them. */
  previous: number
  /** Buckets on each side. */
  size: number
}

/**
 * Compares the later half of a bucketed range with the earlier half.
 *
 * The first and the last bucket of a timeseries are cut by the request's
 * `from` / `to`, so they are left out; the remaining complete buckets are
 * split into two equal runs (the oldest one is dropped when their number is
 * odd). Null when fewer than two complete buckets remain.
 */
export function compareHalves(values: readonly number[]): PeriodComparison | null {
  const complete = values.slice(1, -1).map((value) => (isCount(value) ? value : 0))
  const size = Math.floor(complete.length / 2)
  if (size < 1) {
    return null
  }
  const sum = (items: readonly number[]) => items.reduce((total, value) => total + value, 0)
  return {
    current: sum(complete.slice(complete.length - size)),
    previous: sum(complete.slice(complete.length - size * 2, complete.length - size)),
    size,
  }
}

export interface CountMatrixAxis {
  key: string
  total: number
}

export interface CountMatrix {
  /** Row keys, largest row total first. */
  rows: CountMatrixAxis[]
  /** Column keys, largest column total first. */
  columns: CountMatrixAxis[]
  /** `cells[rowIndex][columnIndex]`, 0 where the pair never occurred. */
  cells: number[][]
  total: number
  /** The largest single cell, for scaling the tint. */
  max: number
}

/**
 * Pivots "count per (row, column) pair" entries into a matrix. Blank keys and
 * non-positive counts are dropped; repeated pairs add up.
 */
export function buildCountMatrix(
  entries: ReadonlyArray<{ row: string | null | undefined; column: string | null | undefined; count: number | null | undefined }>,
): CountMatrix {
  const rowTotals = new Map<string, number>()
  const columnTotals = new Map<string, number>()
  const pairs = new Map<string, Map<string, number>>()
  let total = 0

  for (const entry of entries) {
    const row = (entry.row ?? "").trim()
    const column = (entry.column ?? "").trim()
    if (!row || !column || !isCount(entry.count) || entry.count <= 0) {
      continue
    }
    rowTotals.set(row, (rowTotals.get(row) ?? 0) + entry.count)
    columnTotals.set(column, (columnTotals.get(column) ?? 0) + entry.count)
    const cells = pairs.get(row) ?? new Map<string, number>()
    cells.set(column, (cells.get(column) ?? 0) + entry.count)
    pairs.set(row, cells)
    total += entry.count
  }

  const toAxis = (totals: Map<string, number>) =>
    [...totals].map(([key, sum]) => ({ key, total: sum })).sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
  const rows = toAxis(rowTotals)
  const columns = toAxis(columnTotals)
  const cells = rows.map((row) => columns.map((column) => pairs.get(row.key)?.get(column.key) ?? 0))
  return { rows, columns, cells, total, max: Math.max(0, ...cells.flat()) }
}

/** A millisecond duration as "182 ms" or "1.24 s"; null stays null for the caller's fallback. */
export function formatDurationMs(value: number | null | undefined): string | null {
  if (!isCount(value) || value < 0) {
    return null
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`
  }
  return `${(value / 1000).toFixed(2)} s`
}

/** A signed change for a trend chip: "+12.4%", "−3.1%", "0%". */
export function formatSignedPercent(percent: number): string {
  const rounded = Math.round(Math.abs(percent) * 10) / 10
  if (rounded === 0) {
    return "0%"
  }
  return `${percent > 0 ? "+" : "−"}${rounded.toFixed(1)}%`
}
