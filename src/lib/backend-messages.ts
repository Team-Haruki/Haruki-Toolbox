// Known backend error strings (the `message` of a failed API response) mapped
// to core-bundle i18n keys that tell the user what happened and what to do
// next. Exact entries are compared trimmed and case-insensitively; pattern
// entries capture a parameter from the raw text. Unknown messages fall back to
// the caller's wording with the raw text attached as a detail line (see
// `describeError` in `@/lib/error-utils`).

export interface ResolvedBackendMessage {
  key: string
  params?: Record<string, unknown>
}

interface BackendMessagePattern {
  pattern: RegExp
  resolve: (match: RegExpExecArray) => ResolvedBackendMessage
}

const KEY_PREFIX = "backendMessages."

const EXACT_MESSAGES: Record<string, string> = {
  "user not authenticated": "notAuthenticated",
  "upload not allowed": "uploadNotAllowed",
  "write grant expired or revoked for this account": "writeGrantExpired",
  // The read path's 403: the binding is someone else's and no (unexpired) grant covers it.
  "not authorized to access this binding": "bindingAccessDenied",
  "invalid server": "invalidServer",
  "failed to process upload": "uploadProcessFailed",
  "retrieve mysekai data failed, it seems you may not have completed the tutorial yet.": "mysekaiRetrieveFailed",
  "retrieve suite data failed: unknown error": "suiteRetrieveFailed",
  "failed to retrieve game data": "gameDataRetrieveFailed",
  "verification code missing in game profile": "verificationCodeMissing",
  "verification code does not match game profile": "verificationCodeMismatch",
  "verification code expired or not found": "verificationCodeExpired",
  "too many verification attempts, please generate a new code": "verificationTooManyAttempts",
  "game account not found": "gameAccountNotFound",
  "game server unavailable": "gameServerUnavailable",
  "this account is bound by another user": "accountBoundByAnotherUser",
  "this game account is already bound by another user": "accountBoundByAnotherUser",
  "this account is bound by a banned user": "accountBoundByBannedUser",
  "binding is not verified yet": "bindingNotVerified",
  "forbidden: binding is locked by administrator": "bindingLocked",
  "grantee user not found": "granteeNotFound",
  "cannot grant access to yourself": "grantToSelf",
  "expiresat must be a future time": "expiresAtNotFuture",
  "grantee user is banned": "granteeBanned",
  "qq binding already exists": "qqBindingExists",
  "email must be verified before binding social platform": "emailVerificationRequired",
  "invalid or expired verification code": "codeInvalidOrExpired",
  "too many verification attempts, please request a new code": "codeTooManyAttempts",
  "ticket is closed": "ticketClosed",
  "ticket not found": "ticketNotFound",
  "message must be 1-4000 characters": "messageLength",
  "captcha verify failed": "captchaFailed",
  "invalid verification code": "invalidVerificationCode",
  "reauthentication required": "reauthRequired",
  "consent challenge expired or invalid": "consentChallengeExpired",
  "loginchallenge is required": "loginChallengeRequired",
  "player data not found.": "playerDataNotFound",
  "player data not found": "playerDataNotFound",
  "one time password incorrect": "otpIncorrect",
}

const PATTERN_MESSAGES: BackendMessagePattern[] = [
  {
    pattern: /^ticket quota exceeded\b/i,
    resolve: () => ({ key: "ticketQuotaExceeded" }),
  },
  {
    pattern: /^inherit failed(?:\s*[:：]\s*(.+))?$/is,
    resolve: (match) => {
      const code = match[1]?.trim()
      return code ? { key: "inheritFailedWithCode", params: { code } } : { key: "inheritFailed" }
    },
  },
  {
    pattern: /^failed to parse suite data\b/i,
    resolve: () => ({ key: "suiteParseFailed" }),
  },
]

/** The i18n key (and params) for a known backend message, or null when the text is not recognised. */
export function resolveBackendMessage(message: string | null | undefined): ResolvedBackendMessage | null {
  const raw = message?.trim() ?? ""
  if (!raw) return null

  const exact = EXACT_MESSAGES[raw.toLowerCase()]
  if (exact) {
    return { key: KEY_PREFIX + exact }
  }

  for (const entry of PATTERN_MESSAGES) {
    const match = entry.pattern.exec(raw)
    if (match) {
      const resolved = entry.resolve(match)
      return { key: KEY_PREFIX + resolved.key, params: resolved.params }
    }
  }

  return null
}

/** Every i18n key the dictionary can produce (without params), for locale completeness checks. */
export const BACKEND_MESSAGE_KEYS: readonly string[] = [
  ...new Set(Object.values(EXACT_MESSAGES)),
  "ticketQuotaExceeded",
  "inheritFailed",
  "inheritFailedWithCode",
  "suiteParseFailed",
].map((key) => KEY_PREFIX + key)
