/**
 * Geometry and easing behind the admin console's small data visuals (the
 * count-up numbers, sparklines and share bars). Kept out of the components
 * so it can be unit tested.
 */

/** Fast start, soft landing: a number that counts up settles instead of stopping dead. */
export function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  return 1 - (1 - clamped) ** 3
}

/** The value shown `progress` (0–1) of the way from `from` to `to`. */
export function tweenValue(from: number, to: number, progress: number): number {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return to
  }
  return from + (to - from) * easeOutCubic(progress)
}

export type SparklineGeometry = {
  /** `M x y L x y …` through every point. Empty when there is nothing to draw. */
  line: string
  /** The same line closed down to the baseline, for a soft fill under it. */
  area: string
  /** The last point, for the end dot. */
  last: { x: number; y: number } | null
}

/**
 * Points of a sparkline inside a `width` × `height` box with `padding` on
 * every side. The y scale starts at zero unless the series goes negative, so
 * a flat non-zero series reads as a level line, not as noise. Non-finite
 * values count as zero; a single value draws a level line across the box.
 */
export function buildSparkline(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): SparklineGeometry {
  const clean = values.map((value) => (Number.isFinite(value) ? value : 0))
  if (clean.length === 0 || width <= 0 || height <= 0) {
    return { line: "", area: "", last: null }
  }

  const series = clean.length === 1 ? [clean[0]!, clean[0]!] : clean
  const min = Math.min(0, ...series)
  const max = Math.max(...series)
  const span = max - min
  const innerWidth = Math.max(0, width - padding * 2)
  const innerHeight = Math.max(0, height - padding * 2)
  const step = innerWidth / (series.length - 1)
  const round = (value: number) => Math.round(value * 100) / 100

  const points = series.map((value, index) => ({
    x: round(padding + step * index),
    // An all-zero series sits on the baseline rather than in the middle.
    y: round(padding + (span === 0 ? innerHeight : innerHeight - ((value - min) / span) * innerHeight)),
  }))

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")
  const baseline = round(height - padding)
  const first = points[0]!
  const last = points[points.length - 1]!
  return {
    line,
    area: `${line} L${last.x} ${baseline} L${first.x} ${baseline} Z`,
    last,
  }
}

/** `part` of `total` as 0–100, clamped; 0 when the total is zero or invalid. */
export function sharePercent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (part / total) * 100))
}

export type TrendDirection = "up" | "down" | "flat"

/**
 * Change of `current` against `previous` as a signed percentage, or null
 * when there is no base to compare with (previous is zero or invalid).
 */
export function percentChange(current: number, previous: number): { percent: number; direction: TrendDirection } | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return null
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100
  return { percent, direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat" }
}
