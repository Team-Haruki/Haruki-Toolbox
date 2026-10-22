/**
 * Scrolls the first invalid field into view and focuses it, so an inline
 * validation message is seen even when the form is long. Field ids are the
 * `id` attributes of the inputs (or of a section wrapper for group fields).
 */
export function focusInvalidField(id: string | null | undefined): void {
  if (!id || typeof document === "undefined") return
  const element = document.getElementById(id)
  if (!element) return
  element.scrollIntoView({ block: "center", behavior: "smooth" })
  if (typeof element.focus === "function") {
    element.focus({ preventScroll: true })
  }
}
