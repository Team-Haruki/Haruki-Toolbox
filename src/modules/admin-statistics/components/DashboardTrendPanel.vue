<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowDownRight, LucideArrowUpRight, LucideChartLine, LucideMinus } from "lucide-vue-next"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminAnimatedNumber from "@/modules/admin/components/AdminAnimatedNumber.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { percentChange } from "@/modules/admin/lib/stat-visuals"
import type { DashboardTrend } from "@/modules/admin-statistics/composables/useDashboardStats"
import {
  compareHalves,
  findFailureExtremes,
  formatSignedPercent,
  ratio,
  summarizeSeries,
} from "@/modules/admin-statistics/lib/dashboard-metrics"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import type { TimeseriesPoint } from "@/types/admin"
import DashboardTrendChart from "./DashboardTrendChart.vue"

/**
 * The period trend: one row per measure, its figures on the left (total,
 * change between the two halves of the range, daily average, peak) and its
 * chart on the right. The range and bucket selects scope this panel only.
 */
const props = defineProps<{
  trend: DashboardTrend | null
  loading: boolean
  error: ErrorDescription | null
  rangeDays: number
  bucket: string
  rangeOptions: ReadonlyArray<{ value: string; label: string }>
  bucketOptions: ReadonlyArray<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  "update:range": [value: unknown]
  "update:bucket": [value: unknown]
  retry: []
}>()

const { t, locale } = useI18n()

type SeriesKey = "uploads" | "failures" | "registrations"

const SERIES: ReadonlyArray<{ key: SeriesKey; testId: string; color: string; value: (point: TimeseriesPoint) => number }> = [
  { key: "uploads", testId: "statistics-upload-trend", color: "var(--dash-uploads)", value: (point) => point.uploads },
  { key: "failures", testId: "statistics-failure-trend", color: "var(--dash-failures)", value: (point) => point.uploadFailures },
  { key: "registrations", testId: "statistics-registration-trend", color: "var(--dash-registrations)", value: (point) => point.registrations },
]

const points = computed(() => props.trend?.points ?? [])
const loadedBucket = computed(() => props.trend?.bucket ?? props.bucket)

function formatBucket(point: TimeseriesPoint | undefined): string {
  if (!point) return ""
  return loadedBucket.value === "month"
    ? formatLocalizedDate(point.time, { year: "numeric", month: "short" }, "")
    : formatLocalizedDate(point.time, { month: "short", day: "numeric" }, "")
}

function formatAverage(value: number | null): string {
  if (value === null) return t("adminStatistics.common.fallback")
  return value.toLocaleString(locale.value, { maximumFractionDigits: 1 })
}

function formatRate(rate: number | null): string {
  return rate === null ? t("adminStatistics.common.fallback") : formatPercent(rate * 100, 2)
}

type TrendChip = { text: string; direction: "up" | "down" | "flat"; good: boolean | null; caption: string }

/** Later half of the range against the earlier half; null when the range has too few complete buckets. */
function trendChip(values: readonly number[], upIsGood: boolean | null): TrendChip | null {
  const comparison = compareHalves(values)
  if (!comparison) return null
  const change = percentChange(comparison.current, comparison.previous)
  if (!change) return null
  const bucketKey = ["day", "week", "month"].includes(loadedBucket.value) ? loadedBucket.value : "day"
  return {
    text: formatSignedPercent(change.percent),
    direction: change.direction,
    good: upIsGood === null || change.direction === "flat" ? null : (change.direction === "up") === upIsGood,
    caption: t(`adminStatistics.dashboard.trend.compare.${bucketKey}`, { n: comparison.size }, comparison.size),
  }
}

type SeriesView = (typeof SERIES)[number] & {
  label: string
  total: number
  chip: TrendChip | null
  stats: Array<{ label: string; value: string }>
}

const seriesViews = computed<SeriesView[]>(() => {
  const days = props.trend?.days ?? props.rangeDays
  const uploads = summarizeSeries(points.value.map((point) => point.uploads))
  const failures = summarizeSeries(points.value.map((point) => point.uploadFailures))
  const registrations = summarizeSeries(points.value.map((point) => point.registrations))
  const extremes = findFailureExtremes(points.value)

  const peakText = (peak: { index: number; value: number } | null) =>
    peak ? `${formatNumberCN(peak.value)} · ${formatBucket(points.value[peak.index])}` : t("adminStatistics.common.fallback")
  const dailyAverage = (total: number) => formatAverage(ratio(total, days))

  const failureStats = [
    { label: t("adminStatistics.dashboard.trend.failureRate"), value: formatRate(ratio(failures.total, uploads.total)) },
  ]
  if (extremes.worst) {
    failureStats.push({
      label: t("adminStatistics.dashboard.trend.worstRate"),
      value: `${formatRate(extremes.worst.rate)} · ${formatBucket(points.value[extremes.worst.index])}`,
    })
  }
  if (extremes.best && extremes.best.index !== extremes.worst?.index) {
    failureStats.push({
      label: t("adminStatistics.dashboard.trend.bestRate"),
      value: `${formatRate(extremes.best.rate)} · ${formatBucket(points.value[extremes.best.index])}`,
    })
  }

  const views: Record<SeriesKey, Omit<SeriesView, keyof (typeof SERIES)[number]>> = {
    uploads: {
      label: t("adminStatistics.dashboard.chart.uploads"),
      total: uploads.total,
      chip: trendChip(points.value.map((point) => point.uploads), true),
      stats: [
        { label: t("adminStatistics.dashboard.trend.dailyAverage"), value: dailyAverage(uploads.total) },
        { label: t("adminStatistics.dashboard.trend.peak"), value: peakText(uploads.peak) },
      ],
    },
    failures: {
      label: t("adminStatistics.dashboard.chart.failures"),
      total: failures.total,
      chip: trendChip(points.value.map((point) => point.uploadFailures), false),
      stats: failureStats,
    },
    registrations: {
      label: t("adminStatistics.dashboard.chart.registrations"),
      total: registrations.total,
      chip: trendChip(points.value.map((point) => point.registrations), true),
      stats: [
        { label: t("adminStatistics.dashboard.trend.dailyAverage"), value: dailyAverage(registrations.total) },
        { label: t("adminStatistics.dashboard.trend.peak"), value: peakText(registrations.peak) },
      ],
    },
  }
  return SERIES.map((series) => ({ ...series, ...views[series.key] }))
})

function chipClass(chip: TrendChip): string {
  if (chip.good === null) return "text-muted-foreground"
  return chip.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
}

// --- Tooltip: one readout with every measure of the hovered bucket ---------
// Content only: the unovis tooltip wrapper (themed via --vis-tooltip-* CSS
// vars) provides the box. Labels are app strings, values are numbers.
function tooltipRow(color: string | null, label: string, value: string): string {
  const key = color
    ? `<span style="width:10px;height:2px;border-radius:1px;background:${color}"></span>`
    : `<span style="width:10px"></span>`
  return `<div style="display:flex;align-items:center;gap:6px">${key}<span style="opacity:0.75">${label}</span><b style="margin-left:auto;padding-left:12px;font-variant-numeric:tabular-nums">${value}</b></div>`
}

function tooltip(point: TimeseriesPoint): string {
  return `<div style="font-size:12px;line-height:1.6;min-width:9.5rem">
    <div style="font-weight:600;margin-bottom:2px">${formatBucket(point)}</div>
    ${tooltipRow("var(--dash-uploads)", t("adminStatistics.dashboard.chart.uploads"), formatNumberCN(point.uploads))}
    ${tooltipRow("var(--dash-failures)", t("adminStatistics.dashboard.chart.failures"), formatNumberCN(point.uploadFailures))}
    ${tooltipRow(null, t("adminStatistics.dashboard.chart.successRate"), formatRate(ratio(point.uploadSuccesses, point.uploads)))}
    ${tooltipRow("var(--dash-registrations)", t("adminStatistics.dashboard.chart.registrations"), formatNumberCN(point.registrations))}
  </div>`
}

// The crosshair of the chart under the pointer is mirrored in the other two.
const hover = ref<{ source: SeriesKey; index: number } | null>(null)

function onHover(source: SeriesKey, index: number | undefined) {
  if (index === undefined) {
    if (hover.value?.source === source) {
      hover.value = null
    }
    return
  }
  hover.value = { source, index }
}

function mirroredIndex(key: SeriesKey): number | undefined {
  return hover.value && hover.value.source !== key ? hover.value.index : undefined
}
</script>

<template>
  <AdminPanel
    :title="t('adminStatistics.dashboard.chart.title')"
    :description="t('adminStatistics.dashboard.chart.description')"
    flush
  >
    <template #actions>
      <Label id="statistics-chart-range-label" for="statistics-chart-range" class="sr-only">
        {{ t("adminStatistics.dashboard.chart.rangeLabel") }}
      </Label>
      <Select id="statistics-chart-range" :model-value="String(rangeDays)" @update:model-value="emit('update:range', $event)">
        <SelectTrigger aria-labelledby="statistics-chart-range-label" size="sm" class="min-w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in rangeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Label id="statistics-chart-bucket-label" for="statistics-chart-bucket" class="sr-only">
        {{ t("adminStatistics.dashboard.chart.bucketLabel") }}
      </Label>
      <Select id="statistics-chart-bucket" :model-value="bucket" @update:model-value="emit('update:bucket', $event)">
        <SelectTrigger aria-labelledby="statistics-chart-bucket-label" size="sm" class="min-w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in bucketOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>

    <div v-if="error" class="px-4">
      <LoadErrorState
        :title="t('adminStatistics.dashboard.toast.loadChartFailedTitle')"
        :description="error.message"
        :detail="error.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />
    </div>

    <div v-else-if="!trend" class="flex flex-col gap-4 p-4" aria-busy="true">
      <Skeleton v-for="index in 3" :key="index" class="h-40 w-full" />
    </div>

    <div v-else-if="points.length === 0" class="flex h-56 flex-col items-center justify-center gap-3 text-center">
      <LucideChartLine class="size-8 text-muted-foreground/60" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ t("adminStatistics.dashboard.chart.empty") }}</p>
    </div>

    <!-- A refetch keeps the previous charts, dimmed, instead of flashing a skeleton. -->
    <div
      v-else
      :class="['@container divide-y divide-border/60 transition-opacity duration-200', loading ? 'opacity-60' : '']"
      :aria-busy="loading"
    >
      <section
        v-for="series in seriesViews"
        :key="series.key"
        class="grid grid-cols-1 gap-x-4 gap-y-3 px-4 py-4 @min-[44rem]:grid-cols-[13.5rem_minmax(0,1fr)]"
        :aria-labelledby="`statistics-trend-${series.key}-title`"
      >
        <div class="flex min-w-0 flex-col gap-2 @min-[44rem]:justify-center">
          <div>
            <h3 :id="`statistics-trend-${series.key}-title`" class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span class="h-0.5 w-3 shrink-0 rounded-full" :style="{ backgroundColor: series.color }" aria-hidden="true" />
              {{ series.label }}
            </h3>
            <p class="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-2xl leading-tight font-semibold">
              <AdminAnimatedNumber :value="series.total" />
              <span
                v-if="series.chip"
                :class="['inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', chipClass(series.chip)]"
              >
                <LucideArrowUpRight v-if="series.chip.direction === 'up'" class="size-3.5" aria-hidden="true" />
                <LucideArrowDownRight v-else-if="series.chip.direction === 'down'" class="size-3.5" aria-hidden="true" />
                <LucideMinus v-else class="size-3.5" aria-hidden="true" />
                {{ series.chip.text }}
              </span>
            </p>
            <p v-if="series.chip" class="mt-0.5 text-xs text-muted-foreground">{{ series.chip.caption }}</p>
          </div>
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
            <template v-for="stat in series.stats" :key="stat.label">
              <dt class="text-muted-foreground">{{ stat.label }}</dt>
              <dd class="text-right tabular-nums [overflow-wrap:anywhere] @min-[44rem]:text-left">{{ stat.value }}</dd>
            </template>
          </dl>
        </div>
        <div class="min-w-0" :data-testid="series.testId">
          <DashboardTrendChart
            :points="points"
            :value="series.value"
            :color="series.color"
            :format-tick="formatBucket"
            :tooltip="tooltip"
            :hover-index="mirroredIndex(series.key)"
            @hover="onHover(series.key, $event)"
          />
        </div>
      </section>

      <!-- The same numbers as a table for assistive tech: a tooltip must not be the only way to read a value. -->
      <table class="sr-only">
        <caption>{{ t("adminStatistics.dashboard.chart.title") }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ t("adminStatistics.dashboard.chart.tableTime") }}</th>
            <th scope="col">{{ t("adminStatistics.dashboard.chart.uploads") }}</th>
            <th scope="col">{{ t("adminStatistics.dashboard.chart.failures") }}</th>
            <th scope="col">{{ t("adminStatistics.dashboard.chart.registrations") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in points" :key="point.time">
            <th scope="row">{{ formatBucket(point) }}</th>
            <td>{{ point.uploads }}</td>
            <td>{{ point.uploadFailures }}</td>
            <td>{{ point.registrations }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminPanel>
</template>
