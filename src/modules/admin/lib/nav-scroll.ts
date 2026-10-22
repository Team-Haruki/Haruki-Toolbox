/**
 * Geometry for a horizontally scrolling pill nav: where to scroll so an item
 * sits centred, and which edges still hide content (for the fade affordance).
 */

export type ScrollMetrics = {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
}

export type EdgeOverflow = {
  start: boolean
  end: boolean
}

/** The scrollLeft that centres an item of `itemWidth` at `itemOffset` in a viewport of `viewportWidth`. */
export function centeredScrollLeft(itemOffset: number, itemWidth: number, viewportWidth: number, scrollWidth: number): number {
  const target = itemOffset - (viewportWidth - itemWidth) / 2
  const max = Math.max(0, scrollWidth - viewportWidth)
  return Math.min(Math.max(0, Math.round(target)), max)
}

/** Whether content is hidden past the start / end edge; a 1px tolerance absorbs subpixel scroll positions. */
export function edgeOverflow(metrics: ScrollMetrics): EdgeOverflow {
  const overflow = metrics.scrollWidth - metrics.clientWidth
  if (overflow <= 1) return { start: false, end: false }
  return {
    start: metrics.scrollLeft > 1,
    end: metrics.scrollLeft < overflow - 1,
  }
}
