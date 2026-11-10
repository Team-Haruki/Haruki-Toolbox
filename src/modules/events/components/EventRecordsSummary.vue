<script setup lang="ts">
export type EventRecordsSummaryItem = {
  key: string
  label: string
  value: string
}

/**
 * The figures for the rows on screen as one line of label-over-number cells.
 * It sits at the top of the trend card, so it carries no box of its own.
 */
defineProps<{
  items: readonly EventRecordsSummaryItem[]
}>()
</script>

<template>
  <dl class="grid grid-cols-3 gap-x-3 gap-y-2 border-b border-border/60 pb-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3" data-testid="event-records-summary">
    <div v-for="item in items" :key="item.key" class="flex min-w-0 flex-col gap-0.5 sm:min-w-24" :data-stat="item.key">
      <dt class="truncate text-[11px] text-muted-foreground">{{ item.label }}</dt>
      <dd class="text-sm font-semibold leading-tight tabular-nums sm:text-xl">{{ item.value }}</dd>
    </div>
  </dl>
</template>
