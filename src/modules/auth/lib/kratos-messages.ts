import { translate, translateIfExists } from "@/shared/i18n"
import { extractErrorMessage } from "@/lib/error-utils"
import type { KratosFlowType, KratosUiMessage } from "@/modules/auth/lib/kratos"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"

// Kratos UI message ids (ory/kratos text/message_*.go) mapped to keys under
// `auth.kratos.messages` in the core bundle. Kratos renders every message in
// English; the id is stable across versions, so the page translates by id and
// keeps the English text only for ids nobody mapped yet.
const KRATOS_MESSAGE_KEYS: Record<number, string> = {
  // Login
  1010003: "reauthConfirm",
  1010004: "mfaRequired",
  // Settings
  1050001: "settingsSaved",
  // Recovery
  1060001: "recoverySucceeded",
  1060002: "recoveryLinkSent",
  1060003: "recoveryCodeSent",
  // Verification
  1080001: "verificationLinkSent",
  1080002: "verificationSucceeded",
  1080003: "verificationCodeSent",
  // Validation
  4000001: "invalidValue",
  4000002: "requiredField",
  4000003: "tooShort",
  4000004: "invalidFormat",
  4000005: "passwordPolicy",
  4000006: "invalidCredentials",
  4000007: "accountExists",
  4000008: "totpInvalid",
  4000009: "identifierMissing",
  4000010: "addressNotVerified",
  4000011: "noTotpDevice",
  4000012: "lookupSecretUsed",
  4000014: "noLookupSecret",
  4000016: "lookupSecretInvalid",
  4000017: "tooLong",
  4000028: "accountExists",
  4000031: "passwordBreached",
  4000032: "passwordTooSimilar",
  4000033: "passwordTooShort",
  4000034: "passwordTooLong",
  4000035: "accountNotActive",
  4000036: "captchaFailed",
  // Flow state
  4010001: "flowExpired",
  4010007: "loginAlreadyCompleted",
  4010008: "loginCodeInvalid",
  4040001: "flowExpired",
  4050001: "flowExpired",
  4060004: "recoveryTokenInvalid",
  4060005: "flowExpired",
  4060006: "recoveryCodeInvalid",
  4070001: "verificationTokenInvalid",
  4070005: "flowExpired",
  4070006: "verificationCodeInvalid",
  5000001: "systemError",
}

const KEY_PREFIX = "auth.kratos.messages."

export function resolveKratosMessageKey(id: number | undefined): string | null {
  if (typeof id !== "number") return null
  const name = KRATOS_MESSAGE_KEYS[id]
  return name ? KEY_PREFIX + name : null
}

function readContextParams(context: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!context) return {}
  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "string" || typeof value === "number") {
      params[key] = value
    }
  }
  return params
}

/** The user-language text for a Kratos UI message, or its English text when the id is unmapped. */
export function localizeKratosMessage(message: KratosUiMessage): string {
  const text = message.text?.trim() ?? ""
  const key = resolveKratosMessageKey(message.id)
  if (!key) return text
  return translateIfExists(key, readContextParams(message.context)) ?? text
}

/** Why a self-service flow could not be loaded: expired, gone, or the service is unreachable. */
export function describeKratosFlowLoadError(flowType: KratosFlowType): string {
  return translate("auth.common.loadFlowFailed", { flow: translate(`auth.common.flowNames.${flowType}`) })
}

/**
 * Error text for a Kratos call that is not a browser flow (sessions, logout,
 * error lookup). A `KratosRequestError` becomes a generic "service unavailable"
 * line; everything else goes through the shared error funnel.
 */
export function describeKratosError(error: unknown, fallback: string): string {
  if (error instanceof KratosRequestError) {
    return translate("auth.common.serviceUnavailable", { status: error.status })
  }
  return extractErrorMessage(error, fallback)
}
