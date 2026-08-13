<script lang="ts" setup>
import { computed } from "vue"
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"
import { useMediaQuery } from "@vueuse/core"
import { useSettingsStore } from "@/shared/stores/settings"

const props = defineProps<ToasterProps>()

const settingsStore = useSettingsStore()
const systemDark = useMediaQuery("(prefers-color-scheme: dark)")
const isDark = computed(
  () => settingsStore.theme === "dark" || (settingsStore.theme === "system" && systemDark.value),
)

// These vars must live in an inline style to beat sonner's own theme CSS, so
// the dark palette has to be swapped here — a `.dark .toaster` stylesheet
// rule can never override an inline custom property.
const LIGHT_RICH_VARS = {
  "--success-border": "color-mix(in oklab, oklch(0.68 0.18 150) 62%, white 38%)",
  "--success-text": "oklch(0.34 0.14 150)",
  "--info-border": "color-mix(in oklab, oklch(0.62 0.17 245) 60%, white 40%)",
  "--info-text": "oklch(0.38 0.15 245)",
  "--warning-border": "color-mix(in oklab, oklch(0.74 0.16 82) 62%, white 38%)",
  "--warning-text": "oklch(0.44 0.13 70)",
  "--error-border": "color-mix(in oklab, oklch(0.62 0.21 28) 62%, white 38%)",
  "--error-text": "oklch(0.42 0.18 28)",
} as const

const DARK_RICH_VARS = {
  "--success-border": "oklch(0.72 0.18 150 / 0.36)",
  "--success-text": "oklch(0.80 0.18 150)",
  "--info-border": "oklch(0.70 0.15 245 / 0.34)",
  "--info-text": "oklch(0.78 0.14 245)",
  "--warning-border": "oklch(0.78 0.16 82 / 0.38)",
  "--warning-text": "oklch(0.84 0.16 82)",
  "--error-border": "oklch(0.70 0.18 28 / 0.36)",
  "--error-text": "oklch(0.78 0.18 28)",
} as const

const toasterStyle = computed(() => ({
  "--normal-bg": "color-mix(in oklab, var(--popover) 24%, transparent)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": isDark.value
    ? "color-mix(in oklab, var(--border) 82%, white 18%)"
    : "color-mix(in oklab, var(--border) 72%, white 28%)",
  "--success-bg": "color-mix(in oklab, var(--popover) 22%, oklch(0.78 0.17 150 / 0.24))",
  "--info-bg": "color-mix(in oklab, var(--popover) 22%, oklch(0.72 0.15 245 / 0.24))",
  "--warning-bg": "color-mix(in oklab, var(--popover) 22%, oklch(0.84 0.15 82 / 0.25))",
  "--error-bg": "color-mix(in oklab, var(--popover) 22%, oklch(0.74 0.19 28 / 0.24))",
  ...(isDark.value ? DARK_RICH_VARS : LIGHT_RICH_VARS),
}))
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :theme="props.theme ?? settingsStore.theme"
    :style="toasterStyle"
  />
</template>

<style>
.toaster [data-sonner-toast][data-styled='true'] [data-button][data-action] {
  border: 1px solid color-mix(in oklab, var(--primary) 82%, var(--background) 18%);
  background: var(--primary);
  color: var(--primary-foreground);
  font-weight: 700;
  box-shadow: 0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent);
}

.toaster [data-sonner-toast][data-styled='true'] [data-button][data-action]:hover {
  background: color-mix(in oklab, var(--primary) 90%, var(--background) 10%);
}

.toaster [data-sonner-toast][data-styled='true'] [data-button][data-action]:focus-visible {
  box-shadow:
    0 0 0 2px var(--background),
    0 0 0 4px color-mix(in oklab, var(--primary) 58%, transparent);
}
</style>
