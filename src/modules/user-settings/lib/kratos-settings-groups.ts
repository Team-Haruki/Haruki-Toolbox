/**
 * How the identity-settings page draws the node groups of a Kratos settings
 * flow: whether a method is set up, what kind of button each action is, and
 * which button Enter in a group's input stands for.
 *
 * Kratos labels are translated, so nothing here reads label wording: actions
 * are told apart by node name or by the Kratos text id of the label
 * (text/message_settings.go).
 */

export interface KratosSettingsActionLike {
  name: string
  value?: string
  labelId?: number | null
  disabled?: boolean
}

/** A submit node of a settings group, as the page draws it. */
export interface SettingsActionSubmit extends KratosSettingsActionLike {
  key: string
  value: string
  label: string
  labelId: number | null
  disabled: boolean
}

/** A trigger button node (add passkey, add security key) of a settings group. */
export interface SettingsActionButton {
  key: string
  name: string
  value: string
  label: string
  disabled: boolean
}

const DANGEROUS_LABEL_IDS = new Set([
  1050003, // Unlink {provider}
  1050004, // Unlink TOTP authenticator app
  1050016, // Disable backup recovery codes
  1050018, // Remove security key
  1050020, // Remove passkey
])
const DANGEROUS_NODE_NAMES = new Set(["unlink", "totp_unlink", "lookup_secret_disable", "webauthn_remove", "passkey_remove"])

/** Kratos text id of "Confirm backup recovery codes". */
const LOOKUP_CONFIRM_LABEL_ID = 1050011

/** Removing or switching off a way to sign in: asks for confirmation first. */
export function isDangerousSettingsAction(action: KratosSettingsActionLike): boolean {
  return (action.labelId != null && DANGEROUS_LABEL_IDS.has(action.labelId)) || DANGEROUS_NODE_NAMES.has(action.name)
}

/**
 * - `danger`: removes or switches off something (see above).
 * - `commit`: posts what the person typed or confirms a pending change — the
 *   group's filled button (`method=<x>` saves, and confirming new backup codes).
 * - `start`: begins something that continues elsewhere (add a passkey,
 *   generate or reveal codes, link a provider) — an outline button.
 */
export type KratosSettingsActionKind = "danger" | "commit" | "start"

export function classifySettingsAction(action: KratosSettingsActionLike): KratosSettingsActionKind {
  if (isDangerousSettingsAction(action)) {
    return "danger"
  }
  if (action.name === "method" || action.name === "lookup_secret_confirm" || action.labelId === LOOKUP_CONFIRM_LABEL_ID) {
    return "commit"
  }
  return "start"
}

/** What a dangerous action does, for the wording of its confirmation. */
export type KratosSettingsDangerKind = "removePasskey" | "removeSecurityKey" | "disableTotp" | "disableLookup" | "unlinkProvider" | "generic"

const DANGER_KIND_BY_NAME: Record<string, KratosSettingsDangerKind> = {
  passkey_remove: "removePasskey",
  webauthn_remove: "removeSecurityKey",
  totp_unlink: "disableTotp",
  lookup_secret_disable: "disableLookup",
  unlink: "unlinkProvider",
}

const DANGER_KIND_BY_LABEL_ID: Record<number, KratosSettingsDangerKind> = {
  1050020: "removePasskey",
  1050018: "removeSecurityKey",
  1050004: "disableTotp",
  1050016: "disableLookup",
  1050003: "unlinkProvider",
}

export function resolveSettingsDangerKind(action: KratosSettingsActionLike): KratosSettingsDangerKind {
  const byName = DANGER_KIND_BY_NAME[action.name]
  if (byName) {
    return byName
  }
  return (action.labelId != null ? DANGER_KIND_BY_LABEL_ID[action.labelId] : undefined) ?? "generic"
}

/** The verb on the confirmation button: remove a credential, switch a method off, or unlink a provider. */
export type KratosSettingsDangerVerb = "remove" | "disable" | "unlink"

export function resolveSettingsDangerVerb(kind: KratosSettingsDangerKind): KratosSettingsDangerVerb {
  switch (kind) {
    case "disableTotp":
    case "disableLookup":
      return "disable"
    case "unlinkProvider":
      return "unlink"
    default:
      return "remove"
  }
}

/** The second-step methods the page explains with a status line of its own. */
export const KRATOS_SETTINGS_METHOD_GROUPS = ["passkey", "webauthn", "totp", "lookup_secret"] as const

export type KratosSettingsMethodGroup = typeof KRATOS_SETTINGS_METHOD_GROUPS[number]

export function isKratosSettingsMethodGroup(group: string): group is KratosSettingsMethodGroup {
  return (KRATOS_SETTINGS_METHOD_GROUPS as readonly string[]).includes(group)
}

/**
 * `on`: the method is set up. `pending`: new backup codes are shown and wait
 * for confirmation. `off`: nothing set up yet.
 */
export type KratosSettingsMethodStatus = "on" | "pending" | "off"

/**
 * Whether a method is set up, read from the submit nodes Kratos sends for its
 * group: a remove / unlink / disable button only exists once there is
 * something to remove.
 */
export function resolveSettingsMethodStatus(
  group: KratosSettingsMethodGroup,
  submits: readonly KratosSettingsActionLike[],
): KratosSettingsMethodStatus {
  const names = new Set(submits.map((submit) => submit.name))
  switch (group) {
    case "passkey":
      return names.has("passkey_remove") ? "on" : "off"
    case "webauthn":
      return names.has("webauthn_remove") ? "on" : "off"
    case "totp":
      return names.has("totp_unlink") ? "on" : "off"
    case "lookup_secret":
      if (names.has("lookup_secret_confirm")) {
        return "pending"
      }
      return names.has("lookup_secret_disable") || names.has("lookup_secret_reveal") ? "on" : "off"
  }
}

export type KratosSettingsEnterTarget<S, B> =
  | { kind: "submit"; action: S }
  | { kind: "trigger"; action: B }

/**
 * The button Enter in one of a group's inputs stands for. Every group shares
 * one `<form>`, so the browser's own choice would be the first submit button
 * on the page, which can belong to another method or remove a credential.
 * Enter therefore goes to the group's own action: its save, otherwise its
 * trigger button (add security key), otherwise its first plain submit; never
 * a dangerous one, and null when the group has nothing to press.
 */
export function pickSettingsEnterTarget<S extends KratosSettingsActionLike, B extends KratosSettingsActionLike>(
  submits: readonly S[],
  buttons: readonly B[],
): KratosSettingsEnterTarget<S, B> | null {
  const usable = submits.filter((submit) => submit.disabled !== true)
  const commit = usable.find((submit) => classifySettingsAction(submit) === "commit")
  if (commit) {
    return { kind: "submit", action: commit }
  }
  const trigger = buttons.find((button) => button.disabled !== true && !isDangerousSettingsAction(button))
  if (trigger) {
    return { kind: "trigger", action: trigger }
  }
  const start = usable.find((submit) => classifySettingsAction(submit) === "start")
  return start ? { kind: "submit", action: start } : null
}

/** A recovery-code list (one code or "used" marker per line) as separate entries. */
export function splitSettingsCodeList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
}
