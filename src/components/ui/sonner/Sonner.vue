<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'color-mix(in oklab, var(--popover) 24%, transparent)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'color-mix(in oklab, var(--border) 72%, white 28%)',
      '--success-bg': 'color-mix(in oklab, var(--popover) 22%, oklch(0.78 0.17 150 / 0.24))',
      '--success-border': 'color-mix(in oklab, oklch(0.68 0.18 150) 62%, white 38%)',
      '--success-text': 'oklch(0.34 0.14 150)',
      '--info-bg': 'color-mix(in oklab, var(--popover) 22%, oklch(0.72 0.15 245 / 0.24))',
      '--info-border': 'color-mix(in oklab, oklch(0.62 0.17 245) 60%, white 40%)',
      '--info-text': 'oklch(0.38 0.15 245)',
      '--warning-bg': 'color-mix(in oklab, var(--popover) 22%, oklch(0.84 0.15 82 / 0.25))',
      '--warning-border': 'color-mix(in oklab, oklch(0.74 0.16 82) 62%, white 38%)',
      '--warning-text': 'oklch(0.44 0.13 70)',
      '--error-bg': 'color-mix(in oklab, var(--popover) 22%, oklch(0.74 0.19 28 / 0.24))',
      '--error-border': 'color-mix(in oklab, oklch(0.62 0.21 28) 62%, white 38%)',
      '--error-text': 'oklch(0.42 0.18 28)',
    }"
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
