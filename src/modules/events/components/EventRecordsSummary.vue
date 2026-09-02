<script setup lang="ts">
export type EventRecordsSummaryItem = {
  key: string
  label: string
  value: string
}

/** A quiet strip of figures for the rows on screen, instead of a row of number cards. */
defineProps<{
  items: readonly EventRecordsSummaryItem[]
}>()
</script>

<template>
  <dl class="flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-md border bg-muted/20 px-4 py-3">
    <div v-for="item in items" :key="item.key" class="flex items-baseline gap-2">
      <dt class="text-xs text-muted-foreground">{{ item.label }}</dt>
      <dd class="text-base font-semibold tabular-nums">{{ item.value }}</dd>
    </div>
  </dl>
</template>
