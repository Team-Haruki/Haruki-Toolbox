/**
 * Keeps keyboard focus in place when the user removes the row that holds it,
 * so keyboard and screen-reader users do not land back on <body> (WCAG 2.4.3).
 *
 * Call it before the removal and run the returned function once the removal
 * has been requested. Focus then moves to the first button of the nearest row
 * still on the page (following rows first), or to `fallback`. Returns null
 * when focus is not in the row, so nothing moves for a pointer press that
 * never focused it, nor for removals nobody asked for (expiry).
 */
export function captureFocusHandOff(
  row: Element | null | undefined,
  fallback: () => HTMLElement | null | undefined,
  hasFocus = !!row && row.contains(document.activeElement),
): (() => void) | null {
  if (!row || !hasFocus) {
    return null
  }
  const rows: Element[] = []
  for (let next = row.nextElementSibling; next; next = next.nextElementSibling) {
    rows.push(next)
  }
  for (let previous = row.previousElementSibling; previous; previous = previous.previousElementSibling) {
    rows.push(previous)
  }

  function nearestButton(): HTMLElement | null {
    for (const candidate of rows) {
      const button = candidate.isConnected ? candidate.querySelector<HTMLElement>("button") : null
      if (button) {
        return button
      }
    }
    return null
  }

  return () => {
    // A macrotask: after the re-render, and after a closing menu has tried to
    // give focus back to its (now removed) trigger
    setTimeout(() => {
      const active = document.activeElement
      if (active && active !== document.body) {
        return
      }
      const nearest = nearestButton()
      const target = nearest ?? fallback()
      // The fallback is a container that may start far above: do not scroll to it
      target?.focus({ preventScroll: !nearest })
    }, 0)
  }
}
