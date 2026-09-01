<script setup lang="ts">
import { computed, ref } from "vue"
import { ChevronDown, Filter, RotateCcw } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const props = withDefaults(defineProps<{
  title: string
  /** Result-count line shown in the header / footer (already translated). */
  countLabel?: string | null
  resetLabel: string
  /** Start collapsed (e.g. to save vertical space on smaller catalogs). */
  defaultCollapsed?: boolean
  /** Number of active filters, shown as a badge next to the title. */
  activeCount?: number | null
  /** Wrapper class for the fields. Defaults to a responsive select grid;
   *  pass a flex column for catalogs whose filters are full-width chip rows. */
  contentClass?: string
}>(), {
  countLabel: null,
  defaultCollapsed: false,
  activeCount: null,
  contentClass: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
})

const emit = defineEmits<{ reset: [] }>()

const expanded = ref(!props.defaultCollapsed)
const showActiveBadge = computed(() => props.activeCount != null && props.activeCount > 0)
</script>

<template>
  <section class="grid gap-3 rounded-md border bg-muted/20 p-3" data-slot="catalog-filter-panel">
    <button
      type="button"
      class="flex items-center gap-2 text-left text-sm font-medium"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <Filter class="size-4 shrink-0 text-muted-foreground" />
      <span>{{ title }}</span>
      <Badge v-if="showActiveBadge" size="sm" class="tabular-nums">{{ activeCount }}</Badge>
      <span v-if="countLabel && !expanded" class="min-w-0 truncate text-xs font-normal text-muted-foreground">
        · {{ countLabel }}
      </span>
      <ChevronDown
        class="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="expanded ? '' : '-rotate-90'"
      />
    </button>

    <template v-if="expanded">
      <div :class="contentClass">
        <slot />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">{{ countLabel }}</p>
        <Button type="button" variant="ghost" size="sm" :disabled="activeCount != null && activeCount === 0" @click="emit('reset')">
          <RotateCcw class="size-4" />
          {{ resetLabel }}
        </Button>
      </div>
    </template>
  </section>
</template>
