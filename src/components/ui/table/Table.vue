<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

// Horizontal-overflow affordance. macOS overlay scrollbars hide that a wide
// table scrolls sideways, so the scroll container gets a thin scrollbar that
// is always visible and a shadow on whichever edge still hides content. A
// table that fits renders nothing extra: both flags stay false and only the
// ResizeObserver (which fires on size changes alone) stays attached.
const container = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateEdges() {
  const el = container.value
  if (!el) return
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  // 1px tolerance: fractional layout widths can leave the sum a pixel short.
  const left = maxScrollLeft > 1 && el.scrollLeft > 1
  const right = maxScrollLeft > 1 && el.scrollLeft < maxScrollLeft - 1
  if (left !== canScrollLeft.value) canScrollLeft.value = left
  if (right !== canScrollRight.value) canScrollRight.value = right
}

let observer: ResizeObserver | null = null

onMounted(() => {
  const el = container.value
  if (!el) return
  updateEdges()
  if (typeof ResizeObserver === "undefined") return
  observer = new ResizeObserver(updateEdges)
  observer.observe(el)
  // The table itself grows and shrinks with its rows and columns.
  const table = el.firstElementChild
  if (table) observer.observe(table)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div data-slot="table-shell" class="relative w-full min-w-0 max-w-full">
    <div
      ref="container"
      data-slot="table-container"
      class="table-scroll relative w-full overflow-auto"
      @scroll.passive="updateEdges"
    >
      <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
        <slot />
      </table>
    </div>
    <div
      v-if="canScrollLeft"
      aria-hidden="true"
      data-slot="table-edge-start"
      class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent dark:from-black/50"
    />
    <div
      v-if="canScrollRight"
      aria-hidden="true"
      data-slot="table-edge-end"
      class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent dark:from-black/50"
    />
  </div>
</template>

<style scoped>
/*
 * Thin scrollbar that stays visible even where the OS uses overlay scrollbars.
 * Chromium ignores the ::-webkit-scrollbar rules as soon as scrollbar-width or
 * scrollbar-color is set, so the standard properties only apply where the
 * pseudo-elements are unsupported (Firefox).
 */
@supports not selector(::-webkit-scrollbar) {
  .table-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
}

.table-scroll::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.table-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.table-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: var(--border);
}

.table-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--muted-foreground);
}
</style>
