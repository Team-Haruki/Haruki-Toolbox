import type { KratosFlowMessage } from "@/modules/auth/composables/useKratosBrowserFlow"
import type { KratosActionRole, KratosActionVariant } from "@/modules/auth/lib/action-hierarchy"

/**
 * What the sign-in family's form components draw: the hidden inputs, the
 * visible inputs and the ordered buttons of a Kratos flow, as the flow
 * composables hand them out.
 */

export interface KratosFormHiddenField {
  key: string
  name: string
  value: string
}

export interface KratosFormField {
  key: string
  group: string
  name: string
  type: string
  autocomplete: string
  label: string
  placeholder: string
  required: boolean
  disabled: boolean
  messages: KratosFlowMessage[]
}

export interface KratosFormAction {
  key: string
  group: string
  name: string
  value: string
  label: string
  disabled: boolean
  messages: KratosFlowMessage[]
  kind: "submit" | "trigger"
  role: KratosActionRole
  variant: KratosActionVariant
}
