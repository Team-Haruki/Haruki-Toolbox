import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { translate } from "@/shared/i18n"

/**
 * The tracker API throws plain `Error`s with English developer text
 * ("Tracker request failed: HTTP 502", "Tracker WebSocket is unavailable",
 * "Tracker endpoint is empty"), optionally carrying the HTTP `status`.
 * `describeError` treats any non-axios `Error` as app code that already
 * translated its message, so those strings would become the headline.
 */
export function isTrackerError(error: unknown): error is Error & { status?: number } {
  if (!(error instanceof Error)) {
    return false
  }
  if ("status" in error && (typeof error.status === "number" || error.status === undefined)) {
    return true
  }
  return /^Tracker\b/.test(error.message)
}

/**
 * User-facing description of a rank-border load failure: transport errors
 * and known backend messages keep their translations, a tracker error gets
 * the localized `fallback` headline (normally `rankBorder.result.loadErrorHint`)
 * with its raw text kept as the small detail line, and `status` 5xx / 429
 * map to the shared transport texts.
 */
export function describeTrackerError(error: unknown, fallback: string): ErrorDescription {
  if (!isTrackerError(error)) {
    return describeError(error, fallback)
  }
  const detail = error.message.trim() || undefined
  const status = error.status
  if (status === 429) {
    return { message: translate("core.errors.rateLimited", { status }), detail }
  }
  if (status != null && status >= 500) {
    return { message: translate("core.errors.serverUnavailable", { status }), detail }
  }
  return { message: fallback, detail }
}
