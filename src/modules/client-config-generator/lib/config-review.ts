import {
  DEFAULT_CLIENT_CONFIG_FORM,
  resolveClientConfigPrefillParams,
  type ClientConfigForm,
} from "@/modules/client-config-generator/lib/client-config"

/**
 * What the generator page says about the form besides the file itself: which
 * routing a client will use, what is still missing, and how much of the
 * folded "advanced" groups was changed. None of this touches the output.
 */

export type ClientRoutingState = "pinned" | "dynamic" | "builtIn"

/** A pinned endpoint wins; otherwise dynamic routing unless it was switched off. */
export function resolveRoutingState(form: Pick<ClientConfigForm, "serverEndpointOverride" | "enableDynamicRouting">): ClientRoutingState {
  if (form.serverEndpointOverride.trim().length > 0) {
    return "pinned"
  }

  return form.enableDynamicRouting ? "dynamic" : "builtIn"
}

/** A TCP port: a whole number from `min` (1, or 0 where 0 means "off") to 65535. */
export function isValidPort(value: unknown, min = 1): boolean {
  if (typeof value !== "number" && typeof value !== "string") {
    return false
  }
  if (typeof value === "string" && value.trim() === "") {
    return false
  }

  const port = Number(value)
  return Number.isInteger(port) && port >= min && port <= 65535
}

export type ClientConfigEssential = "botId" | "credential"

/** The two values a client cannot connect without. */
export function findMissingEssentials(form: Pick<ClientConfigForm, "botId" | "credential">): ClientConfigEssential[] {
  const missing: ClientConfigEssential[] = []
  const botId = Number(form.botId)
  if (!Number.isSafeInteger(botId) || botId <= 0) {
    missing.push("botId")
  }
  if (!String(form.credential ?? "").trim()) {
    missing.push("credential")
  }
  return missing
}

export type ClientConfigAdvancedGroup = "routing" | "security" | "rateLimit" | "birthday"

/**
 * The fields of each folded group. The access token text is left out: only
 * its switch decides whether a token is written.
 */
export const CLIENT_CONFIG_ADVANCED_FIELDS: Record<ClientConfigAdvancedGroup, readonly (keyof ClientConfigForm)[]> = {
  routing: ["serverEndpointOverride", "enableDynamicRouting", "routingConfigURL"],
  security: ["noiseServerPubkey", "noiseServerKeyId", "trustRootPubkey", "useControlApiAccessToken", "strictConfigPermissions"],
  rateLimit: ["enableGroupCommandLimit", "globalCommandHourlyLimit", "globalCommandDailyLimit"],
  birthday: [
    "mysekaiBirthdayMonitorMode",
    "mysekaiBirthdayMonitorBlacklistText",
    "mysekaiBirthdayMonitorWhitelistText",
    "mysekaiBirthdayMonitorNotifyEmpty",
  ],
}

function sameAsDefault(form: ClientConfigForm, field: keyof ClientConfigForm): boolean {
  const value = form[field]
  const fallback = DEFAULT_CLIENT_CONFIG_FORM[field]
  if (typeof fallback === "number") {
    // An emptied number field is written as its default.
    return value === "" || Number(value) === fallback
  }
  if (typeof fallback === "string") {
    return String(value ?? "").trim() === fallback
  }
  return value === fallback
}

/** How many of the given fields differ from a fresh form. */
export function countChangedFields(form: ClientConfigForm, fields: readonly (keyof ClientConfigForm)[]): number {
  return fields.filter((field) => !sameAsDefault(form, field)).length
}

/** Changed-field counts per folded group, so a closed group still says it was touched. */
export function countAdvancedChanges(form: ClientConfigForm): Record<ClientConfigAdvancedGroup, number> {
  return {
    routing: countChangedFields(form, CLIENT_CONFIG_ADVANCED_FIELDS.routing),
    security: countChangedFields(form, CLIENT_CONFIG_ADVANCED_FIELDS.security),
    rateLimit: countChangedFields(form, CLIENT_CONFIG_ADVANCED_FIELDS.rateLimit),
    birthday: countChangedFields(form, CLIENT_CONFIG_ADVANCED_FIELDS.birthday),
  }
}

/**
 * Whether the form still carries what the registration page handed over in
 * the URL: false once both values were edited away or the form was reset.
 */
export function isPrefillStillApplied(
  query: Record<string, unknown>,
  form: Pick<ClientConfigForm, "botId" | "credential">,
): boolean {
  const prefill = resolveClientConfigPrefillParams(query)
  if (!prefill.hasPrefill) {
    return false
  }

  // Only an owner id came along: nothing was filled in, so nothing can be lost.
  const carriedValues = prefill.botId !== null || prefill.credential !== ""
  const botIdKept = prefill.botId !== null && Number(form.botId) === prefill.botId
  const credentialKept = prefill.credential !== "" && form.credential === prefill.credential
  return !carriedValues || botIdKept || credentialKept
}
