<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideGamepad2,
  LucideGauge,
  LucideTimer,
  LucideUpload,
} from "lucide-vue-next"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import LogsBreakdownPanel from "@/modules/admin-statistics/components/LogsBreakdownPanel.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import type { UploadLogAnalyticsResponse } from "@/modules/admin-statistics/api/upload-log"
import {
  buildUploadVolumeSeries,
  failureStageCounts,
  formatDurationMs,
  rankCategoryCounts,
  successRatePercent,
  sumUploadAttemptsByDimension,
  type UploadVolumeInterval,
} from "@/modules/admin-statistics/lib/logs-stats"
import type { UploadLogsSummary } from "@/types/admin"

/**
 * The stat block above the upload-log table. Every figure covers all uploads
 * matching the filters inside the time range, never just the page shown:
 * the counts and the method / data type splits come with the list response,
 * the volume sparklines, the per-server split, the failure stages, the active
 * accounts and the processing time from `GET /statistics/upload-analytics`.
 * When only the analytics request fails, its tiles show a dash and its panels
 * a retry; the rest stays.
 */
const props = defineProps<{
  loading: boolean
  total: number
  summary: UploadLogsSummary | null
  analytics: UploadLogAnalyticsResponse | null
  analyticsLoading: boolean
  analyticsError: ErrorDescription | null
  /** "from — to" of the window the list covers. */
  rangeLabel: string
  methodLabel: (method?: string) => string
  dataTypeLabel: (type?: string) => string
  serverLabel: (server?: string) => string
}>()

const emit = defineEmits<{ retryAnalytics: [] }>()

const { t } = useI18n()

const BREAKDOWN_LIMIT = 6
const HEALTHY_SUCCESS_RATE = 90

// Skeletons only before the first answer: on a refresh the figures stay and glide to the new values.
const pending = computed(() => props.loading && !props.summary)
const analyticsPending = computed(() => props.analyticsLoading && !props.analytics)

const rate = computed(() =>
  props.summary ? successRatePercent(props.summary.success, props.summary.failed) : null,
)
const rateDetail = computed(() =>
  rate.value == null
    ? null
    : t("adminStatistics.uploadLogs.summary.failureRate", { rate: formatPercent(100 - rate.value, 1) }),
)

const interval = computed<UploadVolumeInterval>(() => (props.analytics?.interval === "day" ? "day" : "hour"))
const volume = computed(() =>
  props.analytics
    ? buildUploadVolumeSeries(props.analytics.groups, props.analytics.from, props.analytics.to, interval.value)
    : [],
)
const attemptSeries = computed(() => volume.value.map((point) => point.attempts))
const failureSeries = computed(() => volume.value.map((point) => point.failures))
// A trend needs a few points with something in them; a single bucket is just the total again.
const showSeries = computed(() => volume.value.length >= 3 && volume.value.some((point) => point.attempts > 0))
const volumeLabel = computed(() => t(`adminStatistics.uploadLogs.summary.volume.${interval.value}`))
const failureVolumeLabel = computed(() => t(`adminStatistics.uploadLogs.summary.failureVolume.${interval.value}`))
const peak = computed(() => Math.max(0, ...attemptSeries.value))
const totalDetail = computed(() =>
  showSeries.value
    ? t(`adminStatistics.uploadLogs.summary.peak.${interval.value}`, { count: formatNumberCN(peak.value, "0") })
    : null,
)

const activeAccounts = computed(() => props.analytics?.summary.activeGameAccounts ?? null)
const latencyP50 = computed(() => props.analytics?.summary.latencyP50Ms ?? null)
const latencyDetail = computed(() => {
  const summary = props.analytics?.summary
  if (!summary) {
    return null
  }
  const p95 = formatDurationMs(summary.latencyP95Ms)
  if (!p95 || !summary.latencySampleCount) {
    return t("adminStatistics.uploadLogs.summary.latencyNoSamples")
  }
  return t("adminStatistics.uploadLogs.summary.latencyDetail", {
    p95,
    count: formatNumberCN(summary.latencySampleCount, "0"),
  })
})

const methods = computed(() => rankCategoryCounts(props.summary?.byMethod, BREAKDOWN_LIMIT))
const dataTypes = computed(() => rankCategoryCounts(props.summary?.byDataType, BREAKDOWN_LIMIT))
const servers = computed(() => rankCategoryCounts(sumUploadAttemptsByDimension(props.analytics?.groups, "server"), BREAKDOWN_LIMIT))
const failureStages = computed(() => rankCategoryCounts(failureStageCounts(props.analytics?.byFailureStage), BREAKDOWN_LIMIT))

function stageLabel(key: string): string {
  return !key || key === "unknown" ? t("adminStatistics.uploadLogs.charts.unknownStage") : key
}

function ratePercentText(value: number): string {
  return formatPercent(value, 1)
}

function durationText(value: number): string {
  return formatDurationMs(value) ?? t("adminStatistics.common.fallback")
}
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="t('adminStatistics.uploadLogs.overview.title')" data-testid="upload-logs-summary">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <h2 class="text-sm font-semibold">{{ t("adminStatistics.uploadLogs.overview.title") }}</h2>
      <p class="min-w-0 text-xs text-muted-foreground" data-testid="upload-logs-scope">
        <template v-if="rangeLabel">
          <span class="tabular-nums">{{ rangeLabel }}</span>
          <span aria-hidden="true"> · </span>
        </template>
        {{ t("adminStatistics.uploadLogs.overview.scope") }}
      </p>
    </div>

    <AdminStatGrid :columns="6">
      <AdminStatTile
        :label="t('adminStatistics.uploadLogs.summary.totalUploads')"
        :value="summary ? total : null"
        :icon="LucideUpload"
        tone="primary"
        :detail="totalDetail"
        :loading="pending"
      >
        <AdminSparkline v-if="showSeries" :values="attemptSeries" class="text-primary" :label="volumeLabel" />
      </AdminStatTile>
      <AdminStatTile
        :label="t('adminStatistics.common.success')"
        :value="summary?.success ?? null"
        :icon="LucideCircleCheck"
        tone="success"
        :loading="pending"
      />
      <AdminStatTile
        :label="t('adminStatistics.common.failure')"
        :value="summary?.failed ?? null"
        :icon="LucideCircleX"
        tone="danger"
        :loading="pending"
      >
        <AdminSparkline
          v-if="showSeries && (summary?.failed ?? 0) > 0"
          :values="failureSeries"
          class="text-destructive"
          :label="failureVolumeLabel"
        />
      </AdminStatTile>
      <AdminStatTile
        :label="t('adminStatistics.uploadLogs.summary.successRate')"
        :value="rate"
        :format="ratePercentText"
        :icon="LucideGauge"
        :tone="rate != null && rate < HEALTHY_SUCCESS_RATE ? 'warning' : 'success'"
        :detail="rateDetail"
        :loading="pending"
      />
      <AdminStatTile
        :label="t('adminStatistics.uploadLogs.summary.activeAccounts')"
        :value="activeAccounts"
        :icon="LucideGamepad2"
        tone="info"
        :detail="analytics ? t('adminStatistics.uploadLogs.summary.activeAccountsHint') : null"
        :loading="analyticsPending"
      />
      <AdminStatTile
        :label="t('adminStatistics.uploadLogs.summary.latency')"
        :value="latencyP50"
        :format="durationText"
        :icon="LucideTimer"
        :detail="latencyDetail"
        :loading="analyticsPending"
      />
    </AdminStatGrid>

    <!-- Nothing to break down when the range holds no uploads at all. -->
    <div v-if="pending || total > 0" class="@container" data-testid="upload-logs-breakdowns">
      <div class="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2 @min-[72rem]:grid-cols-4">
        <LogsBreakdownPanel
          :title="t('adminStatistics.uploadLogs.charts.byMethod')"
          :ranked="methods"
          :label-of="methodLabel"
          :empty-text="t('adminStatistics.uploadLogs.charts.empty')"
          :loading="pending"
        />
        <LogsBreakdownPanel
          :title="t('adminStatistics.uploadLogs.charts.byDataType')"
          :ranked="dataTypes"
          :label-of="dataTypeLabel"
          :empty-text="t('adminStatistics.uploadLogs.charts.empty')"
          :loading="pending"
        />
        <LogsBreakdownPanel
          :title="t('adminStatistics.uploadLogs.charts.byServer')"
          :ranked="servers"
          :label-of="serverLabel"
          :empty-text="t('adminStatistics.uploadLogs.charts.empty')"
          :loading="analyticsPending"
          :error="analyticsError ? analyticsError.message : null"
          data-testid="upload-logs-by-server"
          @retry="emit('retryAnalytics')"
        />
        <LogsBreakdownPanel
          :title="t('adminStatistics.uploadLogs.charts.failureStages')"
          :ranked="failureStages"
          :label-of="stageLabel"
          :empty-text="t('adminStatistics.uploadLogs.charts.noFailures')"
          :loading="analyticsPending"
          :error="analyticsError ? analyticsError.message : null"
          data-testid="upload-logs-failure-stages"
          @retry="emit('retryAnalytics')"
        />
      </div>
    </div>
  </section>
</template>
