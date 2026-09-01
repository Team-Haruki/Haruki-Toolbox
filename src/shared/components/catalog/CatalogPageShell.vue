<script setup lang="ts">
import { cn } from "@/lib/utils"

/**
 * Standard column for catalog list pages: title row with right-aligned
 * actions, a toolbar row (region + search), the filter panel, the results
 * and a footer (pagination). Keeps every catalog on the same container
 * width and header rhythm.
 */
const props = withDefaults(defineProps<{
  title: string
  description?: string | null
  class?: string
}>(), {
  description: null,
  class: undefined,
})
</script>

<template>
  <div :class="cn('mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4', props.class)">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold">{{ title }}</h1>
        <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <!-- One row on every viewport: search stretches, the region select keeps its width. -->
    <div v-if="$slots.toolbar" class="flex flex-row items-center gap-2 sm:gap-3">
      <slot name="toolbar" />
    </div>

    <slot name="filters" />

    <slot />

    <slot name="footer" />
  </div>
</template>
