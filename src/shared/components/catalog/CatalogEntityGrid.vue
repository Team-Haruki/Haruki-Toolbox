<script setup lang="ts">
import { computed } from "vue"
import { cn } from "@/lib/utils"

/**
 * Responsive grids shared by every catalog: `cards` (square thumbnails),
 * `tiles` (banner tiles), `wide` (jacket / medium tiles), `thumbs` (dense
 * thumbnail strips).
 */
const props = withDefaults(defineProps<{
  columns?: "cards" | "tiles" | "wide" | "thumbs"
  class?: string
}>(), {
  columns: "cards",
  class: undefined,
})

const gridClass = computed(() => {
  switch (props.columns) {
    case "tiles":
      return "grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    case "wide":
      return "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    case "thumbs":
      return "grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
    default:
      return "grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
  }
})
</script>

<template>
  <div :class="cn('grid', gridClass, props.class)" data-slot="catalog-entity-grid">
    <slot />
  </div>
</template>
