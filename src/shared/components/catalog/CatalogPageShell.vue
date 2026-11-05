<script setup lang="ts">
import { cn } from "@/lib/utils"
import PageHeader from "@/shared/components/PageHeader.vue"
import { useCatalogRegionQuerySync, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"

/**
 * Standard column for catalog list pages: title row with right-aligned
 * actions (the shared `PageHeader`), a toolbar row (region + search), the
 * filter panel, the results and a footer (pagination). Keeps every catalog
 * on the same container width and header rhythm.
 */
const props = withDefaults(defineProps<{
  title: string
  description?: string | null
  class?: string
}>(), {
  description: null,
  class: undefined,
})

// The address bar names the server in use (`?region=tw`), so a copied list
// link (filters included) opens the same data for the recipient.
useCatalogRegionQuerySync(useEffectiveCatalogRegion().region)
</script>

<template>
  <div :class="cn('mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4', props.class)">
    <PageHeader :title="title" :description="description">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </PageHeader>

    <!-- One row on every viewport: search stretches, the region select keeps its width. -->
    <div v-if="$slots.toolbar" class="flex flex-row items-center gap-2 sm:gap-3">
      <slot name="toolbar" />
    </div>

    <slot name="filters" />

    <slot />

    <slot name="footer" />
  </div>
</template>
