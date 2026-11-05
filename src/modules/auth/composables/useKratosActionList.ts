import { computed, type ComputedRef, type Ref } from "vue"
import type { KratosFlowMessage } from "@/modules/auth/composables/useKratosBrowserFlow"
import {
  orderKratosActions,
  type KratosActionRole,
  type KratosActionVariant,
} from "@/modules/auth/lib/action-hierarchy"

interface SubmitLike {
  key: string
  group: string
  name: string
  value: string
  label: string
  labelId: number | null
  disabled: boolean
  messages: KratosFlowMessage[]
}

interface TriggerLike extends SubmitLike {
  onClickTrigger: string
}

export interface KratosActionItem {
  key: string
  group: string
  name: string
  value: string
  label: string
  labelId: number | null
  disabled: boolean
  messages: KratosFlowMessage[]
  kind: "submit" | "trigger"
  onClickTrigger: string
  role: KratosActionRole
  variant: KratosActionVariant
}

/**
 * The flow's submit buttons and trigger buttons (passkey) as one list in
 * display order with a role and Button variant each: one primary, outline
 * alternatives, Back as ghost and Resend as link (see action-hierarchy.ts).
 */
export function useKratosActionList(
  submitFields: Ref<readonly SubmitLike[]> | ComputedRef<readonly SubmitLike[]>,
  buttonFields: Ref<readonly TriggerLike[]> | ComputedRef<readonly TriggerLike[]>,
): ComputedRef<KratosActionItem[]> {
  return computed(() => {
    const submits = submitFields.value.map((field) => ({ ...field, kind: "submit" as const, onClickTrigger: "" }))
    const triggers = buttonFields.value.map((field) => ({ ...field, kind: "trigger" as const }))
    return orderKratosActions([...submits, ...triggers]).map(({ action, role, variant }) => ({ ...action, role, variant }))
  })
}
