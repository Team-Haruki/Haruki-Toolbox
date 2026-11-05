/**
 * One primary per Kratos form. The flow UI lists its submit buttons and
 * trigger buttons (passkey) in server order with no visual weight; this
 * module gives each a role, sorts them (primary first, Back/Resend last) and
 * maps the role to a Button variant so login, registration, recovery and
 * verification render the same hierarchy:
 *
 *   primary      the method the visible inputs belong to      default
 *   alternative  another method with its own inputs (AAL2)    outline
 *   passkey      the passkey trigger button                    outline
 *   social       OIDC / SAML providers                         outline
 *   resend       "Resend code"                                 link
 *   back         "Back" to the previous registration screen    ghost
 */

export type KratosActionRole = "primary" | "alternative" | "passkey" | "social" | "resend" | "back"

export type KratosActionVariant = "default" | "outline" | "ghost" | "link"

export interface KratosActionLike {
  group: string
  name: string
  value: string
  /** Kratos text id of the label (e.g. 1070008 for "Resend code"). */
  labelId?: number | null
}

/** Kratos text id of the registration "Back" button. */
const BACK_LABEL_ID = 1040008
/** Kratos text id of "Resend code". */
const RESEND_LABEL_ID = 1070008

const ROLE_RANK: Record<KratosActionRole, number> = {
  primary: 0,
  alternative: 1,
  passkey: 2,
  social: 3,
  resend: 4,
  back: 5,
}

const ROLE_VARIANT: Record<KratosActionRole, KratosActionVariant> = {
  primary: "default",
  alternative: "outline",
  passkey: "outline",
  social: "outline",
  resend: "link",
  back: "ghost",
}

export function isSocialAction(action: Pick<KratosActionLike, "group" | "name">): boolean {
  const group = action.group.trim().toLowerCase()
  const name = action.name.trim().toLowerCase()
  return group === "oidc" || group === "saml" || name === "provider"
}

export function isPasskeyAction(action: Pick<KratosActionLike, "group" | "name" | "value">): boolean {
  const signature = `${action.group} ${action.name} ${action.value}`.trim().toLowerCase()
  return signature.includes("passkey") || signature.includes("webauthn")
}

export function isBackAction(action: KratosActionLike): boolean {
  if (action.labelId === BACK_LABEL_ID) return true
  return action.name.trim().toLowerCase() === "screen" && action.value.trim().toLowerCase() === "previous"
}

export function isResendAction(action: KratosActionLike): boolean {
  if (action.labelId === RESEND_LABEL_ID) return true
  // Older fixtures without label ids: the resend submit posts the address under `email`.
  return action.name.trim().toLowerCase() === "email" && action.group.trim().toLowerCase() === "code"
}

/** The role of one action on its own; see `orderKratosActions` for the per-form primary. */
export function classifyKratosAction(action: KratosActionLike): KratosActionRole {
  if (isBackAction(action)) return "back"
  if (isResendAction(action)) return "resend"
  if (isSocialAction(action)) return "social"
  if (isPasskeyAction(action)) return "passkey"
  return "primary"
}

export function kratosActionVariant(role: KratosActionRole): KratosActionVariant {
  return ROLE_VARIANT[role]
}

export interface OrderedKratosAction<T extends KratosActionLike> {
  action: T
  role: KratosActionRole
  variant: KratosActionVariant
}

/**
 * Sorts the form's actions by role (stable within a role) and keeps exactly
 * one `primary`: every further method submit becomes an `alternative`.
 */
export function orderKratosActions<T extends KratosActionLike>(actions: readonly T[]): OrderedKratosAction<T>[] {
  const classified = actions.map((action, index) => ({ action, index, role: classifyKratosAction(action) }))
  classified.sort((left, right) => {
    const rankDiff = ROLE_RANK[left.role] - ROLE_RANK[right.role]
    return rankDiff !== 0 ? rankDiff : left.index - right.index
  })

  let primaryTaken = false
  return classified.map(({ action, role }) => {
    let resolved = role
    if (role === "primary") {
      resolved = primaryTaken ? "alternative" : "primary"
      primaryTaken = true
    }
    return { action, role: resolved, variant: kratosActionVariant(resolved) }
  })
}
