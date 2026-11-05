/**
 * X-axis ticks for the event-point trend chart, whose x values are series
 * indices (one per event). Letting the axis pick evenly spaced indices gave
 * "26/10 · 26/10" (two events in the same month) and dropped the year: the
 * ticks instead sit on the first event of each month, thinned to `maxTicks`,
 * so every label is a distinct "2026/10".
 */

/** Calendar month key in local time; null for an unknown start. */
export function trendMonthKey(startAt: number | null | undefined): string | null {
  if (startAt == null || !Number.isFinite(startAt)) {
    return null
  }
  const date = new Date(startAt)
  return `${date.getFullYear()}-${date.getMonth()}`
}

/**
 * Indices of the first point of each month, keeping at most `maxTicks` of
 * them (evenly thinned, always including the first). An empty or unknown
 * series yields no ticks.
 */
export function selectTrendMonthTicks(startAts: readonly (number | null | undefined)[], maxTicks: number): number[] {
  const firsts: number[] = []
  let lastKey: string | null = null
  startAts.forEach((startAt, index) => {
    const key = trendMonthKey(startAt)
    if (key != null && key !== lastKey) {
      firsts.push(index)
      lastKey = key
    }
  })
  const limit = Math.max(1, Math.floor(maxTicks))
  if (firsts.length <= limit) {
    return firsts
  }
  const step = firsts.length / limit
  const picked: number[] = []
  for (let slot = 0; slot < limit; slot += 1) {
    const candidate = firsts[Math.floor(slot * step)]
    if (candidate != null && picked[picked.length - 1] !== candidate) {
      picked.push(candidate)
    }
  }
  return picked
}
