/**
 * The identity-settings sections the toolbox routes to on the Kratos settings
 * flow (`?section=`): what the card is titled, which Kratos node groups it
 * shows and where it says it is taking the person.
 */
export const KRATOS_SETTINGS_SECTIONS = ["profile", "password", "mfa", "oidc"] as const

export type KratosSettingsSection = typeof KRATOS_SETTINGS_SECTIONS[number]

const SECTION_ALIASES: Record<string, KratosSettingsSection> = {
  email: "profile",
  profile: "profile",
  password: "password",
  mfa: "mfa",
  security: "mfa",
  oidc: "oidc",
  social: "oidc",
}

/**
 * Canonical section name for a `?section=` query value: aliases fold onto the
 * four known sections, unknown names pass through lower-cased (they select a
 * Kratos node group of the same name) and anything else is "".
 */
export function normalizeKratosSettingsSection(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  const section = value.trim().toLowerCase()
  return SECTION_ALIASES[section] ?? section
}

export function isKratosSettingsSection(value: string): value is KratosSettingsSection {
  return (KRATOS_SETTINGS_SECTIONS as readonly string[]).includes(value)
}

/** The known section a value maps onto, `profile` for anything unknown or empty. */
export function resolveKnownKratosSettingsSection(value: unknown): KratosSettingsSection {
  const normalized = normalizeKratosSettingsSection(value)
  return isKratosSettingsSection(normalized) ? normalized : "profile"
}
