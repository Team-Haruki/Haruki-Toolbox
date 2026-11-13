<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideLoader2, LucideX } from "lucide-vue-next"
import LightboxToolButton from "./LightboxToolButton.vue"

/**
 * The bottom of the viewer: one round bar of tools and, for a mode whose
 * controls need more than a row, a panel right above it. A mode's bar ends
 * with Cancel and its confirm button unless it fills `actions` itself; the
 * main bar has neither (`plain`).
 */
withDefaults(defineProps<{
  /** Names the bar for assistive technology. */
  label: string
  /** No Cancel / confirm pair at the end. */
  plain?: boolean
  confirmLabel?: string | null
  confirmDisabled?: boolean
  confirmPending?: boolean
  confirmTestid?: string | null
}>(), {
  plain: false,
  confirmLabel: null,
  confirmDisabled: false,
  confirmPending: false,
  confirmTestid: null,
})

defineEmits<{
  cancel: []
  confirm: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="$slots.panel"
      class="mx-auto w-full max-w-md rounded-2xl bg-white/10 p-3 backdrop-blur-md"
      data-testid="image-viewer-panel"
    >
      <slot name="panel" />
    </div>
    <div
      class="mx-auto flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-white/10 p-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="toolbar"
      :aria-label="label"
      data-testid="image-viewer-toolbar"
    >
      <slot />
      <slot v-if="!plain" name="actions">
        <LightboxToolButton variant="text" data-testid="image-viewer-mode-cancel" @click="$emit('cancel')">
          <LucideX class="size-4" aria-hidden="true" />
          {{ t("common.cancel") }}
        </LightboxToolButton>
        <LightboxToolButton
          variant="primary"
          :disabled="confirmDisabled || confirmPending"
          :data-testid="confirmTestid ?? 'image-viewer-mode-confirm'"
          @click="$emit('confirm')"
        >
          <LucideLoader2 v-if="confirmPending" class="size-4 animate-spin" aria-hidden="true" />
          <LucideCheck v-else class="size-4" aria-hidden="true" />
          {{ confirmLabel ?? t("catalog.lightbox.apply") }}
        </LightboxToolButton>
      </slot>
    </div>
  </div>
</template>
