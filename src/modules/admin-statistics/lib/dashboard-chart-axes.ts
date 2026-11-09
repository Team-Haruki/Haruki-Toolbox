/**
 * Paired y axes for the upload trend chart.
 *
 * Unovis draws every series on one y scale, so the failure series (tens) would
 * flatten against the upload series (thousands). Both axes get a "nice" maximum
 * that splits into the same number of integer ticks; failures are stretched onto
 * the upload scale for drawing and the right axis labels map the ticks back.
 */

export const AXIS_SEGMENTS = 4

/** Smallest value from {4, 8, 20} × 10^k that is >= max; every quarter of it is an integer. */
export function niceAxisMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return AXIS_SEGMENTS
  const magnitude = 10 ** Math.floor(Math.log10(max))
  for (const factor of [0.4, 0.8, 2, 4, 8, 20]) {
    const candidate = factor * magnitude
    if (candidate >= max && Number.isInteger(candidate / AXIS_SEGMENTS)) return candidate
  }
  return 20 * magnitude
}

export interface PairedAxes {
  /** Domain maximum of the drawn (left) scale. */
  leftMax: number
  /** Maximum the right-hand labels count up to. */
  rightMax: number
  /** Tick positions on the drawn scale, shared by both axes. */
  tickValues: number[]
  /** Projects a right-axis value onto the drawn scale. */
  toLeft: (value: number) => number
  /** Reads a drawn-scale tick back as a right-axis value. */
  toRight: (value: number) => number
}

export function buildPairedAxes(leftValues: readonly number[], rightValues: readonly number[]): PairedAxes {
  const leftMax = niceAxisMax(Math.max(0, ...leftValues))
  const rightMax = niceAxisMax(Math.max(0, ...rightValues))
  const ratio = leftMax / rightMax
  const step = leftMax / AXIS_SEGMENTS
  return {
    leftMax,
    rightMax,
    tickValues: Array.from({ length: AXIS_SEGMENTS + 1 }, (_, i) => i * step),
    toLeft: (value) => value * ratio,
    toRight: (value) => Math.round(value / ratio),
  }
}
