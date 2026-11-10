<script setup lang="ts">
import { computed } from "vue"
import { buildSparkline } from "../lib/stat-visuals"

/**
 * A word-sized trend line for a stat tile or a table cell: no axes, no
 * numbers, just the shape. It takes its colour from the text colour
 * (`class="text-primary"`), draws itself in once, and is hidden from
 * assistive tech unless `label` says what it shows.
 *
 *   <AdminSparkline :values="dailyUploads" class="text-primary" :label="t('…')" />
 */
const props = withDefaults(defineProps<{
  values: readonly number[]
  width?: number
  height?: number
  /** Soft fill under the line. */
  area?: boolean
  /** Accessible name; without it the sparkline is decorative. */
  label?: string
}>(), {
  width: 72,
  height: 24,
  area: true,
  label: undefined,
})

const geometry = computed(() => buildSparkline(props.values, props.width, props.height, 2.5))
</script>

<template>
  <svg
    v-if="geometry.line"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="admin-sparkline shrink-0 overflow-visible"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    data-slot="admin-sparkline"
  >
    <path v-if="area" :d="geometry.area" fill="currentColor" class="admin-sparkline-area" stroke="none" />
    <path
      :d="geometry.line"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="1"
      class="admin-sparkline-line"
    />
    <circle v-if="geometry.last" :cx="geometry.last.x" :cy="geometry.last.y" r="2" fill="currentColor" class="admin-sparkline-dot" />
  </svg>
</template>

<style scoped>
.admin-sparkline-area {
  opacity: 0.12;
}

@media (prefers-reduced-motion: no-preference) {
  .admin-sparkline-line {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: admin-sparkline-draw 0.9s ease-out forwards;
  }

  .admin-sparkline-area,
  .admin-sparkline-dot {
    animation: admin-sparkline-fade 0.5s ease-out 0.6s backwards;
  }
}

@keyframes admin-sparkline-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes admin-sparkline-fade {
  from {
    opacity: 0;
  }
}
</style>
