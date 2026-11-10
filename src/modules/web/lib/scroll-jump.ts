/**
 * Which of the "back to top" / "jump to bottom" buttons the page shows.
 * Kept out of the component so the thresholds can be unit tested.
 */

/** A page must be taller than the viewport by this much before either button appears. */
export const SCROLL_JUMP_MIN_EXTRA_HEIGHT = 600
/** Distance from an edge within which the button for that edge is hidden. */
export const SCROLL_JUMP_EDGE_DISTANCE = 240

export type ScrollJumpState = {
  showTop: boolean
  showBottom: boolean
}

/**
 * `scrollY` is how far the page is scrolled, `viewportHeight` the visible
 * height, `documentHeight` the full scroll height. Short pages show nothing;
 * otherwise each button shows while its edge is further than
 * {@link SCROLL_JUMP_EDGE_DISTANCE} away.
 */
export function resolveScrollJumpState(scrollY: number, viewportHeight: number, documentHeight: number): ScrollJumpState {
  if (![scrollY, viewportHeight, documentHeight].every(Number.isFinite) || viewportHeight <= 0) {
    return { showTop: false, showBottom: false }
  }

  const maxScroll = documentHeight - viewportHeight
  if (maxScroll < SCROLL_JUMP_MIN_EXTRA_HEIGHT) {
    return { showTop: false, showBottom: false }
  }

  const position = Math.min(Math.max(scrollY, 0), maxScroll)
  return {
    showTop: position > SCROLL_JUMP_EDGE_DISTANCE,
    showBottom: maxScroll - position > SCROLL_JUMP_EDGE_DISTANCE,
  }
}
