<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideAlertTriangle } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FieldError from "@/shared/components/FieldError.vue"
import type { InheritUnlockState } from "@/modules/tools/composables/useInheritUnlock"

/**
 * The Toolbox password or vault PIN input of a step-up, with the PIN
 * repeat on first use and the previous-password field after a password
 * change. The state lives in useInheritUnlock; edits go up as events.
 */
const props = withDefaults(defineProps<{
  state: InheritUnlockState
  idPrefix: string
  disabled?: boolean
  /** Explains that a first-time password creates the vault. */
  firstUse?: boolean
  /** Offers the vault reset next to the previous-password field. */
  allowReset?: boolean
}>(), {
  disabled: false,
  firstUse: false,
  allowReset: true,
})

const emit = defineEmits<{
  (event: "update", field: "secret" | "repeat" | "previousPassword", value: string): void
  (event: "submit"): void
  (event: "reset-vault"): void
}>()

const { t } = useI18n()

const secretLabel = computed(() => {
  if (props.state.kind === "pin") {
    return props.state.creating ? t("tools.uploadData.inheritJob.confirm.pinCreate") : t("tools.uploadData.inheritJob.confirm.pin")
  }
  return t("tools.uploadData.inheritJob.confirm.password")
})

const secretHint = computed(() => {
  if (props.state.kind === "pin") {
    return props.state.creating ? t("tools.uploadData.inheritJob.confirm.pinCreateHint") : t("tools.uploadData.inheritJob.confirm.pinHint")
  }
  return props.firstUse ? t("tools.uploadData.inheritJob.confirm.passwordFirstUse") : t("tools.uploadData.inheritJob.confirm.passwordHint")
})

const ids = computed(() => ({
  secret: `${props.idPrefix}-secret`,
  secretError: `${props.idPrefix}-secret-error`,
  secretHint: `${props.idPrefix}-secret-hint`,
  repeat: `${props.idPrefix}-repeat`,
  repeatError: `${props.idPrefix}-repeat-error`,
  previous: `${props.idPrefix}-previous`,
  previousError: `${props.idPrefix}-previous-error`,
}))

function update(field: "secret" | "repeat" | "previousPassword", value: string | number) {
  emit("update", field, String(value))
}

// Enter submits from the inputs only; a focused button (the vault reset)
// keeps its native activation.
function onEnter(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLInputElement)) return
  event.preventDefault()
  if (!props.disabled) emit("submit")
}
</script>

<template>
  <div class="space-y-3" @keydown.enter="onEnter">
    <div class="space-y-1.5">
      <Label :for="ids.secret">{{ secretLabel }}</Label>
      <Input
        :id="ids.secret"
        type="password"
        :autocomplete="state.kind === 'pin' ? (state.creating ? 'new-password' : 'off') : 'current-password'"
        :model-value="state.secret"
        :disabled="disabled"
        :aria-invalid="state.secretError ? 'true' : undefined"
        :aria-describedby="state.secretError ? ids.secretError : ids.secretHint"
        @update:model-value="update('secret', $event)"
      />
      <p :id="ids.secretHint" class="text-xs text-muted-foreground">{{ secretHint }}</p>
      <FieldError :id="ids.secretError" :message="state.secretError" />
    </div>

    <div v-if="state.kind === 'pin' && state.creating" class="space-y-1.5">
      <Label :for="ids.repeat">{{ t("tools.uploadData.inheritJob.confirm.pinRepeat") }}</Label>
      <Input
        :id="ids.repeat"
        type="password"
        autocomplete="new-password"
        :model-value="state.repeat"
        :disabled="disabled"
        :aria-invalid="state.repeatError ? 'true' : undefined"
        :aria-describedby="state.repeatError ? ids.repeatError : undefined"
        @update:model-value="update('repeat', $event)"
      />
      <FieldError :id="ids.repeatError" :message="state.repeatError" />
    </div>

    <div v-if="state.needsPrevious" class="space-y-3 rounded-lg border border-amber-500/50 bg-amber-500/5 p-3" role="group" :aria-labelledby="`${idPrefix}-previous-title`">
      <div class="flex items-start gap-2">
        <LucideAlertTriangle class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div class="space-y-1 text-sm">
          <p :id="`${idPrefix}-previous-title`" class="font-medium">{{ t("tools.uploadData.inheritVault.passwordChanged.title") }}</p>
          <p class="text-muted-foreground">{{ t("tools.uploadData.inheritVault.passwordChanged.description") }}</p>
        </div>
      </div>
      <div class="space-y-1.5">
        <Label :for="ids.previous">{{ t("tools.uploadData.inheritJob.confirm.previousPassword") }}</Label>
        <Input
          :id="ids.previous"
          type="password"
          autocomplete="off"
          :model-value="state.previousPassword"
          :disabled="disabled"
          :aria-invalid="state.previousError ? 'true' : undefined"
          :aria-describedby="state.previousError ? ids.previousError : undefined"
          @update:model-value="update('previousPassword', $event)"
        />
        <FieldError :id="ids.previousError" :message="state.previousError" />
      </div>
      <div v-if="allowReset" class="space-y-2 border-t pt-2 text-xs text-muted-foreground">
        <p>{{ t("tools.uploadData.inheritVault.passwordChanged.forgot") }}</p>
        <Button type="button" variant="outline" size="sm" :disabled="disabled" @click="emit('reset-vault')">
          {{ t("tools.uploadData.inheritVault.passwordChanged.resetAction") }}
        </Button>
      </div>
    </div>

    <p v-if="state.formError" role="alert" class="text-sm text-destructive">{{ state.formError }}</p>
  </div>
</template>
