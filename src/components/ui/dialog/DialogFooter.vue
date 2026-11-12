<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

/**
 * The dialog's fixed bottom bar. On phones the buttons share one row at equal
 * width (and wrap when a label is too long) instead of stacking, so the bar
 * stays one line tall.
 */
const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="cn('flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/60 px-4 py-3 sm:px-5 [&>button]:flex-1 sm:[&>button]:flex-none', props.class)"
  >
    <slot />
  </div>
</template>
