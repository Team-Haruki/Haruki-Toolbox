<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  VisArea,
  VisAxis,
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
import type { EventPointTrendPoint } from "../lib/event-records"

const props = withDefaults(defineProps<{
  trend: readonly EventPointTrendPoint[]
  title?: string | null
  loading?: boolean
}>(), {
  title: null,
  loading: false,
})

const { t } = useI18n()

const showPointSeries = ref(true)
const showRankSeries = ref(true)

const TREND_POINT_COLOR = "#8b5cf6"
const TREND_RANK_COLOR = "#f59e0b"

// Both stacked containers disable auto margins and share this fixed margin so
// their plot areas overlap exactly (poor man's dual y-axis for unovis).
const TREND_MARGIN = { left: 56, right: 56, top: 10, bottom: 28 }

const trendX = (_point: EventPointTrendPoint, index: number) => index
const trendY = (point: EventPointTrendPoint) => point.eventPoint
// Ranks improve as the number shrinks; negating them puts better ranks higher.
// Honor-derived tier ceilings stand in when the exact rank is missing.
const trendRankY = (point: EventPointTrendPoint) => {
  const rank = point.rank ?? point.derivedRank
  return rank == null ? undefined : -rank
}

function xTickFormat(index: number) {
  if (!Number.isInteger(index)) {
    return ""
  }

  const point = props.trend[index]
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
          <slot name="actions" />
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Skeleton v-if="loading" class="h-60 w-full rounded-lg" />
      <div v-else-if="trend.length >= 2" class="relative h-60">
        <VisXYContainer :data="trend" :height="240" :auto-margin="false" :margin="TREND_MARGIN">
          <template v-if="showPointSeries">
            <VisArea :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :opacity="0.15" curve-type="monotoneX" />
            <VisLine :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" curve-type="monotoneX" />
            <VisScatter :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :size="4" />
          </template>
          <VisCrosshair :template="crosshairTemplate" />
          <VisTooltip />
          <VisAxis type="x" :tick-format="xTickFormat" />
          <VisAxis v-if="showPointSeries" type="y" :tick-format="yTickFormat" :tick-text-color="TREND_POINT_COLOR" />
        </VisXYContainer>
        <div v-if="showRankSeries" class="pointer-events-none absolute inset-0">
          <VisXYContainer
            :data="trend"
            :height="240"
            :auto-margin="false"
            :margin="TREND_MARGIN"
          >
            <VisLine :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" curve-type="monotoneX" />
            <VisScatter :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" :size="4" />
            <VisAxis type="y" position="right" :tick-format="rankTickFormat" :tick-text-color="TREND_RANK_COLOR" :grid-line="false" />
          </VisXYContainer>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">{{ t("eventRecords.trend.empty") }}</p>
    </CardContent>
  </Card>
</template>
