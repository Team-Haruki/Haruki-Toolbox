<script setup lang="ts">
/**
 * One on/off option: its name on the left, the switch on the right. The text
 * is the switch's label, so tapping it toggles too. `help` is a visible line
 * for options where a wrong choice costs something; `hint` is detail few
 * people need, kept in the name's tooltip.
 */
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

defineProps<{
  id: string
  label: string
  help?: string
  hint?: string
  disabled?: boolean
}>()

const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <div class="flex items-start justify-between gap-4 py-3" data-slot="client-config-switch-row">
    <Label :for="id" class="min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 leading-normal font-normal">
      <span
        :class="['text-sm font-medium', hint ? 'underline decoration-muted-foreground/60 decoration-dotted underline-offset-4' : '']"
        :title="hint"
      >
        {{ label }}
      </span>
      <span v-if="help" class="text-xs leading-relaxed text-muted-foreground">{{ help }}</span>
    </Label>
    <Switch
      :id="id"
      class="mt-0.5"
      :model-value="checked"
      :disabled="disabled"
      @update:model-value="checked = Boolean($event)"
    />
  </div>
</template>
