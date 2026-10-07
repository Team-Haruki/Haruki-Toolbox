import type { DeviceApiError } from "@/modules/user-settings/api/oauth2.device"

/**
 * What the /device page shows.
 * - `framed`: inside a frame; only "open in a new window", no requests.
 * - `signedOut`: the login card (no session, or the gateway answered 401).
 * - `unavailable`: the feature is off, or the backend has no such route yet.
 * - `entry`: the code input.
 * - `review`: the review card of a claimed code.
 * - the rest are result cards that end the flow on this page.
 */
export type DevicePageState =
  | "framed"
  | "signedOut"
  | "unavailable"
  | "entry"
  | "review"
  | "approved"
  | "unconfirmed"
  | "denied"
  | "expired"
  | "failed"
  | "error"

/** The result cards; each offers "enter a new code". */
export const DEVICE_RESULT_STATES: readonly DevicePageState[] = [
  "approved",
  "unconfirmed",
  "denied",
  "expired",
  "failed",
  "error",
]

/** Error codes the page has its own text for (`oauth.device.error.<code>`). */
export const DEVICE_ERROR_CODES = [
  "feature_disabled",
  "unsupported_media_type",
  "origin_rejected",
  "invalid_request",
  "malformed_code",
  "invalid_code",
  "rate_limited",
  "code_expired",
  "already_handled",
  "flow_conflict",
  "session_changed",
  "ack_required",
  "client_unavailable",
  "approval_failed",
  "temporarily_unavailable",
  "unknown",
] as const

export type DeviceErrorMessageCode = (typeof DEVICE_ERROR_CODES)[number]

/**
 * Where an error takes the page (§6.5, last column). `stay` keeps the current
 * card and shows the message inline; `entry` shows it under the code input
 * and keeps what was typed.
 */
export interface DeviceErrorOutcome {
  target: DevicePageState | "stay"
  message: DeviceErrorMessageCode
  /** Seconds to keep the action buttons disabled (`rate_limited`). */
  retryAfter?: number
  /** Draw attention to the confirmation checkbox (`ack_required`). */
  highlightAck?: boolean
}

/** Fallback wait when a 429 carries no `retryAfter`. */
export const DEFAULT_RETRY_AFTER_SECONDS = 30

function isKnownCode(code: string): code is DeviceErrorMessageCode {
  return (DEVICE_ERROR_CODES as readonly string[]).includes(code)
}

export interface DeviceErrorContext {
  /** An approve call failed without a response earlier in this flow. */
  approveOutcomeUnknown: boolean
}

/** Maps a failed lookup / approve / deny call to the page's next state. */
export function mapDeviceErrorCode(error: DeviceApiError, context: DeviceErrorContext): DeviceErrorOutcome {
  const { status, code } = error
  if (status === null) {
    // Network error or timeout: never retried, the person decides.
    return { target: "stay", message: "unknown" }
  }
  if (!code) {
    if (status === 401) {
      return { target: "signedOut", message: "unknown" }
    }
    if (status === 404) {
      return { target: "unavailable", message: "feature_disabled" }
    }
    if (status === 429) {
      return { target: "stay", message: "rate_limited", retryAfter: error.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS }
    }
    return { target: "stay", message: "unknown" }
  }

  switch (code) {
    case "feature_disabled":
      return { target: "unavailable", message: code }
    case "unsupported_media_type":
    case "origin_rejected":
    case "client_unavailable":
      return { target: "error", message: code }
    case "malformed_code":
    case "invalid_code":
    case "flow_conflict":
    case "session_changed":
      return { target: "entry", message: code }
    case "rate_limited":
      return { target: "stay", message: code, retryAfter: error.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS }
    case "code_expired":
      return { target: "expired", message: code }
    case "already_handled":
      return context.approveOutcomeUnknown
        ? { target: "unconfirmed", message: code }
        : { target: "error", message: code }
    case "ack_required":
      return { target: "review", message: code, highlightAck: true }
    case "approval_failed":
      return error.retryable === true
        ? { target: "review", message: code }
        : { target: "failed", message: code }
    case "invalid_request":
    case "temporarily_unavailable":
      return { target: "stay", message: code }
    default:
      return { target: "stay", message: isKnownCode(code) ? code : "unknown" }
  }
}
