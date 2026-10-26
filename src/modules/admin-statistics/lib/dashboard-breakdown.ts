export interface BreakdownItem {
  key: string
  label: string
  count: number
  /** Share of the breakdown's total, 0..1 (0 when the total is 0). */
  share: number
}

/**
 * Turns a "count per key" payload (bindings per server, uploads per method…)
 * into rows for a small bar list: sorted by count, blanks and zero rows
 * dropped, each with its share of the total so the bars can be drawn without
 * recomputing the sum in the template.
 */
export function toBreakdownItems<T>(
  entries: readonly T[] | null | undefined,
  read: (entry: T) => { key: string | null | undefined; count: number | null | undefined },
  labelOf: (key: string) => string,
): BreakdownItem[] {
  const rows: Array<{ key: string; count: number }> = []
  for (const entry of entries ?? []) {
    const { key, count } = read(entry)
    const normalizedKey = (key ?? "").trim()
    if (!normalizedKey || typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue
    rows.push({ key: normalizedKey, count })
  }
  rows.sort((a, b) => b.count - a.count)
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return rows.map((row) => ({
    key: row.key,
    label: labelOf(row.key),
    count: row.count,
    share: total > 0 ? row.count / total : 0,
  }))
}
