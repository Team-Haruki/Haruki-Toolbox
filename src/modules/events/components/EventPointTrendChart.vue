<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useResizeObserver } from "@vueuse/core"
import {
  VisArea,
  VisAxis,
  VisBrush,
  VisCrosshair,
  VisLine,
  VisScatter,
  VisTooltip,
  VisXYContainer,
} from "@unovis/vue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import {
  clampTrendWindow,
  defaultTrendWindow,
  TREND_DEFAULT_WINDOW_SIZE,
  type EventPointTrendPoint,
  type TrendWindow,
} from "../lib/event-records"

const props = withDefaults(defineProps<{
  trend: readonly EventPointTrendPoint[]
  title?: string | null
  loading?: boolean
  /** Overview embed: shorter plot, no brush strip (the full chart lives on the records page). */
  compact?: boolean
}>(), {
  title: null,
  loading: false,
  compact: false,
})

const chartHeight = computed(() => props.compact ? 200 : 240)

/** No rank on any point (no honors uploaded) leaves nothing to draw on the right axis. */
const hasRankData = computed(() => props.trend.some((point) => point.rank != null || point.derivedRank != null))
const showRankOverlay = computed(() => showRankSeries.value && hasRankData.value)

const { t } = useI18n()

const showPointSeries = ref(true)
const showRankSeries = ref(true)

const TREND_POINT_COLOR = "#8b5cf6"
const TREND_RANK_COLOR = "#f59e0b"

// --- Responsive margins -----------------------------------------------------
// Both stacked containers disable auto margins and share one computed margin so
// their plot areas overlap exactly (poor man's dual y-axis for unovis).
const chartWrapEl = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
useResizeObserver(chartWrapEl, (entries) => {
  const rect = entries[0]?.contentRect
  if (rect) {
    containerWidth.value = rect.width
  }
})

const isNarrow = computed(() => containerWidth.value > 0 && containerWidth.value < 480)
/** Margin kept for a side whose y-axis (series) is toggled off. */
const COLLAPSED_SIDE_MARGIN = 12

const chartMargin = computed(() => {
  const side = isNarrow.value ? 40 : 56
  // Rank labels ("3,000") sit outside the plot on the right; the narrow-width
  // margin needs a few extra px or they clip at the container edge.
  const rightSide = isNarrow.value ? 48 : 56
  return {
    left: showPointSeries.value ? side : COLLAPSED_SIDE_MARGIN,
    right: showRankOverlay.value ? rightSide : COLLAPSED_SIDE_MARGIN,
    top: 10,
    bottom: 28,
  }
})

// The brush strip must share left/right margins with the main chart so both
// x-scales line up visually.
const brushMargin = computed(() => ({
  left: chartMargin.value.left,
  right: chartMargin.value.right,
  top: 2,
  bottom: 2,
}))

const xNumTicks = computed(() => {
  const width = containerWidth.value || 640
  return Math.max(2, Math.min(8, Math.floor(width / 90)))
})

// --- Zoom window ------------------------------------------------------------
const trendWindow = ref<TrendWindow>(defaultTrendWindow(props.trend.length))

// Reset the window whenever the trend identity changes (different account,
// filters, region, ...), not on every deep mutation.
watch(
  () => [
    props.trend.length,
    props.trend[0]?.eventId,
    props.trend[props.trend.length - 1]?.eventId,
  ] as const,
  () => {
    trendWindow.value = defaultTrendWindow(props.trend.length)
  },
)

const brushEnabled = computed(() => !props.compact && props.trend.length > TREND_DEFAULT_WINDOW_SIZE)

const visibleTrend = computed<EventPointTrendPoint[]>(() =>
  brushEnabled.value
    ? props.trend.slice(trendWindow.value.start, trendWindow.value.end + 1)
    : [...props.trend],
)

const isWindowed = computed(() =>
  brushEnabled.value
  && (trendWindow.value.start > 0 || trendWindow.value.end < props.trend.length - 1),
)

const brushSelection = computed<[number, number]>(() => [
  trendWindow.value.start,
  trendWindow.value.end,
])

function handleBrushEnd(selection: [number, number] | undefined, _event: unknown, userDriven: boolean) {
  if (!userDriven) {
    return
  }

  if (!selection) {
    // Clicking outside the selection clears the brush; treat it as "show all".
    resetWindow()
    return
  }

  trendWindow.value = clampTrendWindow(selection[0], selection[1], props.trend.length)
}

function resetWindow() {
  trendWindow.value = { start: 0, end: Math.max(0, props.trend.length - 1) }
}

// --- Accessors / formatters -------------------------------------------------
const trendX = (_point: EventPointTrendPoint, index: number) => index
const trendY = (point: EventPointTrendPoint) => point.eventPoint
// Ranks improve as the number shrinks; negating them puts better ranks higher.
// Honor-derived tier ceilings stand in when the exact rank is missing.
const trendRankY = (point: EventPointTrendPoint) => {
  const rank = point.rank ?? point.derivedRank
  return rank == null ? undefined : -rank
}

/** X ticks index into the SLICED series rendered by the main chart. */
function xTickFormat(index: number) {
  if (!Number.isInteger(index)) {
    return ""
  }

  const point = visibleTrend.value[index]
  return point ? formatLocalizedDate(point.startAt, { year: "2-digit", month: "numeric" }, "") : ""
}

function yTickFormat(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`
  }

  return String(value)
}

/** Right-axis ticks carry negated ranks; show their absolute value. */
function rankTickFormat(value: number) {
  const rank = Math.abs(value)
  return Number.isInteger(rank) ? formatNumberCN(rank) : ""
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char] ?? char,
  )
}

function formatPointDate(value: number) {
  return formatLocalizedDate(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    t("events.common.dateFallback"),
  )
}

function crosshairTemplate(point: EventPointTrendPoint) {
  // Content only — the unovis tooltip wrapper (themed via --vis-tooltip-* CSS
  // vars) provides the box, so we must not draw a second box here.
  return `<div style="font-size:12px;line-height:1.55">
    <div style="font-weight:600;margin-bottom:2px">${escapeHtml(point.name)}</div>
    <div style="opacity:0.7"><b>#${point.eventId}</b> ${formatPointDate(point.startAt)}</div>
    <div>${t("eventRecords.trend.point")}: ${formatNumberCN(point.eventPoint)}</div>
    <div>${t("eventRecords.trend.rank")}: ${point.rank != null
      ? formatNumberCN(point.rank)
      : point.derivedRank != null ? `T${point.derivedRank}` : "—"}</div>
  </div>`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
        <span>{{ title ?? t("eventRecords.trend.title") }}</span>
        <span class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-normal transition-colors',
              showPointSeries ? '' : 'text-muted-foreground opacity-60',
            ]"
            :style="showPointSeries ? { borderColor: TREND_POINT_COLOR, color: TREND_POINT_COLOR } : {}"
            :aria-pressed="showPointSeries"
            @click="showPointSeries = !showPointSeries"
          >
            <span class="size-2 rounded-full" :style="{ backgroundColor: TREND_POINT_COLOR }" />
            {{ t("eventRecords.trend.point") }}
          </button>
          <button
            v-if="hasRankData"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-normal transition-colors',
              showRankSeries ? '' : 'text-muted-foreground opacity-60',
            ]"
            :style="showRankSeries ? { borderColor: TREND_RANK_COLOR, color: TREND_RANK_COLOR } : {}"
            :aria-pressed="showRankSeries"
            @click="showRankSeries = !showRankSeries"
          >
            <span class="size-2 rounded-full" :style="{ backgroundColor: TREND_RANK_COLOR }" />
            {{ t("eventRecords.trend.rank") }}
          </button>
          <button
            v-if="isWindowed"
            type="button"
            class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
            @click="resetWindow"
          >
            {{ t("eventRecords.trend.showAll") }}
          </button>
          <slot name="actions" />
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div ref="chartWrapEl">
        <Skeleton v-if="loading" class="w-full rounded-lg" :style="{ height: `${chartHeight}px` }" />
        <template v-else-if="trend.length >= 2">
          <div class="relative" :style="{ height: `${chartHeight}px` }">
            <VisXYContainer :data="visibleTrend" :height="chartHeight" :auto-margin="false" :margin="chartMargin">
              <template v-if="showPointSeries">
                <VisArea :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :opacity="0.15" curve-type="monotoneX" />
                <VisLine :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" curve-type="monotoneX" />
                <VisScatter :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :size="4" />
              </template>
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tick-format="xTickFormat" :num-ticks="xNumTicks" />
              <VisAxis v-if="showPointSeries" type="y" :tick-format="yTickFormat" :tick-text-color="TREND_POINT_COLOR" />
            </VisXYContainer>
            <div v-if="showRankOverlay" class="pointer-events-none absolute inset-0">
              <VisXYContainer
                :data="visibleTrend"
                :height="chartHeight"
                :auto-margin="false"
                :margin="chartMargin"
              >
                <VisLine :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" curve-type="monotoneX" />
                <VisScatter :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" :size="4" />
                <VisAxis type="y" position="right" :tick-format="rankTickFormat" :tick-text-color="TREND_RANK_COLOR" :grid-line="false" />
              </VisXYContainer>
            </div>
          </div>
          <div
            v-if="brushEnabled"
            class="mt-2 h-12 touch-none [--vis-brush-handle-fill-color:var(--muted-foreground)] [--vis-brush-handle-stroke-color:var(--background)] [--vis-brush-unselected-fill-color:var(--background)] [--vis-brush-unselected-opacity:0.6]"
            role="group"
            :aria-label="t('eventRecords.trend.zoomHint')"
            :title="t('eventRecords.trend.zoomHint')"
          >
            <VisXYContainer :data="trend" :height="48" :auto-margin="false" :margin="brushMargin">
              <VisArea :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :opacity="0.25" curve-type="monotoneX" />
              <VisBrush
                :selection="brushSelection"
                :draggable="true"
                :handle-width="2"
                :on-brush-end="handleBrushEnd"
              />
            </VisXYContainer>
          </div>
        </template>
        <p v-else class="text-sm text-muted-foreground">{{ t("eventRecords.trend.empty") }}</p>
      </div>
    </CardContent>
  </Card>
</template>
