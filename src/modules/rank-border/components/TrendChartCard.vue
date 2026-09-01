<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Maximize2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { DETAIL_CHART_HEIGHT, DETAIL_CHART_WIDTH } from "../lib/rank-border-constants"
import { chartLabelTop } from "../lib/rank-border-chart"
import type { DetailMetricChart } from "../lib/detail-charts"
import type {
  RankBorderChartPoint,
  RankBorderChartTimeTick,
  RankBorderScoreOverlayLine,
} from "../lib/rank-border-types"

/**
 * One full-width trend chart card on the detail page: main series, up to a few
 * comparison overlays (colored via `comparisonMeta`), optional planner lines,
 * reference grid + hoverable sample points.
 */
withDefaults(defineProps<{
  title: string
  unitLabel: string
  svgClass: string
  chart: DetailMetricChart
  timeTicks: RankBorderChartTimeTick[]
  comparisonMeta: Array<{ key: string; label: string; color: string }>
  plannerLines?: RankBorderScoreOverlayLine[]
  /** Shows the expand button and emits `expand` when pressed. */
  expandable?: boolean
  /** Dialog-sized rendering: taller frame, no card chrome adjustments needed. */
  large?: boolean
  showTooltip: (event: MouseEvent, label: string) => void
  moveTooltip: (event: MouseEvent) => void
  hideTooltip: () => void
}>(), {
  plannerLines: () => [],
  expandable: false,
  large: false,
})
const emit = defineEmits<{ expand: [] }>()

const { t } = useI18n()

function pointStyle(point: RankBorderChartPoint) {
  return {
    left: `${(point.x / DETAIL_CHART_WIDTH) * 100}%`,
    top: `${(point.y / DETAIL_CHART_HEIGHT) * 100}%`,
  }
}
</script>

<template>
  <div :class="['rank-border-chart-card min-h-0 min-w-0 rounded-md border bg-background/70 p-2.5 sm:p-3', large ? 'rank-border-chart-card--large' : '']">
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <p class="text-sm font-medium">{{ title }}</p>
      <span class="inline-flex items-center gap-1.5">
        <span class="text-xs text-muted-foreground">{{ unitLabel }}</span>
        <Button
          v-if="expandable"
          type="button"
          variant="ghost"
          size="icon"
          class="size-6 text-muted-foreground"
          :aria-label="t('rankBorder.actions.expandChart')"
          @click="emit('expand')"
        >
          <Maximize2 class="size-3.5" />
        </Button>
      </span>
    </div>
    <div class="rank-border-chart-frame">
      <div class="rank-border-chart-plot">
        <svg
          :class="['rank-border-chart-svg', svgClass]"
          :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
          preserveAspectRatio="none"
          :aria-label="title"
        >
          <line
            v-for="line in chart.referenceLines"
            :key="`grid-${line.value}`"
            class="rank-border-chart-grid"
            x1="0"
            :x2="DETAIL_CHART_WIDTH"
            :y1="line.y"
            :y2="line.y"
          />
          <line
            v-for="line in plannerLines"
            :key="`plan-${line.key}`"
            :class="[
              'rank-border-chart-plan-line',
              line.tone === 'target' ? 'rank-border-chart-plan-line--target' : '',
            ]"
            x1="0"
            :x2="DETAIL_CHART_WIDTH"
            :y1="line.y"
            :y2="line.y"
          />
          <path
            v-for="(series, index) in chart.comparisonPaths"
            :key="`cmp-${series.key}`"
            class="rank-border-detail-line rank-border-detail-line--comparison"
            :style="{ stroke: comparisonMeta[index % Math.max(1, comparisonMeta.length)]?.color ?? 'rgb(168 85 247 / 0.85)' }"
            :d="series.path"
          />
          <path class="rank-border-detail-line" :d="chart.path" />
        </svg>
        <button
          v-for="point in chart.points"
          :key="point.key"
          type="button"
          class="rank-border-chart-point"
          :style="pointStyle(point)"
          :aria-label="point.label"
          @mouseenter="showTooltip($event, point.label)"
          @mousemove="moveTooltip($event)"
          @mouseleave="hideTooltip"
        />
      </div>
      <div class="rank-border-chart-labels" aria-hidden="true">
        <span
          v-for="line in chart.referenceLines"
          :key="`label-${line.value}`"
          class="rank-border-chart-label"
          :style="{ top: chartLabelTop(line) }"
        >
          {{ line.label }}
        </span>
      </div>
    </div>
    <div class="rank-border-chart-time-axis" aria-hidden="true">
      <span
        v-for="tick in timeTicks"
        :key="tick.key"
        :class="[
          tick.minor ? 'rank-border-chart-time-tick--minor' : '',
          `rank-border-chart-time-tick--${tick.align}`,
        ]"
        :style="{ left: tick.left }"
      >
        {{ tick.label }}
      </span>
    </div>
    <div
      v-if="plannerLines.length > 0 || chart.comparisonPaths.length > 0"
      class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
    >
      <span
        v-for="(series, index) in chart.comparisonPaths"
        :key="`legend-${series.key}`"
        class="inline-flex items-center gap-1"
      >
        <span
          class="inline-block h-0.5 w-4 rounded-full"
          :style="{ background: comparisonMeta[index % Math.max(1, comparisonMeta.length)]?.color ?? 'rgb(168 85 247 / 0.85)' }"
        />
        {{ comparisonMeta[index % Math.max(1, comparisonMeta.length)]?.label ?? series.key }}
      </span>
      <slot name="legend-extra" />
    </div>
  </div>
</template>

<style scoped>
/* The card is its own inline-size container: the chart height scales with the
   card's width (cqw), so 1-col, 2-col and 3-col layouts all get sane aspect. */
.rank-border-chart-card {
  container-type: inline-size;
}

.rank-border-detail-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.85;
  vector-effect: non-scaling-stroke;
}

.rank-border-detail-line--comparison {
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.rank-border-chart-plan-line {
  fill: none;
  stroke: rgb(16 185 129 / 0.9);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
  vector-effect: non-scaling-stroke;
}

.rank-border-chart-plan-line--target {
  stroke: rgb(245 158 11 / 0.9);
}

.rank-border-chart-frame {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.75rem;
  gap: 0.5rem;
  height: clamp(7.5rem, 24cqw, 12rem);
  min-width: 0;
}

.rank-border-chart-card--large .rank-border-chart-frame {
  height: clamp(16rem, min(46cqw, 56svh), 28rem);
}

.rank-border-chart-plot {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-svg {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.rank-border-chart-labels {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-label {
  position: absolute;
  right: 0;
  max-width: 100%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-chart-grid {
  fill: none;
  stroke: var(--border);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  opacity: 0.74;
}

.rank-border-chart-point {
  position: absolute;
  z-index: 2;
  width: 1.05rem;
  height: 1.05rem;
  transform: translate(-50%, -50%);
  border: 0.125rem solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: crosshair;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.rank-border-chart-point:hover {
  transform: translate(-50%, -50%) scale(1);
  border-color: currentColor;
  background: var(--background);
  box-shadow: 0 0 0 0.2rem color-mix(in oklab, currentColor 14%, transparent);
  opacity: 1;
}

.rank-border-chart-time-axis {
  position: relative;
  height: 1.15rem;
  margin-top: 0.45rem;
  margin-right: 5.25rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 68%, transparent);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-chart-time-axis span {
  position: absolute;
  top: 0.35rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 92%, transparent);
  padding-inline: 0.18rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

.rank-border-chart-time-axis span.rank-border-chart-time-tick--start {
  transform: translateX(0);
}

.rank-border-chart-time-axis span.rank-border-chart-time-tick--end {
  transform: translateX(-100%);
}

/* Quarter ticks only fit when the card itself is wide enough. */
@container (max-width: 30rem) {
  .rank-border-chart-time-tick--minor {
    display: none;
  }
}
</style>
