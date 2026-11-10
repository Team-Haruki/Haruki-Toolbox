<script setup lang="ts">
import { Progress } from "@/components/ui/progress"

/**
 * One "label · bar · value" line. It renders as `display: contents`, so put
 * several inside a `grid grid-cols-[auto_1fr_auto]` and their labels and
 * values line up as columns. Without a value the bar takes that column too.
 */
defineProps<{
  label: string
  /** 0–100. */
  percent: number
  color: string | null
  value?: string | null
}>()
</script>

<template>
  <div class="contents" data-slot="training-meter">
    <span class="text-[11px] text-muted-foreground">{{ label }}</span>
    <Progress :model-value="percent" :color="color ?? undefined" :class="['h-1.5', value ? '' : 'col-span-2']" />
    <span v-if="value" class="text-right text-[11px] tabular-nums text-muted-foreground">{{ value }}</span>
  </div>
</template>
