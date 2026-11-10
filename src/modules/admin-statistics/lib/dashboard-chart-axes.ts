/**
 * Y axes for the dashboard charts.
 *
 * Every chart counts whole things (uploads, failures, registrations), so the
 * axis gets a "nice" maximum that splits into four integer steps: a default
 * d3 axis on a series that peaks at 3 would label 0.5, 1.5, 2.5.
 */

export const AXIS_SEGMENTS = 4

const NICE_FACTORS = [1, 1.2, 1.6, 2, 4, 6, 8] as const

/**
 * Smallest "nice" value >= max whose quarters are integers: 4, 8, 12, 16,
 * 20, 40, 60, 80, 100, 120, 160, 200, 400 … so the axis wastes little room
 * above the data and every tick is a whole number.
 */
export function niceAxisMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return AXIS_SEGMENTS
  const base = 10 ** Math.floor(Math.log10(max))
  for (const magnitude of [base, base * 10]) {
    for (const factor of NICE_FACTORS) {
      // Rounded: 1.2 × 10 is 12.000000000000002 in floating point.
      const candidate = Math.round(factor * magnitude * 1000) / 1000
      if (candidate >= max && Number.isInteger(candidate / AXIS_SEGMENTS)) return candidate
    }
  }
  return base * 40
}

export interface CountAxis {
  /** Domain maximum. */
  max: number
  /** Five integer tick positions from 0 to `max`. */
  ticks: number[]
}

/** The axis for one series of counts. */
export function buildCountAxis(values: readonly number[]): CountAxis {
  const max = niceAxisMax(Math.max(0, ...values.filter((value) => Number.isFinite(value))))
  const step = max / AXIS_SEGMENTS
  return { max, ticks: Array.from({ length: AXIS_SEGMENTS + 1 }, (_, index) => index * step) }
}
