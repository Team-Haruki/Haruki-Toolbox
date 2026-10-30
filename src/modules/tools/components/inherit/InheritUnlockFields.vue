<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { ExternalLink, LucideAlertTriangle } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FieldError from "@/shared/components/FieldError.vue"
import type { InheritUnlockState } from "@/modules/tools/composables/useInheritUnlock"

/**
 * The sign-in password or vault PIN input of a step-up, with the PIN
 * repeat on first use, the previous-password field after a password
 * change, and the "forgot it?" way out. The state lives in
 * useInheritUnlock; edits go up as events.
 */
const props = withDefaults(defineProps<{
  state: InheritUnlockState
  idPrefix: string
  disabled?: boolean
  /** Offers the vault reset for a forgotten PIN or previous password. */
  allowReset?: boolean
}>(), {
  disabled: false,
  allowReset: true,
})

const emit = defineEmits<{
  (event: "update", field: "secret" | "repeat" | "previousPassword", value: string): void
  (event: "submit"): void
  (event: "reset-vault"): void
}>()

const { t } = useI18n()

const isPin = computed(() => props.state.kind === "pin")

const secretLabel = computed(() => {
  if (isPin.value) {
    return props.state.creating ? t("tools.uploadData.inheritJob.confirm.pinCreate") : t("tools.uploadData.inheritJob.confirm.pin")
  }
  return t("tools.uploadData.inheritJob.confirm.password")
})

/** Which secret this is, read before typing. */
const secretWhich = computed(() => {
  if (isPin.value) {
    return props.state.creating ? t("tools.uploadData.inheritJob.confirm.pinCreateHint") : t("tools.uploadData.inheritJob.confirm.pinHint")
  }
  return t("tools.uploadData.inheritJob.confirm.passwordHelp")
})

/** Why it is needed. */
const secretWhy = computed(() => {
  if (isPin.value) return props.state.creating ? t("tools.uploadData.inheritJob.confirm.pinCreateWhy") : ""
  return props.state.initialized ? t("tools.uploadData.inheritJob.confirm.passwordWhy") : t("tools.uploadData.inheritJob.confirm.passwordFirstUse")
})

const passwordSettingsRoute = { name: "user.identityPasswordSettings" } as const

const ids = computed(() => ({
  secret: `${props.idPrefix}-secret`,
  secretError: `${props.idPrefix}-secret-error`,
  secretHint: `${props.idPrefix}-secret-hint`,
  secretWhy: `${props.idPrefix}-secret-why`,
  repeat: `${props.idPrefix}-repeat`,
  repeatError: `${props.idPrefix}-repeat-error`,
  previous: `${props.idPrefix}-previous`,
  previousError: `${props.idPrefix}-previous-error`,
}))

const secretDescribedBy = computed(() => [
  props.state.secretError ? ids.value.secretError : "",
  ids.value.secretHint,
  secretWhy.value ? ids.value.secretWhy : "",
].filter(Boolean).join(" "))

function update(field: "secret" | "repeat" | "previousPassword", value: string | number) {
  emit("update", field, String(value))
}

// Enter submits from the inputs only; a focused button or link (the vault
// reset, "forgot password") keeps its native activation.
function onEnter(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLInputElement)) return
  event.preventDefault()
  if (!props.disabled) emit("submit")
}
</script>

<template>
  <div class="space-y-3" data-testid="inherit-unlock" :data-kind="state.kind" :data-creating="state.creating ? 'true' : 'false'" @keydown.enter="onEnter">
    <div class="space-y-1.5">
      <div class="space-y-0.5">
        <Label :for="ids.secret">{{ secretLabel }}</Label>
        <p :id="ids.secretHint" class="text-xs text-muted-foreground">{{ secretWhich }}</p>
      </div>
      <Input
        :id="ids.secret"
        type="password"
        :autocomplete="isPin ? (state.creating ? 'new-password' : 'off') : 'current-password'"
        :model-value="state.secret"
        :disabled="disabled"
        :aria-invalid="state.secretError ? 'true' : undefined"
        :aria-describedby="secretDescribedBy"
        @update:model-value="update('secret', $event)"
      />
      <FieldError :id="ids.secretError" :message="state.secretError" />
      <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs">
        <p v-if="secretWhy" :id="ids.secretWhy" class="min-w-0 flex-1 text-muted-foreground">{{ secretWhy }}</p>
        <RouterLink
          v-if="!isPin"
          :to="passwordSettingsRoute"
          target="_blank"
          rel="noopener"
          class="inline-flex shrink-0 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          data-testid="inherit-unlock-forgot-password"
        >
          {{ t("tools.uploadData.inheritJob.confirm.forgotPassword") }}
          <ExternalLink class="size-3" aria-hidden="true" />
        </RouterLink>
      </div>
      <p v-if="!isPin && state.initialized" class="text-xs text-muted-foreground">
        {{ t("tools.uploadData.inheritJob.confirm.forgotPasswordNote") }}
      </p>
    </div>

    <div v-if="isPin && state.creating" class="space-y-1.5">
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
      <p class="flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <LucideAlertTriangle class="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {{ t("tools.uploadData.inheritJob.confirm.pinCreateWarning") }}
      </p>
    </div>

    <div
      v-if="isPin && !state.creating && allowReset"
      class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      data-testid="inherit-unlock-forgot-pin"
    >
      <span>{{ t("tools.uploadData.inheritJob.confirm.forgotPin") }}</span>
      <Button type="button" variant="link" size="sm" class="h-auto p-0 text-xs" :disabled="disabled" @click="emit('reset-vault')">
        {{ t("tools.uploadData.inheritVault.passwordChanged.resetAction") }}
      </Button>
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
