<script setup lang="ts">
import type { SekaiRegion } from "@/types/store"

/**
 * A server as a two-letter tile in its own accent (the same accents the
 * account pickers use), followed by its name.
 */
const props = defineProps<{
  server: string
  label: string
}>()

const REGION_BADGE_CLASSES: Record<SekaiRegion, string> = {
  jp: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  en: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  tw: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  kr: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  cn: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
}

function badgeClass(server: string): string {
  return REGION_BADGE_CLASSES[server as SekaiRegion] ?? "bg-muted text-muted-foreground"
}
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-1.5">
    <span
      :class="['flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold', badgeClass(props.server)]"
      aria-hidden="true"
    >
      {{ props.server.slice(0, 2).toUpperCase() }}
    </span>
    <span class="truncate text-xs text-muted-foreground">{{ props.label }}</span>
  </span>
</template>
