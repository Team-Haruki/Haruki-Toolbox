<script setup lang="ts" generic="S extends SettingsActionSubmit, B extends SettingsActionButton">
import { Button } from "@/components/ui/button"
import { classifySettingsAction } from "@/modules/user-settings/lib/kratos-settings-groups"
import type { SettingsActionButton, SettingsActionSubmit } from "@/modules/user-settings/lib/kratos-settings-groups"

// The non-destructive buttons of one settings group, in Kratos order: its
// trigger buttons (add a passkey or a security key, which run Kratos'
// webauthn.js) and its submits. A submit that saves what was typed is the
// filled one; the rest are outline. Submits keep the node's name and value,
// which is what the Kratos form posts.
defineProps<{
  buttons: readonly B[]
  submits: readonly S[]
  /** False until the flow is loaded: submits stay disabled. */
  ready: boolean
}>()

const emit = defineEmits<{ trigger: [button: B] }>()
</script>

<template>
  <Button
    v-for="button in buttons"
    :key="button.key"
    type="button"
    variant="outline"
    size="sm"
    class="h-auto min-h-8 max-w-full whitespace-normal py-1"
    :name="button.name"
    :value="button.value || undefined"
    :disabled="button.disabled"
    @click="emit('trigger', button)"
  >
    {{ button.label }}
  </Button>
  <Button
    v-for="submit in submits"
    :key="submit.key"
    type="submit"
    size="sm"
    class="h-auto min-h-8 max-w-full whitespace-normal py-1"
    :variant="classifySettingsAction(submit) === 'commit' ? 'default' : 'outline'"
    :name="submit.name || undefined"
    :value="submit.value || undefined"
    :data-settings-submit="submit.key"
    :disabled="!ready || submit.disabled"
  >
    {{ submit.label }}
  </Button>
</template>
