import { translate } from "@/shared/i18n"

// Browser fetch failures are raw English ("Failed to fetch", "Load failed" on
// Safari, "NetworkError when attempting to fetch resource." on Firefox); the
// worker forwards them as the region's error text.
const NETWORK_MESSAGE_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|net::err_|err_connection|econnrefused|enotfound/i
const TIMEOUT_MESSAGE_RE = /timed? ?out|timeout/i

export type SekaiDataErrorKind = "network" | "timeout" | "other"

export function classifySekaiDataError(raw: string | null | undefined): SekaiDataErrorKind | null {
  const message = raw?.trim() ?? ""
  if (!message) return null
  if (NETWORK_MESSAGE_RE.test(message)) return "network"
  if (TIMEOUT_MESSAGE_RE.test(message)) return "timeout"
  return "other"
}

/**
 * The game-database update error in the user's language: network failures
 * become a localized line with the next step (check the connection or
 * switch the asset route); any other text is already specific and is kept.
 */
export function describeSekaiDataError(raw: string | null | undefined): string | null {
  switch (classifySekaiDataError(raw)) {
    case "network":
      return translate("userSettings.sekaiData.errors.network")
    case "timeout":
      return translate("userSettings.sekaiData.errors.timeout")
    case "other":
      return raw?.trim() ?? null
    default:
      return null
  }
}
