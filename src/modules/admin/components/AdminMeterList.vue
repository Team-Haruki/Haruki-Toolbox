<script setup lang="ts">
import { ref, watch } from "vue"
import { Skeleton } from "@/components/ui/skeleton"
import { sharePercent } from "../lib/stat-visuals"

export type AdminMeterItem = {
  key: string
  label: string
  /** The magnitude the bar encodes. */
  value: number
  /** Formatted figure on the right ("1,204 · 38%"). Defaults to the value. */
  text?: string
  /** A CSS colour for this bar; the theme's primary otherwise. */
  color?: string
}

/**
 * A ranked breakdown: one line per item with its figure and a bar for its
 * share of `total` (or of the largest item when `total` is omitted). The
 * bars grow in once. Put it inside an `AdminPanel`.
 */
const props = withDefaults(defineProps<{
  items: readonly AdminMeterItem[]
  total?: number
  loading?: boolean
  emptyText?: string
}>(), {
  total: undefined,
  loading: false,
  emptyText: "",
})

// Bars start at zero width and take their share a frame after the list is
// first on screen, so the width transition plays once: on mount when the
// data is already there, or when it arrives later (after a loading state).
const grown = ref(false)
watch(
  () => !props.loading && props.items.length > 0,
  (ready) => {
    if (!ready || grown.value || typeof requestAnimationFrame === "undefined") {
      return
    }
    // Two frames: the first paints the zero-width bars the transition starts from.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        grown.value = true
      })
    })
  },
  { immediate: true },
)

function width(item: AdminMeterItem): string {
  if (!grown.value) {
    return "0%"
  }
  const base = props.total ?? Math.max(0, ...props.items.map((entry) => entry.value))
  return `${sharePercent(item.value, base)}%`
}
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-2.5">
    <Skeleton v-for="index in 3" :key="index" class="h-6 w-full" />
  </div>
  <p v-else-if="items.length === 0" class="py-4 text-center text-xs text-muted-foreground">{{ emptyText }}</p>
  <ul v-else class="flex flex-col gap-2.5" role="list" data-slot="admin-meter-list">
    <li v-for="item in items" :key="item.key" class="flex flex-col gap-1">
      <div class="flex items-baseline justify-between gap-3 text-xs">
        <span class="min-w-0 truncate" :title="item.label">{{ item.label }}</span>
        <span class="shrink-0 tabular-nums text-muted-foreground">{{ item.text ?? item.value }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          class="h-full rounded-full bg-primary/70 transition-[width] duration-700 ease-out motion-reduce:transition-none"
          :style="{ width: width(item), ...(item.color ? { backgroundColor: item.color } : {}) }"
        />
      </div>
    </li>
  </ul>
</template>
