import { getI18nLocale, translate, translateIfExists } from "@/shared/i18n"
import { extractErrorMessage } from "@/lib/error-utils"
import type { KratosFlowError, KratosFlowType, KratosUiMessage } from "@/modules/auth/lib/kratos"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"
import { KRATOS_TEXT_IDS } from "@/modules/auth/lib/kratos-text-ids"

// Kratos renders every UI text (flow messages, field messages and node
// labels) in English, but each carries a stable numeric id (ory/kratos
// text/id.go) and its parameters in `context`. Everything here translates by
// that id into `auth.kratos.text.<id>` (core bundle) and interpolates the
// context; the English Kratos text stays the fallback for ids nobody mapped.

const NS = "auth.kratos"
const KNOWN_TEXT_IDS = new Set(KRATOS_TEXT_IDS)

/** Ids whose Kratos text is only a carrier for `context.reason` (a herodot reason or a JSON schema error). */
const REASON_TEXT_IDS = new Set([4000001, 5000001])
const TEXT_ID_TITLE = 1070002
const TEXT_ID_REQUIRED = 4000002
const TEXT_ID_DUPLICATE_WITH_HINTS = 4000028
const TEXT_ID_LOOKUP_SECRET = 1050009
const TEXT_ID_LOOKUP_SECRET_USED = 1050014
const TEXT_ID_LOOKUP_SECRET_LIST = 1050015

export function resolveKratosMessageKey(id: number | undefined): string | null {
  if (typeof id !== "number" || !KNOWN_TEXT_IDS.has(id)) return null
  return `${NS}.text.${id}`
}

/** Display names for OIDC provider ids Kratos reports as `context.provider` when no label is configured. */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  apple: "Apple",
  auth0: "Auth0",
  discord: "Discord",
  facebook: "Facebook",
  github: "GitHub",
  "github-app": "GitHub",
  gitlab: "GitLab",
  google: "Google",
  lark: "Lark",
  line: "LINE",
  linkedin: "LinkedIn",
  microsoft: "Microsoft",
  patreon: "Patreon",
  qq: "QQ",
  slack: "Slack",
  spotify: "Spotify",
  twitch: "Twitch",
  x: "X",
  yandex: "Yandex",
}

/**
 * The provider name to show for a Kratos `provider`/`provider_id` pair.
 * Kratos falls back to the provider id ("google") when the provider has no
 * label; a configured label (anything other than the id) is kept as written.
 */
export function formatKratosProviderName(provider: unknown, providerId?: unknown): string {
  const name = typeof provider === "string" ? provider.trim() : ""
  const id = typeof providerId === "string" ? providerId.trim() : ""
  if (name && id && name !== id) return name
  const key = (id || name).toLowerCase()
  if (!key) return ""
  return PROVIDER_DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function readString(context: Record<string, unknown> | undefined, key: string): string {
  const value = context?.[key]
  return typeof value === "string" ? value.trim() : ""
}

function readStringList(context: Record<string, unknown> | undefined, key: string): string[] {
  const value = context?.[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : []
}

function formatUnixTime(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return ""
  try {
    return new Intl.DateTimeFormat(getI18nLocale(), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value * 1000))
  } catch {
    return new Date(value * 1000).toISOString()
  }
}

function formatList(items: string[], type: "conjunction" | "disjunction"): string {
  try {
    return new Intl.ListFormat(getI18nLocale(), { type }).format(items)
  } catch {
    return items.join(", ")
  }
}

/** A field name ("traits.email", "password") in user words, or null when unknown. */
export function resolveKratosFieldName(name: string): string | null {
  // Message keys cannot contain dots (they are paths), so "traits.email" is "traits_email".
  const key = name.trim().replace(/\./g, "_")
  if (!/^\w+$/.test(key)) return null
  return translateIfExists(`${NS}.fields.${key}`)
}

/** String and number context values, plus the derived parameters some texts use. */
function readContextParams(context: Record<string, unknown> | undefined): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context ?? {})) {
    if (typeof value === "string" || typeof value === "number") {
      params[key] = value
    }
  }
  if (context && ("provider" in context || "provider_id" in context)) {
    params.provider = formatKratosProviderName(context.provider, context.provider_id)
  }
  if (context && "used_at_unix" in context) {
    params.usedAt = formatUnixTime(context.used_at_unix)
  }
  return params
}

/**
 * Herodot reasons and JSON schema errors Kratos v25.4.0 reports through the
 * generic ids 4000001 / 5000001 (`context.reason`), for the methods the
 * Toolbox enables. Order matters: the first match wins.
 */
const REASON_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^The request was submitted too often/i, "tooManyAttempts"],
  [/^The code was already used/i, "codeUsed"],
  [/is not valid "email"$/i, "invalidEmail"],
  [/is not valid "[\w-]+"$/i, "invalidFormat"],
  [/^does not match pattern/i, "invalidFormat"],
  [/OpenID Provider returned error "access_denied"/i, "oidcDenied"],
  [/the user denied the request/i, "oidcDenied"],
  [/OpenID Provider returned error/i, "oidcProviderError"],
  [/^Unable to finish because one or more permissions were not granted/i, "oidcPermissions"],
  [/^Authentication failed because no id_token was returned/i, "oidcPermissions"],
  [/^Unable to complete OpenID Connect flow/i, "oidcFailed"],
  [/^The session cookie contains invalid values/i, "sessionCookieInvalid"],
  [/^Unable to parse WebAuthn response/i, "webauthnFailed"],
  [/^You tried to remove a (passkey|WebAuthn)/i, "credentialMissing"],
  [/^You cannot remove the last first factor credential/i, "lastCredential"],
  [/^Did not receive any value changes/i, "noChanges"],
  [/^You must \(re-\)generate recovery backup codes/i, "lookupRegenerateFirst"],
  [/^Can not reveal lookup codes because you have none/i, "lookupNone"],
  [/^Your account's email or phone address are not verified yet/i, "addressNotVerified"],
  [/^A valid session was detected/i, "alreadySignedIn"],
  [/is not allowed because it was disabled/i, "flowDisabled"],
]

/** User-language text for a Kratos/herodot reason sentence, or null when the reason is unknown. */
export function localizeKratosReason(reason: string): string | null {
  const trimmed = reason.trim()
  if (!trimmed) return null
  for (const [pattern, key] of REASON_PATTERNS) {
    if (pattern.test(trimmed)) {
      return translateIfExists(`${NS}.reasons.${key}`)
    }
  }
  return null
}

function localizeRequired(context: Record<string, unknown> | undefined): string | null {
  const field = resolveKratosFieldName(readString(context, "property"))
  if (field) {
    return translateIfExists(`${NS}.variants.requiredField`, { field })
  }
  return translateIfExists(`${NS}.text.${TEXT_ID_REQUIRED}`)
}

function localizeDuplicateWithHints(context: Record<string, unknown> | undefined): string | null {
  const identifier = readString(context, "credential_identifier_hint")
    || translateIfExists(`${NS}.variants.duplicateIdentifierUnknown`)
    || ""
  const head = translateIfExists(`${NS}.text.${TEXT_ID_DUPLICATE_WITH_HINTS}`, { identifier })
  if (!head) return null

  const parts = [head]
  const methods = [...new Set(readStringList(context, "available_credential_types")
    .map((type) => translateIfExists(`${NS}.credentialTypes.${type}`) ?? "")
    .filter((label) => label !== ""))]
  if (methods.length > 0) {
    parts.push(translate(`${NS}.variants.duplicateMethods`, { methods: formatList(methods, "disjunction") }))
  }
  const providers = readStringList(context, "available_oidc_providers").map((provider) => formatKratosProviderName(provider))
  if (providers.length > 0) {
    parts.push(translate(`${NS}.variants.duplicateProviders`, { providers: formatList(providers, "conjunction") }))
  }
  return parts.join(getI18nLocale().startsWith("zh") ? "" : " ")
}

function localizeTitle(context: Record<string, unknown> | undefined, fallback: string): string {
  const field = resolveKratosFieldName(readString(context, "name"))
  if (field) {
    // Field names are lower-case mid-sentence words in English ("email"); a label starts upper-case.
    return field.charAt(0).toUpperCase() + field.slice(1)
  }
  return readString(context, "title") || fallback
}

/** One backup recovery code, or its "used" marker, from a 1050015 list entry. */
function localizeLookupSecret(message: KratosUiMessage): string {
  if (message.id === TEXT_ID_LOOKUP_SECRET_USED) {
    const usedAt = formatUnixTime(message.context?.used_at_unix)
    return usedAt
      ? translate(`${NS}.text.${TEXT_ID_LOOKUP_SECRET_USED}`, { usedAt })
      : translate(`${NS}.variants.lookupSecretUsed`)
  }
  return readString(message.context, "secret") || message.text?.trim() || ""
}

function readSecretMessages(context: Record<string, unknown> | undefined): KratosUiMessage[] {
  const secrets = context?.secrets
  return Array.isArray(secrets)
    ? secrets.filter((entry): entry is KratosUiMessage => !!entry && typeof entry === "object")
    : []
}

/**
 * The backup recovery codes of a 1050015 text node, one per line, with used
 * codes replaced by a localized "used on …" marker.
 */
export function formatKratosLookupSecretList(message: KratosUiMessage): string {
  return readSecretMessages(message.context)
    .map(localizeLookupSecret)
    .filter((line) => line !== "")
    .join("\n")
}

/** The user-language text for a Kratos UI message, or its English text when the id is unmapped. */
export function localizeKratosMessage(message: KratosUiMessage): string {
  const text = message.text?.trim() ?? ""
  const id = message.id
  const context = message.context

  if (typeof id !== "number") return text
  if (REASON_TEXT_IDS.has(id)) {
    return localizeKratosReason(readString(context, "reason") || text) ?? text
  }
  if (id === TEXT_ID_TITLE) return localizeTitle(context, text)
  if (id === TEXT_ID_REQUIRED) return localizeRequired(context) ?? text
  if (id === TEXT_ID_DUPLICATE_WITH_HINTS) return localizeDuplicateWithHints(context) ?? text
  if (id === TEXT_ID_LOOKUP_SECRET || id === TEXT_ID_LOOKUP_SECRET_USED) return localizeLookupSecret(message)
  if (id === TEXT_ID_LOOKUP_SECRET_LIST) return formatKratosLookupSecretList(message) || text

  const key = resolveKratosMessageKey(id)
  if (!key) return text
  return translateIfExists(key, readContextParams(context)) ?? text
}

/** Why a self-service flow could not be loaded: expired, gone, or the service is unreachable. */
export function describeKratosFlowLoadError(flowType: KratosFlowType): string {
  return translate("auth.common.loadFlowFailed", { flow: translate(`auth.common.flowNames.${flowType}`) })
}

/**
 * The explanation for a Kratos self-service error (the /user/error page):
 * by error id, then by a known reason sentence, then by HTTP status. Null
 * when none applies; the page then shows its generic text.
 */
export function describeKratosFlowError(error: KratosFlowError | null | undefined): string | null {
  if (!error) return null
  const id = error.id?.trim() ?? ""
  if (id) {
    const byId = translateIfExists(`${NS}.errors.${id}`)
    if (byId) return byId
  }
  const byReason = localizeKratosReason(error.reason ?? "")
  if (byReason) return byReason
  const code = typeof error.code === "number" ? error.code : 0
  if (code >= 500) return translateIfExists(`${NS}.errorStatus.500`)
  return code ? translateIfExists(`${NS}.errorStatus.${code}`) : null
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
