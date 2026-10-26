import { KRATOS_RESEND_CODE_LABEL_ID } from "@/modules/auth/lib/kratos-labels"

/**
 * Decides which inputs the client-side "required" check covers for one
 * submit. A Kratos form carries several submit nodes at once (password,
 * code, totp, lookup_secret, OIDC providers, "Resend code"), and Kratos only
 * validates the fields of the method the clicked button names. The check
 * here mirrors that: it is scoped to the button that fired the submit event
 * and never blocks a button that posts no credential of its own.
 */

export interface KratosSubmitterInfo {
  name: string
  value: string
  group: string
  /** Kratos text id of the button label; tells "Resend code" (1070008) apart from the code submit. */
  labelId?: number | null
}

export interface KratosValidatableField {
  name: string
  group: string
  type: string
  required: boolean
  disabled: boolean
}

export const KRATOS_DEFAULT_GROUP = "default"

/**
 * Credential inputs each method depends on, in case Kratos omits `required`
 * on them. Only fields inside the method's own groups are considered, so a
 * name listed here never leaks into another method's submit.
 */
const METHOD_REQUIRED_FIELDS: Record<string, readonly string[]> = {
  password: ["identifier", "password", "traits.email"],
  code: ["identifier", "email", "traits.email", "code"],
  totp: ["totp_code"],
  lookup_secret: ["lookup_secret"],
  link: ["email"],
}

function normalize(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase()
}

export function isKratosMethodSubmit(submitter: KratosSubmitterInfo | null | undefined): submitter is KratosSubmitterInfo {
  return !!submitter && normalize(submitter.name) === "method"
}

export function isKratosResendSubmit(submitter: KratosSubmitterInfo | null | undefined): boolean {
  return !!submitter && submitter.labelId === KRATOS_RESEND_CODE_LABEL_ID
}

/**
 * The submit the validation applies to. `submitter` is what the browser
 * reports on the SubmitEvent; when it is missing (requestSubmit() without a
 * button) and the form has exactly one method button, that button is used.
 */
export function resolveValidationSubmitter(
  submitter: KratosSubmitterInfo | null | undefined,
  submits: readonly KratosSubmitterInfo[],
): KratosSubmitterInfo | null {
  if (submitter) {
    return submitter
  }

  const methodSubmits = submits.filter((submit) => isKratosMethodSubmit(submit) && !isKratosResendSubmit(submit))
  return methodSubmits.length === 1 ? methodSubmits[0]! : null
}

/**
 * Names of the fields the submit must have filled in, in field order.
 * - Not a `method` button (OIDC provider, passkey/webauthn, unnamed): none.
 * - "Resend code": none.
 * - `method=<x>`: fields of the default group plus the button's own group
 *   (and the group named after the method value), when Kratos marks them
 *   required or the method depends on them.
 * - No submitter resolvable: the default group only.
 */
export function resolveFieldsToValidate(
  submitter: KratosSubmitterInfo | null | undefined,
  fields: readonly KratosValidatableField[],
): string[] {
  const groups = new Set<string>([KRATOS_DEFAULT_GROUP])
  let methodRequired: readonly string[] = []

  if (submitter) {
    if (!isKratosMethodSubmit(submitter) || isKratosResendSubmit(submitter)) {
      return []
    }

    const method = normalize(submitter.value)
    const group = normalize(submitter.group) || KRATOS_DEFAULT_GROUP
    groups.add(group)
    if (method) {
      groups.add(method)
    }
    methodRequired = METHOD_REQUIRED_FIELDS[method] ?? []
  }

  return fields
    .filter((field) => {
      if (field.type === "button" || field.disabled) {
        return false
      }
      if (!groups.has(normalize(field.group) || KRATOS_DEFAULT_GROUP)) {
        return false
      }
      return field.required || methodRequired.includes(field.name)
    })
    .map((field) => field.name)
}
