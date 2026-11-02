import { translate } from "@/shared/i18n"

// Kratos' own webauthn.js (loaded through the flow's script nodes) reports
// security-key failures with window.alert(): either the English sentence
// "This browser does not support WebAuthn!" or the raw DOMException
// ("NotAllowedError: The operation either timed out or was not allowed...").
// While a Kratos flow page is mounted those alerts are shown in the user's
// language instead.

const KEY_PREFIX = "auth.kratos.webauthn."

const ERROR_NAME_KEYS: Record<string, string> = {
  NotAllowedError: "notAllowed",
  InvalidStateError: "invalidState",
  AbortError: "aborted",
  SecurityError: "security",
  NotSupportedError: "unsupported",
}

function readErrorName(value: unknown): string {
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name
  }
  const text = typeof value === "string" ? value : String(value ?? "")
  return /^(\w+Error)\b/.exec(text.trim())?.[1] ?? ""
}

/** The localized text for something Kratos' webauthn.js passed to alert(). */
export function localizeKratosWebAuthnAlert(value: unknown): string {
  const text = typeof value === "string" ? value : ""
  if (/does not support (Passkey|WebAuthn)/i.test(text)) {
    return translate(`${KEY_PREFIX}unsupported`)
  }
  const key = ERROR_NAME_KEYS[readErrorName(value)] ?? "failed"
  return translate(`${KEY_PREFIX}${key}`)
}

/**
 * Routes window.alert to `show` (localized) until the returned function is
 * called, which restores the previous alert. Nested installs restore in order.
 */
export function interceptKratosWebAuthnAlerts(show: (message: string) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const previous = window.alert
  const replacement = (value?: unknown) => {
    show(localizeKratosWebAuthnAlert(value))
  }
  window.alert = replacement
  return () => {
    if (window.alert === replacement) {
      window.alert = previous
    }
  }
}
