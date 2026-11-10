<script setup lang="ts">
import type { Component } from "vue"

export type UserChipTone = "default" | "primary" | "success" | "warning" | "info" | "danger"

/**
 * The small tinted label the user pages use for a role, a status or a flag:
 * an optional icon and a short word. The tone only colours it; the word says
 * what the state is.
 */
withDefaults(defineProps<{
  tone?: UserChipTone
  icon?: Component
}>(), {
  tone: "default",
  icon: undefined,
})

const TONE_CLASS: Record<UserChipTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  danger: "bg-destructive/15 text-destructive-tint-foreground",
}
</script>

<template>
  <span
    :class="['inline-flex max-w-full shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap', TONE_CLASS[tone]]"
    data-slot="user-chip"
  >
    <component :is="icon" v-if="icon" class="size-3 shrink-0" aria-hidden="true" />
    <span class="min-w-0 truncate"><slot /></span>
  </span>
</template>
