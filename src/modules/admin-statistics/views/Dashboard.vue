<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideBan,
  LucideDatabase,
  LucideLink,
  LucideRefreshCcw,
  LucideShield,
  LucideTriangleAlert,
  LucideUploadCloud,
  LucideUserPlus,
  LucideUsers,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile, { type AdminStatTone, type AdminStatTrend } from "@/modules/admin/components/AdminStatTile.vue"
import { percentChange } from "@/modules/admin/lib/stat-visuals"
import DashboardHourlyPanel from "@/modules/admin-statistics/components/DashboardHourlyPanel.vue"
import DashboardMethodMatrix from "@/modules/admin-statistics/components/DashboardMethodMatrix.vue"
import DashboardQualityPanel from "@/modules/admin-statistics/components/DashboardQualityPanel.vue"
import DashboardTrendPanel from "@/modules/admin-statistics/components/DashboardTrendPanel.vue"
import { useDashboardStats } from "@/modules/admin-statistics/composables/useDashboardStats"
import { readCategoryCount, toBreakdownItems, type BreakdownItem } from "@/modules/admin-statistics/lib/dashboard-breakdown"
import { buildCountMatrix, formatSignedPercent, ratio, summarizeSeries } from "@/modules/admin-statistics/lib/dashboard-metrics"
import {
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { useUserStore } from "@/shared/stores/user"
import type { TimeseriesPoint } from "@/types/admin"

const { t, te } = useI18n()
const userStore = useUserStore()

const {
  dashboard,
  loading,
  dashboardError,
  loadDashboard,
  trend,
  chartLoading,
  chartError,
  loadChart,
  pulse,
  pulseLoading,
  pulseError,
  loadPulse,
  analytics,
  analyticsLoading,
  analyticsError,
  loadAnalytics,
  rangeDays,
  bucket,
  rangeOptions,
  bucketOptions,
  onRangeChange,
  onBucketChange,
  reload,
  refreshing,
} = useDashboardStats()

const fallback = computed(() => t("adminStatistics.common.fallback"))
const uploadWindowHours = computed(() => dashboard.value?.uploads.windowHours ?? 24)
const generatedAt = computed(() => (dashboard.value ? formatLocalizedDateTime(dashboard.value.generatedAt, "dateTime") : ""))

function formatShare(share: number | null, digits = 1): string {
  return share === null ? fallback.value : formatPercent(share * 100, digits)
}

function formatPerUnit(value: number | null, digits: number): string {
  return value === null ? fallback.value : value.toFixed(digits)
}

// --- Last 24 hours against the 24 hours before (hourly timeseries) ----------
function hourlySeries(read: (point: TimeseriesPoint) => number) {
  const current = (pulse.value?.current ?? []).map(read)
  const previous = (pulse.value?.previous ?? []).map(read)
  return { current, total: summarizeSeries(current).total, previousTotal: summarizeSeries(previous).total }
}

/** A change chip against the previous 24 hours; `upIsGood` colours it. */
function dayOverDay(total: number, previousTotal: number, upIsGood: boolean): AdminStatTrend | null {
  // The comparison only means "24 h against the 24 h before" for the default window.
  if (!pulse.value || uploadWindowHours.value !== 24) return null
  const change = percentChange(total, previousTotal)
  if (!change) return null
  return {
    text: formatSignedPercent(change.percent),
    direction: change.direction,
    good: change.direction === "flat" ? undefined : (change.direction === "up") === upIsGood,
  }
}

type StatTile = {
  key: string
  label: string
  value: number | null
  icon: Component
  tone: AdminStatTone
  loading: boolean
  detail?: string | null
  trend?: AdminStatTrend | null
  spark?: { values: number[]; colorClass: string; label: string }
}

const tiles = computed<StatTile[]>(() => {
  const data = dashboard.value
  const dashboardPending = loading.value && !data
  const pulsePending = pulseLoading.value && !pulse.value
  const vsPrevious = t("adminStatistics.dashboard.stat.vsPrevious24h")
  const hours = uploadWindowHours.value

  const registrations = hourlySeries((point) => point.registrations)
  const uploads = hourlySeries((point) => point.uploads)
  const failures = hourlySeries((point) => point.uploadFailures)
  const registrationTrend = dayOverDay(registrations.total, registrations.previousTotal, true)
  const uploadTrend = dayOverDay(uploads.total, uploads.previousTotal, true)
  const failureTrend = dayOverDay(failures.total, failures.previousTotal, false)

  return [
    {
      key: "users",
      label: t("adminStatistics.dashboard.stat.totalUsers"),
      value: data?.users.total ?? null,
      icon: LucideUsers,
      tone: "primary",
      loading: dashboardPending,
      detail: data
        ? t("adminStatistics.dashboard.stat.bindingsPerUser", { count: formatPerUnit(ratio(data.bindings.total, data.users.total), 2) })
        : null,
    },
    {
      key: "registrations",
      label: t("adminStatistics.dashboard.stat.newRegistrations"),
      value: pulse.value ? registrations.total : null,
      icon: LucideUserPlus,
      tone: "info",
      loading: pulsePending,
      trend: registrationTrend,
      detail: registrationTrend ? vsPrevious : null,
      spark: { values: registrations.current, colorClass: "text-(--dash-registrations)", label: t("adminStatistics.dashboard.stat.newRegistrations") },
    },
    {
      key: "bindings",
      label: t("adminStatistics.dashboard.stat.totalBindings"),
      value: data?.bindings.total ?? null,
      icon: LucideLink,
      tone: "success",
      loading: dashboardPending,
      detail: data
        ? t("adminStatistics.dashboard.stat.verifiedBindings", {
            count: formatNumberCN(data.bindings.verified),
            percent: formatShare(ratio(data.bindings.verified, data.bindings.total)),
          })
        : null,
    },
    {
      key: "uploadsAllTime",
      label: t("adminStatistics.dashboard.stat.totalUploads"),
      value: data?.uploads.totalAllTime ?? null,
      icon: LucideDatabase,
      tone: "default",
      loading: dashboardPending,
      detail: data
        ? t("adminStatistics.dashboard.stat.uploadsPerUser", { count: formatPerUnit(ratio(data.uploads.totalAllTime, data.users.total), 1) })
        : null,
    },
    {
      key: "uploadsWindow",
      label: t("adminStatistics.dashboard.stat.uploadsWindow", { hours }),
      value: data?.uploads.total ?? null,
      icon: LucideUploadCloud,
      tone: "primary",
      loading: dashboardPending,
      trend: uploadTrend,
      detail: uploadTrend ? vsPrevious : null,
      spark: { values: uploads.current, colorClass: "text-(--dash-uploads)", label: t("adminStatistics.dashboard.hourly.title") },
    },
    {
      key: "failedWindow",
      label: t("adminStatistics.dashboard.stat.failedWindow", { hours }),
      value: data?.uploads.failed ?? null,
      icon: LucideTriangleAlert,
      tone: data && data.uploads.failed > 0 ? "danger" : "default",
      loading: dashboardPending,
      trend: failureTrend,
      detail: data
        ? t("adminStatistics.dashboard.stat.failureRate", { percent: formatShare(ratio(data.uploads.failed, data.uploads.total), 2) })
        : null,
      spark: { values: failures.current, colorClass: "text-(--dash-failures)", label: t("adminStatistics.dashboard.stat.failedWindow", { hours }) },
    },
    {
      key: "staff",
      label: t("adminStatistics.dashboard.stat.staff"),
      value: data ? data.users.admin + data.users.superAdmin : null,
      icon: LucideShield,
      tone: "default",
      loading: dashboardPending,
      detail: data
        ? t("adminStatistics.dashboard.stat.staffDetail", {
            superAdmin: formatNumberCN(data.users.superAdmin),
            admin: formatNumberCN(data.users.admin),
          })
        : null,
    },
    {
      key: "banned",
      label: t("adminStatistics.dashboard.stat.banned"),
      value: data?.users.banned ?? null,
      icon: LucideBan,
      tone: data && data.users.banned > 0 ? "warning" : "default",
      loading: dashboardPending,
      detail: data
        ? t("adminStatistics.dashboard.stat.bannedShare", { percent: formatShare(ratio(data.users.banned, data.users.total), 2) })
        : null,
    },
  ]
})

// --- Breakdowns the dashboard payload carries --------------------------------
function toMeterItems(items: readonly BreakdownItem[]): AdminMeterItem[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.count,
    text: `${formatNumberCN(item.count)} · ${formatShare(item.share)}`,
  }))
}

function sumCounts(items: readonly AdminMeterItem[]): number {
  return items.reduce((total, item) => total + item.value, 0)
}

const windowHint = computed(() => t("adminStatistics.dashboard.breakdown.windowHint", { hours: uploadWindowHours.value }))

const breakdowns = computed(() => {
  const data = dashboard.value
  const build = (entries: readonly unknown[] | undefined, legacyField: string, labelOf: (key: string) => string) =>
    toMeterItems(toBreakdownItems(entries, (entry) => readCategoryCount(entry, legacyField), labelOf))
  return [
    {
      key: "method",
      title: t("adminStatistics.dashboard.breakdown.byMethod"),
      description: windowHint.value,
      items: build(data?.uploads.byMethod, "method", (key) => resolveUploadMethodLabel(key, t)),
    },
    {
      key: "dataType",
      title: t("adminStatistics.dashboard.breakdown.byDataType"),
      description: windowHint.value,
      items: build(data?.uploads.byDataType, "dataType", (key) => resolveUploadDataTypeLabel(key, t)),
    },
    {
      key: "server",
      title: t("adminStatistics.dashboard.breakdown.byServer"),
      description: t("adminStatistics.dashboard.breakdown.byServerHint"),
      items: build(data?.bindings.byServer, "server", (key) => resolveUploadServerLabel(key, t)),
    },
  ]
})

// The backend names the pair fields `uploadMethod` / `dataType`.
const methodMatrix = computed(() => buildCountMatrix(
  (dashboard.value?.uploads.byMethodAndDataType ?? []).map((entry: unknown) => {
    const pair = readCategoryCount(entry, "uploadMethod")
    const record = entry as { method?: unknown; dataType?: unknown } | null
    const method = pair.key ?? (typeof record?.method === "string" ? record.method : undefined)
    return { row: method, column: typeof record?.dataType === "string" ? record.dataType : undefined, count: pair.count }
  }),
))

// --- Failure stages (upload analytics) ---------------------------------------
const FAILURE_STAGE_KEY: Record<string, string> = {
  build_context: "buildContext",
  account_policy: "accountPolicy",
  decode_payload: "decodePayload",
  validate_payload_identity: "validatePayloadIdentity",
  preprocess: "preprocess",
  persist: "persist",
  validate_result: "validateResult",
  decrypt: "decrypt",
  stale: "stale",
  unknown: "unknown",
}

function failureStageLabel(stage: string): string {
  const known = FAILURE_STAGE_KEY[stage]
  if (known && te(`adminStatistics.dashboard.failureStage.${known}`)) {
    return t(`adminStatistics.dashboard.failureStage.${known}`)
  }
  if (stage.startsWith("retrieve_")) {
    return t("adminStatistics.dashboard.failureStage.retrieve", { type: resolveUploadDataTypeLabel(stage.slice("retrieve_".length), t) })
  }
  return stage
}

const failureStageItems = computed<AdminMeterItem[]>(() => {
  const stages = analytics.value?.failureStages ?? []
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)
  return stages.map((stage) => ({
    key: stage.key,
    label: failureStageLabel(stage.key),
    value: stage.count,
    text: `${formatNumberCN(stage.count)} · ${formatShare(ratio(stage.count, total))}`,
    color: "var(--dash-failures)",
  }))
})
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-4">
    <div class="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <p class="tabular-nums">
        <template v-if="generatedAt">{{ t("adminStatistics.dashboard.generatedAt", { time: generatedAt }) }}</template>
      </p>
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 px-2 text-xs text-muted-foreground" :disabled="refreshing" @click="reload">
        <LucideRefreshCcw :class="['size-3.5', refreshing ? 'animate-spin' : '']" aria-hidden="true" />
        {{ t("adminStatistics.dashboard.refresh") }}
      </Button>
    </div>

    <!-- A failed dashboard load replaces the figures: zeros would read as data. -->
    <div v-if="dashboardError" class="rounded-xl border bg-card px-4">
      <LoadErrorState
        :title="t('adminStatistics.dashboard.toast.loadFailedTitle')"
        :description="dashboardError.message"
        :detail="dashboardError.detail"
        :retrying="loading"
        @retry="loadDashboard"
      />
    </div>

    <AdminStatGrid v-else :columns="4" data-testid="statistics-kpis">
      <AdminStatTile
        v-for="tile in tiles"
        :key="tile.key"
        :label="tile.label"
        :value="tile.value"
        :icon="tile.icon"
        :tone="tile.tone"
        :detail="tile.detail"
        :trend="tile.trend"
        :loading="tile.loading"
      >
        <AdminSparkline
          v-if="tile.spark && tile.spark.values.length > 1"
          :values="tile.spark.values"
          :width="60"
          :class="tile.spark.colorClass"
          :label="tile.spark.label"
        />
      </AdminStatTile>
    </AdminStatGrid>

    <DashboardTrendPanel
      :trend="trend"
      :loading="chartLoading"
      :error="chartError"
      :range-days="rangeDays"
      :bucket="bucket"
      :range-options="rangeOptions"
      :bucket-options="bucketOptions"
      @update:range="onRangeChange"
      @update:bucket="onBucketChange"
      @retry="loadChart"
    />

    <DashboardHourlyPanel :pulse="pulse" :loading="pulseLoading" :error="pulseError" @retry="loadPulse" />

    <div v-if="!dashboardError" class="@container">
      <div class="grid grid-cols-1 gap-4 @min-[44rem]:grid-cols-3">
        <AdminPanel
          v-for="breakdown in breakdowns"
          :key="breakdown.key"
          :title="breakdown.title"
          :description="breakdown.description"
        >
          <!-- Remounted when the data lands, so the bars grow in from zero. -->
          <AdminMeterList
            :key="dashboard ? 'ready' : 'loading'"
            :items="breakdown.items"
            :total="sumCounts(breakdown.items)"
            :loading="loading && !dashboard"
            :empty-text="t('adminStatistics.dashboard.breakdown.empty')"
          />
        </AdminPanel>
      </div>
    </div>

    <!-- A failed analytics load is reported once, by the quality panel below. -->
    <div v-if="!dashboardError || !analyticsError" class="@container">
      <div
        :class="[
          'grid grid-cols-1 gap-4',
          !dashboardError && !analyticsError ? '@min-[52rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : '',
        ]"
      >
        <DashboardMethodMatrix
          v-if="!dashboardError"
          :matrix="methodMatrix"
          :loading="loading && !dashboard"
          :description="windowHint"
        />
        <AdminPanel
          v-if="!analyticsError"
          :title="t('adminStatistics.dashboard.failureStage.title')"
          :description="t('adminStatistics.dashboard.failureStage.description')"
        >
          <AdminMeterList
            :key="analytics ? 'ready' : 'loading'"
            :items="failureStageItems"
            :total="sumCounts(failureStageItems)"
            :loading="analyticsLoading && !analytics"
            :empty-text="t('adminStatistics.dashboard.failureStage.empty')"
          />
        </AdminPanel>
      </div>
    </div>

    <DashboardQualityPanel
      :analytics="analytics"
      :loading="analyticsLoading"
      :error="analyticsError"
      :restricted="!userStore.isSuperAdmin"
      @retry="loadAnalytics"
    />
  </div>
</template>

<style>
/*
 * Series colours of the dashboard's charts, validated as a set against the card
 * surface of each theme (dataviz palette checks, all pairs). Global because the
 * chart tooltips render under <body>, outside this view.
 */
:root {
  --dash-uploads: #0d9488;
  --dash-registrations: #2a78d6;
  --dash-failures: #d03b3b;
}

.dark {
  --dash-uploads: #14a89a;
  --dash-registrations: #3987e5;
  --dash-failures: #dc4a4a;
}
</style>
