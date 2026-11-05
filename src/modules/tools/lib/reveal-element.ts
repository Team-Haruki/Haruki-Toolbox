/**
 * Brings a block that just appeared (or changed state) into view and moves
 * keyboard focus onto it, so a state change the page made on its own is seen
 * and announced: the element needs `tabindex="-1"` to take focus. `block`
 * defaults to the top, where a heading reads first; the sticky header is
 * cleared by the element's own `scroll-mt-*`.
 */
export function revealElement(target: string | HTMLElement | null | undefined, block: ScrollLogicalPosition = "start"): boolean {
  if (typeof document === "undefined") return false
  const element = typeof target === "string" ? document.getElementById(target) : target
  if (!element) return false
  const reduceMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  element.scrollIntoView({ block, behavior: reduceMotion ? "auto" : "smooth" })
  if (typeof element.focus === "function") element.focus({ preventScroll: true })
  return true
}
