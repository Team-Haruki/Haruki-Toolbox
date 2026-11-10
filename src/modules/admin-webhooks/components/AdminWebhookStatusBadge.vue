<script setup lang="ts">
import { LucideBan, LucideCheckCircle2, LucideTriangleAlert } from "lucide-vue-next"

/**
 * A state chip: green with a check when `active`, otherwise grey with a
 * "stopped" mark, or amber with a warning mark for a state that needs
 * attention (`inactiveTone="warning"`, e.g. a missing secret). The label
 * always says what the state is.
 */
const props = withDefaults(defineProps<{
  active: boolean
  label: string
  inactiveTone?: "muted" | "warning"
}>(), {
  inactiveTone: "muted",
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
      props.active
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
        : props.inactiveTone === 'warning'
          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
          : 'bg-muted text-muted-foreground',
    ]"
  >
    <LucideCheckCircle2 v-if="props.active" class="size-3 shrink-0" aria-hidden="true" />
    <LucideTriangleAlert v-else-if="props.inactiveTone === 'warning'" class="size-3 shrink-0" aria-hidden="true" />
    <LucideBan v-else class="size-3 shrink-0" aria-hidden="true" />
    {{ props.label }}
  </span>
</template>
