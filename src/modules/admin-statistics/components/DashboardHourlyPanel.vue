<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDateTime } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminAnimatedNumber from "@/modules/admin/components/AdminAnimatedNumber.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import type { DashboardPulse } from "@/modules/admin-statistics/composables/useDashboardStats"
import { buildCountAxis } from "@/modules/admin-statistics/lib/dashboard-chart-axes"
import { ratio, summarizeSeries } from "@/modules/admin-statistics/lib/dashboard-metrics"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import type { TimeseriesPoint } from "@/types/admin"

/**
 * The last 24 hours, hour by hour: success rate and its split on the left,
 * one column per hour on the right (successful uploads with the failed ones
 * stacked on top). Fed by the hourly timeseries, so the totals are the exact
 * rolling window.
 */
const props = defineProps<{
  pulse: DashboardPulse | null
  loading: boolean
  error: ErrorDescription | null
}>()

const emit = defineEmits<{ retry: [] }>()

const { t, locale } = useI18n()

const PLOT_HEIGHT = 142
// Same side margins as the trend charts, so the two panels line up.
const MARGIN_LEFT = 46
const MARGIN_RIGHT = 30

const points = computed(() => props.pulse?.current ?? [])
const uploads = computed(() => summarizeSeries(points.value.map((point) => point.uploads)))
const successes = computed(() => summarizeSeries(points.value.map((point) => point.uploadSuccesses)).total)
const failures = computed(() => summarizeSeries(points.value.map((point) => point.uploadFailures)).total)
const previousTotal = computed(() => summarizeSeries((props.pulse?.previous ?? []).map((point) => point.uploads)).total)
const successRate = computed(() => ratio(successes.value, uploads.value.total))
const axis = computed(() => buildCountAxis(points.value.map((point) => point.uploads)))

function formatHour(point: TimeseriesPoint | undefined): string {
  return point ? formatLocalizedDateTime(point.time, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "") : ""
}

function formatHourLong(point: TimeseriesPoint | undefined): string {
  return point
    ? formatLocalizedDateTime(point.time, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "")
    : ""
}

function formatRate(rate: number | null): string {
  return rate === null ? t("adminStatistics.common.fallback") : formatPercent(rate * 100, 2)
}

const stats = computed(() => {
  const peak = uploads.value.peak
  // The window is exactly 24 hours long, whatever the number of (cut) buckets.
  const hourlyAverage = points.value.length > 0 ? uploads.value.total / 24 : null
  return [
    {
      label: t("adminStatistics.dashboard.hourly.peakHour"),
      value: peak ? `${formatNumberCN(peak.value)} · ${formatHour(points.value[peak.index])}` : t("adminStatistics.common.fallback"),
    },
    {
      label: t("adminStatistics.dashboard.hourly.hourlyAverage"),
      value: hourlyAverage === null
        ? t("adminStatistics.common.fallback")
        : hourlyAverage.toLocaleString(locale.value, { maximumFractionDigits: 1 }),
    },
    {
      label: t("adminStatistics.dashboard.hourly.previousTotal"),
      value: formatNumberCN(previousTotal.value),
    },
  ]
})

// Columns render flat and rise a frame later, so the height transition plays
// once when the data arrives (and again when a refresh brings new data).
const grown = ref(false)
let growFrame = 0
watch(() => props.pulse, async (pulse) => {
  cancelAnimationFrame(growFrame)
  grown.value = false
  if (!pulse) return
  await nextTick()
  growFrame = requestAnimationFrame(() => {
    grown.value = true
  })
}, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(growFrame))

function columnHeight(point: TimeseriesPoint): string {
  return grown.value ? `${sharePercent(point.uploads, axis.value.max)}%` : "0%"
}

// --- Hover / keyboard readout ----------------------------------------------
const active = ref<number | null>(null)
const activePoint = computed(() => (active.value === null ? undefined : points.value[active.value]))

function moveActive(step: number) {
  const count = points.value.length
  if (count === 0) return
  const start = active.value ?? (step > 0 ? -1 : count)
  active.value = Math.min(count - 1, Math.max(0, start + step))
}

const tooltipStyle = computed(() => {
  if (active.value === null || points.value.length === 0) return {}
  const center = ((active.value + 0.5) / points.value.length) * 100
  // Beside the hovered column, on the side with more room.
  return center <= 50
    ? { left: `calc(${center}% + 14px)` }
    : { right: `calc(${100 - center}% + 14px)` }
})

const readout = computed(() => {
  const point = activePoint.value
  if (!point) return ""
  return t("adminStatistics.dashboard.hourly.readout", {
    time: formatHourLong(point),
    success: formatNumberCN(point.uploadSuccesses),
    failed: formatNumberCN(point.uploadFailures),
  })
})

// A label every sixth hour keeps the axis readable at phone width.
const xLabels = computed(() => points.value
  .map((point, index) => ({ index, text: formatHour(point) }))
  .filter(({ index }) => index % 6 === 0))
</script>

<template>
  <AdminPanel
    :title="t('adminStatistics.dashboard.hourly.title')"
    :description="t('adminStatistics.dashboard.hourly.description')"
    flush
  >
    <div v-if="error" class="px-4">
      <LoadErrorState
        :title="t('adminStatistics.dashboard.toast.loadChartFailedTitle')"
        :description="error.message"
        :detail="error.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />
    </div>

    <div v-else-if="!pulse" class="p-4" aria-busy="true">
      <Skeleton class="h-48 w-full" />
    </div>

    <div
      v-else
      :class="['@container transition-opacity duration-200', loading ? 'opacity-60' : '']"
      :aria-busy="loading"
    >
      <div class="grid grid-cols-1 gap-x-4 gap-y-4 px-4 py-4 @min-[44rem]:grid-cols-[13.5rem_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-3 @min-[44rem]:justify-center">
          <div>
            <p class="text-xs text-muted-foreground">{{ t("adminStatistics.dashboard.hourly.successRate") }}</p>
            <p class="mt-0.5 text-2xl leading-tight font-semibold">
              <AdminAnimatedNumber v-if="successRate !== null" :value="successRate" :format="formatRate" />
              <span v-else class="text-muted-foreground">{{ t("adminStatistics.common.fallback") }}</span>
            </p>
            <!-- One whole split in two, beside its figures: a thin segmented bar. -->
            <div v-if="uploads.total > 0" class="mt-2 flex h-2 gap-0.5" aria-hidden="true">
              <div class="min-w-0 rounded-full bg-(--dash-uploads)" :style="{ flex: `${successes} 0 0` }" />
              <div
                v-if="failures > 0"
                class="min-w-1 rounded-full bg-(--dash-failures)"
                :style="{ flex: `${failures} 0 0` }"
              />
            </div>
            <p class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-xs bg-(--dash-uploads)" aria-hidden="true" />
                {{ t("adminStatistics.common.success") }} {{ formatNumberCN(successes) }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-xs bg-(--dash-failures)" aria-hidden="true" />
                {{ t("adminStatistics.common.failure") }} {{ formatNumberCN(failures) }}
              </span>
            </p>
          </div>
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
            <template v-for="stat in stats" :key="stat.label">
              <dt class="text-muted-foreground">{{ stat.label }}</dt>
              <dd class="text-right tabular-nums [overflow-wrap:anywhere] @min-[44rem]:text-left">{{ stat.value }}</dd>
            </template>
          </dl>
        </div>

        <figure class="min-w-0" data-testid="statistics-hourly-chart">
          <div
            class="relative rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            role="group"
            tabindex="0"
            :aria-label="t('adminStatistics.dashboard.hourly.chartLabel')"
            :style="{ paddingLeft: `${MARGIN_LEFT}px`, paddingRight: `${MARGIN_RIGHT}px`, paddingTop: '8px' }"
            @keydown.left.prevent="moveActive(-1)"
            @keydown.right.prevent="moveActive(1)"
            @blur="active = null"
            @pointerleave="active = null"
          >
            <div class="relative" :style="{ height: `${PLOT_HEIGHT}px` }">
              <div
                v-for="tick in axis.ticks"
                :key="tick"
                class="absolute inset-x-0 border-t border-border"
                :style="{ bottom: `${sharePercent(tick, axis.max)}%` }"
                aria-hidden="true"
              >
                <span
                  class="absolute top-0 -translate-y-1/2 text-right text-xs tabular-nums text-muted-foreground"
                  :style="{ right: '100%', width: `${MARGIN_LEFT - 8}px`, marginRight: '8px' }"
                >{{ formatNumberCN(tick) }}</span>
              </div>

              <div class="absolute inset-0 flex items-end">
                <div
                  v-for="(point, index) in points"
                  :key="point.time"
                  class="flex h-full min-w-0 flex-1 items-end justify-center px-px"
                  @pointerenter="active = index"
                  @pointerdown="active = index"
                >
                  <div
                    :class="[
                      'flex w-full max-w-6 flex-col-reverse gap-0.5 transition-[height,opacity] duration-700 ease-out motion-reduce:transition-none',
                      active !== null && active !== index ? 'opacity-45' : '',
                    ]"
                    :style="{ height: columnHeight(point) }"
                  >
                    <div
                      v-if="point.uploadSuccesses > 0"
                      :class="['min-h-0 bg-(--dash-uploads)', point.uploadFailures > 0 ? '' : 'rounded-t-[4px]']"
                      :style="{ flex: `${point.uploadSuccesses} 0 0` }"
                    />
                    <div
                      v-if="point.uploadFailures > 0"
                      class="min-h-0.5 rounded-t-[4px] bg-(--dash-failures)"
                      :style="{ flex: `${point.uploadFailures} 0 0` }"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="activePoint"
                class="pointer-events-none absolute top-0 z-10 min-w-36 rounded-md border bg-popover px-2.5 py-1.5 text-xs leading-relaxed text-popover-foreground shadow-sm"
                :style="tooltipStyle"
              >
                <p class="font-semibold">{{ formatHourLong(activePoint) }}</p>
                <p class="flex items-center gap-1.5">
                  <span class="size-2 rounded-xs bg-(--dash-uploads)" />
                  <span class="opacity-75">{{ t("adminStatistics.dashboard.hourly.succeeded") }}</span>
                  <b class="ml-auto pl-3 tabular-nums">{{ formatNumberCN(activePoint.uploadSuccesses) }}</b>
                </p>
                <p class="flex items-center gap-1.5">
                  <span class="size-2 rounded-xs bg-(--dash-failures)" />
                  <span class="opacity-75">{{ t("adminStatistics.dashboard.hourly.failed") }}</span>
                  <b class="ml-auto pl-3 tabular-nums">{{ formatNumberCN(activePoint.uploadFailures) }}</b>
                </p>
                <p class="flex items-center gap-1.5">
                  <span class="size-2" />
                  <span class="opacity-75">{{ t("adminStatistics.dashboard.chart.successRate") }}</span>
                  <b class="ml-auto pl-3 tabular-nums">{{ formatRate(ratio(activePoint.uploadSuccesses, activePoint.uploads)) }}</b>
                </p>
              </div>
            </div>

            <div class="relative h-[26px] text-xs text-muted-foreground" aria-hidden="true">
              <span
                v-for="label in xLabels"
                :key="label.index"
                class="absolute top-2 -translate-x-1/2 tabular-nums whitespace-nowrap"
                :style="{ left: `${((label.index + 0.5) / points.length) * 100}%` }"
              >{{ label.text }}</span>
            </div>
            <span class="sr-only" aria-live="polite">{{ readout }}</span>
          </div>

          <figcaption class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" :style="{ paddingLeft: `${MARGIN_LEFT}px` }">
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-xs bg-(--dash-uploads)" aria-hidden="true" />
              {{ t("adminStatistics.dashboard.hourly.succeeded") }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-xs bg-(--dash-failures)" aria-hidden="true" />
              {{ t("adminStatistics.dashboard.hourly.failed") }}
            </span>
          </figcaption>

          <table class="sr-only">
            <caption>{{ t("adminStatistics.dashboard.hourly.title") }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ t("adminStatistics.dashboard.chart.tableTime") }}</th>
                <th scope="col">{{ t("adminStatistics.dashboard.hourly.succeeded") }}</th>
                <th scope="col">{{ t("adminStatistics.dashboard.hourly.failed") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="point in points" :key="point.time">
                <th scope="row">{{ formatHourLong(point) }}</th>
                <td>{{ point.uploadSuccesses }}</td>
                <td>{{ point.uploadFailures }}</td>
              </tr>
            </tbody>
          </table>
        </figure>
      </div>
    </div>
  </AdminPanel>
</template>
