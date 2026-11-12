<script setup lang="ts">
export type MiniHistogramBar = {
  key: string | number
  /** 0–1 of the tallest bar. */
  ratio: number
  /** Hover text: the bin's range and count. */
  label: string
  /** The bar the reader should find first (the latest game, the player's own pace). */
  highlighted?: boolean
}

export type MiniHistogramMarker = {
  key: string
  /** 0–1 across the axis. */
  position: number
  label: string
}

/**
 * A compact distribution: one bar per bin, the highlighted one in the full
 * hue and the rest dimmed, with optional labelled marker lines (a median) and
 * the axis ends named underneath. Each column, not just the bar, is the hover
 * target, so short bars are as easy to hit as tall ones.
 */
defineProps<{
  bars: readonly MiniHistogramBar[]
  markers?: readonly MiniHistogramMarker[]
  axisStart: string
  axisEnd: string
  /** What the chart shows, for screen readers. */
  label: string
  showTooltip: (event: MouseEvent, label: string) => void
  moveTooltip: (event: MouseEvent) => void
  hideTooltip: () => void
}>()
</script>

<template>
  <div role="img" :aria-label="label">
    <div :class="['relative flex h-20 items-end gap-0.5', markers?.length ? 'mt-4' : '']">
      <div
        v-for="bar in bars"
        :key="bar.key"
        class="group flex h-full min-w-0 flex-1 items-end"
        @mouseenter="showTooltip($event, bar.label)"
        @mousemove="moveTooltip($event)"
        @mouseleave="hideTooltip"
      >
        <span
          :class="[
            'w-full rounded-t-[3px] transition-colors',
            bar.highlighted ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/55',
          ]"
          :style="{ height: bar.ratio > 0 ? `${Math.max(bar.ratio * 100, 3)}%` : '0' }"
        />
      </div>
      <span
        v-for="marker in markers"
        :key="marker.key"
        class="pointer-events-none absolute -top-4 bottom-0 border-l border-dashed border-foreground/60"
        :style="{ left: `${Math.min(1, Math.max(0, marker.position)) * 100}%` }"
      >
        <span
          :class="[
            'absolute top-0 text-[10px] leading-none whitespace-nowrap text-muted-foreground',
            marker.position > 0.7 ? 'right-1' : 'left-1',
          ]"
        >
          {{ marker.label }}
        </span>
      </span>
    </div>
    <div class="flex justify-between border-t border-border/60 pt-1 text-[10px] tabular-nums text-muted-foreground" aria-hidden="true">
      <span>{{ axisStart }}</span>
      <span>{{ axisEnd }}</span>
    </div>
  </div>
</template>
