import type { KratosFlowType } from "@/modules/auth/lib/kratos"

/**
 * Kratos renders its node labels in English ("ID", "Password", "Sign in",
 * "E-Mail", "Verify code"). Nodes are identified by stable attribute names and
 * `method` values, so known ones map onto the auth bundle's own labels; the
 * Kratos text stays the fallback for anything unmapped.
 */

export interface KratosInputLabelKeys {
  labelKey: string
  placeholderKey?: string
}

const INPUT_LABEL_KEYS: Record<string, KratosInputLabelKeys> = {
  "identifier": { labelKey: "auth.login.emailLabel", placeholderKey: "auth.login.emailPlaceholder" },
  "password": { labelKey: "auth.login.passwordLabel", placeholderKey: "auth.login.passwordPlaceholder" },
  "email": { labelKey: "auth.login.emailLabel", placeholderKey: "auth.login.emailPlaceholder" },
  "traits.email": { labelKey: "auth.register.emailLabel", placeholderKey: "auth.login.emailPlaceholder" },
  "traits.name": { labelKey: "auth.register.usernameLabel", placeholderKey: "auth.register.usernamePlaceholder" },
  "traits.username": { labelKey: "auth.register.usernameLabel", placeholderKey: "auth.register.usernamePlaceholder" },
  "code": { labelKey: "auth.kratos.labels.code", placeholderKey: "auth.kratos.labels.codePlaceholder" },
  "totp_code": { labelKey: "auth.kratos.labels.totpCode", placeholderKey: "auth.kratos.labels.totpCodePlaceholder" },
  "lookup_secret": { labelKey: "auth.kratos.labels.lookupSecret" },
}

const REGISTRATION_INPUT_LABEL_KEYS: Record<string, KratosInputLabelKeys> = {
  "password": { labelKey: "auth.register.passwordLabel", placeholderKey: "auth.register.passwordPlaceholder" },
}

const SETTINGS_INPUT_LABEL_KEYS: Record<string, KratosInputLabelKeys> = {
  "password": { labelKey: "auth.resetPassword.newPasswordLabel", placeholderKey: "auth.resetPassword.newPasswordPlaceholder" },
}

export function resolveKratosInputLabelKeys(flowType: KratosFlowType, name: string): KratosInputLabelKeys | null {
  const normalized = name.trim()
  if (flowType === "registration" && REGISTRATION_INPUT_LABEL_KEYS[normalized]) {
    return REGISTRATION_INPUT_LABEL_KEYS[normalized]
  }
  if ((flowType === "settings" || flowType === "recovery") && SETTINGS_INPUT_LABEL_KEYS[normalized]) {
    return SETTINGS_INPUT_LABEL_KEYS[normalized]
  }
  return INPUT_LABEL_KEYS[normalized] ?? null
}

/**
 * Submit buttons are `method=<value>` nodes; what the button does depends on
 * the flow it belongs to ("password" submits a sign-in on login and an account
 * on registration).
 */
export interface KratosSubmitLabelContext {
  /** The flow state ("choose_method", "sent_email", ...): what a `method=code` submit does depends on it. */
  state?: string
  /** The Kratos text id of the node label, which tells the "Resend code" button apart from the submit. */
  labelId?: number
}

/** Kratos text id of the "Resend code" button label (text/message_recovery.go, message_verification.go). */
export const KRATOS_RESEND_CODE_LABEL_ID = 1070008

export function resolveKratosSubmitLabelKey(
  flowType: KratosFlowType,
  name: string,
  value: string,
  context: KratosSubmitLabelContext = {},
): string | null {
  const normalizedName = name.trim()
  const normalizedValue = value.trim().toLowerCase()
  if (normalizedName !== "method") {
    return null
  }

  switch (normalizedValue) {
    case "password":
      if (flowType === "login") return "auth.login.submit"
      if (flowType === "registration") return "auth.register.submit"
      if (flowType === "settings") return "auth.kratos.labels.savePassword"
      return null
    case "code":
      if (flowType === "login") return "auth.kratos.labels.continueWithCode"
      if (flowType === "registration") return "auth.register.submit"
      if (flowType === "recovery" || flowType === "verification") {
        // Before the code is sent the button requests it; once Kratos has sent
        // it (sent_email) the same method submits the entered code, next to a
        // second method=code button that resends it.
        if (context.labelId === KRATOS_RESEND_CODE_LABEL_ID || context.state !== "sent_email") {
          return "auth.register.sendCode"
        }
        return flowType === "verification" ? "auth.verification.submit" : "auth.kratos.labels.verify"
      }
      return null
    case "link":
      return "auth.kratos.labels.sendLink"
    case "totp":
      return "auth.kratos.labels.verify"
    case "lookup_secret":
      return "auth.kratos.labels.verify"
    case "profile":
      return "common.save"
    default:
      return null
  }
}
