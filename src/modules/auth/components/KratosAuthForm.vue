<script setup lang="ts" generic="A extends KratosFormAction">
import { computed, useTemplateRef } from "vue"
import { Button } from "@/components/ui/button"
import KratosActionButton from "@/modules/auth/components/KratosActionButton.vue"
import KratosFieldInput from "@/modules/auth/components/KratosFieldInput.vue"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import type { KratosFormAction, KratosFormField, KratosFormHiddenField } from "@/modules/auth/components/kratos-form-types"
import type { KratosFlowMessage } from "@/modules/auth/composables/useKratosBrowserFlow"
import { layoutKratosFlow } from "@/modules/auth/lib/flow-layout"

/**
 * The form of a sign-in family page, drawn the same way on every one of them:
 *
 *   flow messages (and the page's own notice)
 *   the primary method: its inputs, the one primary button, "Resend code"
 *   other methods that take input (a backup code next to the authenticator)
 *   buttons that take none: passkey, then social providers
 *   "Back"
 *
 * Each part is a section of the panel, separated by a hairline. The component
 * only draws: the page owns the flow, decides what a submit and a trigger
 * click do, and receives the typed values back through `update:value`.
 */
const props = withDefaults(defineProps<{
  action: string
  method: string
  hiddenFields: readonly KratosFormHiddenField[]
  messages: KratosFlowMessage[]
  fields: readonly KratosFormField[]
  actions: readonly A[]
  values: Record<string, string>
  errors: Record<string, string>
  /** False until the flow is loaded: the buttons stay disabled. */
  ready: boolean
  /** A passkey request is running: every button waits for it. */
  busy?: boolean
  /**
   * Whether a form with nothing but shortcuts fills its first one. Off when
   * the page's own notice already carries the action to take.
   */
  promoteShortcut?: boolean
  /** Caption over the methods that are not the primary one. */
  alternativesLabel: string
  /** Label of the plain submit shown when Kratos sent no button at all. */
  fallbackSubmitLabel: string
}>(), {
  busy: false,
  promoteShortcut: true,
})

const emit = defineEmits<{
  submit: [event: Event]
  trigger: [action: A]
  "update:value": [name: string, value: string]
}>()

const formElement = useTemplateRef<HTMLFormElement>("formElement")
defineExpose({ form: formElement })

const layout = computed(() => layoutKratosFlow(props.fields, props.actions))
const hasNoActions = computed(() => props.actions.length === 0)
const firstFieldKey = computed(
  () => layout.value.primary?.fields[0]?.key ?? layout.value.alternatives.find((block) => block.fields.length > 0)?.fields[0]?.key ?? "",
)
const buttonsDisabled = computed(() => !props.ready || props.busy)
// A form with nothing but shortcuts (a passkey-only re-authentication) still
// needs one filled button to act on.
const promoteFirstShortcut = computed(
  () => props.promoteShortcut && !layout.value.primary && layout.value.alternatives.length === 0,
)
const captionOnShortcuts = computed(() => layout.value.primary !== null && layout.value.alternatives.length === 0)
</script>

<template>
  <form ref="formElement" :action="action" :method="method" novalidate @submit="emit('submit', $event)">
    <input v-for="field in hiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

    <div class="divide-y divide-border/60">
      <div v-if="messages.length > 0 || $slots.notice" class="grid min-w-0 gap-3 p-4" data-kratos-section="messages">
        <KratosFlowMessages :messages="messages" />
        <slot name="notice" />
      </div>

      <div v-if="layout.primary || hasNoActions" class="grid min-w-0 gap-4 p-4" data-kratos-section="primary">
        <KratosFieldInput
          v-for="field in layout.primary?.fields ?? []"
          :id="field.key"
          :key="field.key"
          :model-value="values[field.name]"
          :name="field.name"
          :type="field.type"
          :label="field.label"
          :autocomplete="field.autocomplete"
          :required="field.required"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
          :error="errors[field.name]"
          :messages="field.messages"
          :autofocus="ready && field.key === firstFieldKey"
          size="lg"
          @update:model-value="emit('update:value', field.name, $event)"
        />
        <div v-if="layout.primary?.action || hasNoActions || layout.resend.length > 0" class="grid min-w-0 gap-2">
          <KratosActionButton
            v-if="layout.primary?.action"
            :action="layout.primary.action"
            :disabled="buttonsDisabled"
            @trigger="emit('trigger', $event)"
          />
          <Button v-else-if="hasNoActions" type="submit" size="lg" class="w-full" :disabled="!ready">
            {{ fallbackSubmitLabel }}
          </Button>
          <KratosActionButton
            v-for="item in layout.resend"
            :key="item.key"
            :action="item"
            :disabled="buttonsDisabled"
            @trigger="emit('trigger', $event)"
          />
        </div>
      </div>

      <div
        v-for="(block, index) in layout.alternatives"
        :key="block.action?.key ?? index"
        class="grid min-w-0 gap-4 p-4"
        data-kratos-section="alternative"
      >
        <p v-if="index === 0" class="text-xs text-muted-foreground">{{ alternativesLabel }}</p>
        <KratosFieldInput
          v-for="field in block.fields"
          :id="field.key"
          :key="field.key"
          :model-value="values[field.name]"
          :name="field.name"
          :type="field.type"
          :label="field.label"
          :autocomplete="field.autocomplete"
          :required="field.required"
          :disabled="field.disabled"
          :placeholder="field.placeholder"
          :error="errors[field.name]"
          :messages="field.messages"
          :autofocus="ready && field.key === firstFieldKey"
          size="lg"
          @update:model-value="emit('update:value', field.name, $event)"
        />
        <KratosActionButton
          v-if="block.action"
          :action="block.action"
          :disabled="buttonsDisabled"
          @trigger="emit('trigger', $event)"
        />
      </div>

      <div v-if="layout.shortcuts.length > 0" class="grid min-w-0 gap-2 p-4" data-kratos-section="shortcuts">
        <p v-if="captionOnShortcuts" class="pb-1 text-xs text-muted-foreground">{{ alternativesLabel }}</p>
        <KratosActionButton
          v-for="(item, index) in layout.shortcuts"
          :key="item.key"
          :action="item"
          :variant="promoteFirstShortcut && index === 0 ? 'default' : undefined"
          :disabled="buttonsDisabled"
          @trigger="emit('trigger', $event)"
        />
      </div>

      <div v-if="layout.back.length > 0" class="grid min-w-0 gap-2 px-4 py-2" data-kratos-section="back">
        <KratosActionButton
          v-for="item in layout.back"
          :key="item.key"
          :action="item"
          :disabled="buttonsDisabled"
          @trigger="emit('trigger', $event)"
        />
      </div>
    </div>
  </form>
</template>
