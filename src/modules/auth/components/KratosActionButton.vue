<script setup lang="ts" generic="A extends KratosFormAction">
import { KeyRound } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import type { KratosFormAction } from "@/modules/auth/components/kratos-form-types"
import type { KratosActionVariant } from "@/modules/auth/lib/action-hierarchy"

// One button of a Kratos form (a method submit, a passkey trigger, a social
// provider, Resend or Back) with the messages Kratos attached to its node.
// A submit keeps the node's name and value and carries its key as
// `data-kratos-submit`, which is how the flow traces a submit event back to
// the node; a trigger is a plain button that reports the click.
withDefaults(defineProps<{
  action: A
  /** Overrides the variant the action hierarchy gave the button. */
  variant?: KratosActionVariant
  disabled?: boolean
}>(), {
  variant: undefined,
  disabled: false,
})

const emit = defineEmits<{ trigger: [action: A] }>()
</script>

<template>
  <div class="grid min-w-0 gap-1.5">
    <Button
      :type="action.kind === 'submit' ? 'submit' : 'button'"
      size="lg"
      class="h-auto min-h-10 w-full whitespace-normal py-2"
      :variant="variant ?? action.variant"
      :data-kratos-role="action.role"
      :name="action.name || undefined"
      :value="action.value || undefined"
      :data-kratos-submit="action.kind === 'submit' ? action.key : undefined"
      :disabled="disabled || action.disabled"
      @click="action.kind === 'trigger' ? emit('trigger', action) : undefined"
    >
      <KeyRound v-if="action.role === 'passkey'" class="size-4" aria-hidden="true" />
      <span class="min-w-0 [overflow-wrap:anywhere]">{{ action.label }}</span>
    </Button>
    <KratosFlowMessages :messages="action.messages" variant="field" />
  </div>
</template>
