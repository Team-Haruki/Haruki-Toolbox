<script setup lang="ts">
import { computed } from "vue"

export type SessionStripSegment = {
  key: string | number
  from: number
  to: number
  /** Hover text: when the session ran and for how long. */
  label: string
}

/**
 * A time band: filled where the player was scoring, empty where they were
 * not, so the rhythm of play and rest reads at a glance. Times are Unix
 * seconds; segments are clipped to the band.
 */
const props = defineProps<{
  start: number
  end: number
  segments: readonly SessionStripSegment[]
  /** Labels along the band, left to right. */
  ticks: readonly string[]
  label: string
  showTooltip: (event: MouseEvent, label: string) => void
  moveTooltip: (event: MouseEvent) => void
  hideTooltip: () => void
}>()

const blocks = computed(() => {
  const span = props.end - props.start
  if (span <= 0) {
    return []
  }
  return props.segments
    .filter((segment) => segment.to >= props.start && segment.from <= props.end)
    .map((segment) => {
      const from = Math.max(segment.from, props.start)
      const to = Math.min(segment.to, props.end)
      return {
        key: segment.key,
        label: segment.label,
        left: `${((from - props.start) / span) * 100}%`,
        width: `${((to - from) / span) * 100}%`,
      }
    })
})
</script>

<template>
  <div role="img" :aria-label="label">
    <div class="relative h-3 overflow-hidden rounded-full bg-muted">
      <span
        v-for="block in blocks"
        :key="block.key"
        class="absolute inset-y-0 min-w-0.5 rounded-full bg-primary hover:bg-primary/80"
        :style="{ left: block.left, width: block.width }"
        @mouseenter="showTooltip($event, block.label)"
        @mousemove="moveTooltip($event)"
        @mouseleave="hideTooltip"
      />
    </div>
    <div class="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground" aria-hidden="true">
      <span v-for="(tick, index) in ticks" :key="index">{{ tick }}</span>
    </div>
  </div>
</template>
