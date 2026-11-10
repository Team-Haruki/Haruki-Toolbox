<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { useResizeObserver } from "@vueuse/core"
import { VisArea, VisAxis, VisCrosshair, VisLine, VisScatter, VisTooltip, VisXYContainer } from "@unovis/vue"
import { formatNumberCN } from "@/lib/number-format"
import { buildCountAxis } from "@/modules/admin-statistics/lib/dashboard-chart-axes"
import type { TimeseriesPoint } from "@/types/admin"

/**
 * One measure of the statistics timeseries on its own y axis. The dashboard
 * stacks three of these (uploads, failed uploads, registrations) instead of
 * pairing two y scales in one plot: they share the x positions, so a day
 * lines up across the panels, and `hoverIndex` shows the crosshair of the
 * panel being pointed at in the other two as well.
 */
const props = withDefaults(defineProps<{
  points: readonly TimeseriesPoint[]
  /** The plotted measure. */
  value: (point: TimeseriesPoint) => number
  /** A CSS colour (the page's `--dash-*` series tokens). */
  color: string
  /** Label of a bucket on the x axis. */
  formatTick: (point: TimeseriesPoint) => string
  /** Tooltip content (HTML) for the bucket under the pointer. */
  tooltip: (point: TimeseriesPoint) => string
  /** Bucket index hovered in a sibling chart. */
  hoverIndex?: number
  height?: number
}>(), {
  hoverIndex: undefined,
  height: 168,
})

const emit = defineEmits<{ hover: [index: number | undefined] }>()

// Fixed margins: the stacked charts must share their x scale. The left side
// holds the y labels ("2,000"); the right side half of the last x label.
const MARGIN = { top: 8, right: 30, bottom: 26, left: 46 } as const

const wrapEl = useTemplateRef<HTMLElement>("wrap")
const width = ref(0)
useResizeObserver(wrapEl, (entries) => {
  const rect = entries[0]?.contentRect
  if (rect) {
    width.value = rect.width
  }
})

const data = computed(() => [...props.points])
const axis = computed(() => buildCountAxis(props.points.map((point) => props.value(point))))

const x = (_point: TimeseriesPoint, index: number) => index
const y = (point: TimeseriesPoint) => props.value(point)

// A date label is ~56 px wide; ticks sit on evenly spaced buckets, the last
// bucket always among them.
const xTickValues = computed(() => {
  const count = props.points.length
  if (count === 0) return []
  const plotWidth = Math.max(0, (width.value || 640) - MARGIN.left - MARGIN.right)
  const slots = Math.max(2, Math.min(count, 8, Math.floor(plotWidth / 76) + 1))
  if (count <= slots) return props.points.map((_, index) => index)
  const step = (count - 1) / (slots - 1)
  return Array.from({ length: slots }, (_, index) => Math.round(index * step))
})

function xTickFormat(tick: number | Date) {
  const index = Number(tick)
  const point = Number.isInteger(index) ? props.points[index] : undefined
  return point ? props.formatTick(point) : ""
}

function yTickFormat(tick: number | Date) {
  return formatNumberCN(Number(tick))
}

// The bucket under the pointer comes from the pointer's own x: while a sibling's
// crosshair is mirrored here, the datum unovis reports is the mirrored one.
function onCrosshairMove(pointerX?: number | Date) {
  const position = typeof pointerX === "number" ? Math.round(pointerX) : Number.NaN
  emit("hover", Number.isFinite(position) && props.points.length > 0
    ? Math.min(props.points.length - 1, Math.max(0, position))
    : undefined)
}

// A sibling's hover shows this chart's crosshair without a second tooltip.
function crosshairTemplate(point: TimeseriesPoint) {
  return props.hoverIndex === undefined ? props.tooltip(point) : ""
}

// Few buckets (a weekly or monthly view) need their points marked: a line
// through two or three values hides where the values are.
const showMarkers = computed(() => props.points.length <= 12)

const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
</script>

<template>
  <div ref="wrap" class="dashboard-trend-chart min-w-0" :style="{ height: `${height}px` }">
    <VisXYContainer
      :data="data"
      :height="height"
      :margin="MARGIN"
      :autoMargin="false"
      :yDomain="[0, axis.max]"
      :duration="reduceMotion ? 0 : 500"
    >
      <VisArea :x="x" :y="y" :color="color" :opacity="0.1" curveType="monotoneX" />
      <VisLine :x="x" :y="y" :color="color" :lineWidth="2" curveType="monotoneX" />
      <VisScatter v-if="showMarkers" :x="x" :y="y" :color="color" :size="8" strokeColor="var(--card)" :strokeWidth="2" />
      <!-- Unovis derives the crosshair's snapping from its own accessors, not from the sibling line.
           Its options are forwarded as attrs, which keep their spelling: camelCase, or they are ignored. -->
      <VisCrosshair
        :x="x"
        :y="y"
        :color="color"
        :template="crosshairTemplate"
        :forceShowAt="hoverIndex"
        :onCrosshairMove="onCrosshairMove"
      />
      <VisTooltip />
      <VisAxis type="x" :tickValues="xTickValues" :tickFormat="xTickFormat" :gridLine="false" :tickLine="false" />
      <VisAxis type="y" :tickValues="axis.ticks" :tickFormat="yTickFormat" :domainLine="false" :tickLine="false" />
    </VisXYContainer>
  </div>
</template>

<style scoped>
/* The plot draws in from the left once, when the chart appears. */
@media (prefers-reduced-motion: no-preference) {
  .dashboard-trend-chart {
    animation: dashboard-trend-reveal 0.9s ease-out backwards;
  }
}

@keyframes dashboard-trend-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}
</style>
