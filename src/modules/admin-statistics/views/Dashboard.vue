<script setup lang="ts">
import { computed } from "vue"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VisXYContainer, VisLine, VisArea, VisAxis, VisScatter, VisCrosshair, VisTooltip } from "@unovis/vue"
import { LucideChartLine } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { DashboardBreakdownCard } from "@/modules/admin-statistics/components"
import { SERIES_COLORS, useDashboardStats } from "@/modules/admin-statistics/composables/useDashboardStats"
import { formatNumberCN } from "@/lib/number-format"

const { t } = useI18n()

const {
  loading,
  dashboard,
  dashboardError,
  chartData,
  chartLoading,
  chartError,
  rangeDays,
  bucket,
  rangeOptions,
  bucketOptions,
  onRangeChange,
  onBucketChange,
  statCards,
  serverBreakdown,
  methodBreakdown,
  dataTypeBreakdown,
  uploadWindowHours,
  loadDashboard,
  loadChart,
  x,
  yUploads,
  yRegistrations,
  yFailures,
  uploadYDomain,
  uploadTickValues,
  uploadsTickFormat,
  failuresTickFormat,
  uploadCrosshairTemplate,
  registrationCrosshairTemplate,
  xTickFormat,
} = useDashboardStats()

// Fixed margins so the hand-drawn right axis can share the plot's tick positions.
const UPLOAD_CHART_HEIGHT = 256
const UPLOAD_CHART_MARGIN = { top: 8, right: 44, bottom: 28, left: 52 } as const

function rightAxisTickTop(tick: number): string {
  const [, max] = uploadYDomain.value
  const plotHeight = UPLOAD_CHART_HEIGHT - UPLOAD_CHART_MARGIN.top - UPLOAD_CHART_MARGIN.bottom
  const ratio = max > 0 ? tick / max : 0
  return `${UPLOAD_CHART_MARGIN.top + (1 - ratio) * plotHeight}px`
}

// The upload chart carries two measures of different scale, so the legend names
// the axis each one is read against. Registrations draw alone and need no legend.
const uploadLegendItems = computed(() => [
  { key: "uploads", label: t("adminStatistics.dashboard.chart.uploadsAxis"), color: SERIES_COLORS.uploads },
  { key: "failures", label: t("adminStatistics.dashboard.chart.failuresAxis"), color: SERIES_COLORS.failures },
])

const uploadSummaryCards = computed(() => [
  {
    key: "total24h",
    label: t("adminStatistics.dashboard.upload24h.total"),
    value: dashboard.value?.uploads.total ?? 0,
    color: "",
  },
  {
    key: "success24h",
    label: t("adminStatistics.common.success"),
    value: dashboard.value?.uploads.success ?? 0,
    color: "text-green-500",
  },
  {
    key: "failed24h",
    label: t("adminStatistics.common.failure"),
    value: dashboard.value?.uploads.failed ?? 0,
    color: "text-red-500",
  },
  {
    key: "bannedUsers",
    label: t("adminStatistics.dashboard.upload24h.bannedUsers"),
    value: dashboard.value?.users.banned ?? 0,
    color: "text-red-500",
  },
])

const windowDescription = computed(() => t("adminStatistics.dashboard.breakdown.windowHint", { hours: uploadWindowHours.value }))
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- A failed dashboard load replaces the KPI cards: zeros would read as data. -->
    <Card v-if="dashboardError">
      <CardContent>
        <LoadErrorState
          :title="t('adminStatistics.dashboard.toast.loadFailedTitle')"
          :description="dashboardError.message"
          :detail="dashboardError.detail"
          :retrying="loading"
          @retry="loadDashboard"
        />
      </CardContent>
    </Card>

    <template v-else>
      <!-- KPI section: primary totals + compact 24h summary row -->
      <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card v-for="card in statCards" :key="card.key" class="gap-2 py-5">
          <CardHeader class="flex flex-row items-center justify-between space-y-0">
            <CardTitle class="text-sm font-medium">{{ card.label }}</CardTitle>
            <component :is="card.icon" :class="['h-4 w-4 shrink-0', card.color]" />
          </CardHeader>
          <CardContent>
            <Skeleton v-if="loading" class="h-8 w-20" />
            <template v-else>
              <div class="text-2xl font-bold tabular-nums">{{ formatNumberCN(card.value, "0") }}</div>
              <p v-if="card.secondary" class="mt-1 text-xs text-muted-foreground tabular-nums">
                {{ card.secondary.label }} {{ formatNumberCN(card.secondary.value, "0") }}
              </p>
            </template>
          </CardContent>
        </Card>
      </div>

      <Card class="py-4">
        <CardContent class="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <div v-for="item in uploadSummaryCards" :key="item.key" class="flex min-w-0 flex-col gap-1">
            <span class="truncate text-xs text-muted-foreground">{{ item.label }}</span>
            <Skeleton v-if="loading" class="h-6 w-14" />
            <span v-else :class="['text-lg font-bold leading-6 tabular-nums', item.color]">
              {{ formatNumberCN(item.value, "0") }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Breakdowns the dashboard payload already carries -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardBreakdownCard
          :title="t('adminStatistics.dashboard.breakdown.byServer')"
          :description="t('adminStatistics.dashboard.breakdown.byServerHint')"
          :items="serverBreakdown"
          :loading="loading"
          :empty-text="t('adminStatistics.dashboard.breakdown.empty')"
        />
        <DashboardBreakdownCard
          :title="t('adminStatistics.dashboard.breakdown.byMethod')"
          :description="windowDescription"
          :items="methodBreakdown"
          :loading="loading"
          :empty-text="t('adminStatistics.dashboard.breakdown.empty')"
        />
        <DashboardBreakdownCard
          :title="t('adminStatistics.dashboard.breakdown.byDataType')"
          :description="windowDescription"
          :items="dataTypeBreakdown"
          :loading="loading"
          :empty-text="t('adminStatistics.dashboard.breakdown.empty')"
        />
      </div>
    </template>

    <Card>
      <CardHeader>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1.5">
            <CardTitle>{{ t("adminStatistics.dashboard.chart.title") }}</CardTitle>
            <CardDescription>{{ t("adminStatistics.dashboard.chart.description") }}</CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <Label id="statistics-chart-range-label" for="statistics-chart-range" class="sr-only">
              {{ t("adminStatistics.dashboard.chart.rangeLabel") }}
            </Label>
            <Select id="statistics-chart-range" :model-value="String(rangeDays)" @update:model-value="onRangeChange">
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
            <Select id="statistics-chart-bucket" :model-value="bucket" @update:model-value="onBucketChange">
              <SelectTrigger aria-labelledby="statistics-chart-bucket-label" size="sm" class="min-w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in bucketOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <template v-if="chartLoading">
          <Skeleton class="h-64 w-full" />
        </template>
        <template v-else-if="chartError">
          <LoadErrorState
            :title="t('adminStatistics.dashboard.toast.loadChartFailedTitle')"
            :description="chartError.message"
            :detail="chartError.detail"
            :retrying="chartLoading"
            @retry="loadChart"
          />
        </template>
        <template v-else-if="chartData.length > 0">
          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section class="min-w-0" aria-labelledby="statistics-upload-trend-title">
              <h3 id="statistics-upload-trend-title" class="mb-2 text-sm font-medium">
                {{ t("adminStatistics.dashboard.chart.uploadTitle") }}
              </h3>
              <div class="relative h-64" data-testid="statistics-upload-trend">
                <VisXYContainer
                  :data="chartData"
                  :height="UPLOAD_CHART_HEIGHT"
                  :yDomain="uploadYDomain"
                  :margin="UPLOAD_CHART_MARGIN"
                  :autoMargin="false"
                >
                  <VisArea :x="x" :y="yUploads" :color="SERIES_COLORS.uploads" :opacity="0.15" curveType="monotoneX" />
                  <VisLine :x="x" :y="yUploads" :color="SERIES_COLORS.uploads" curveType="monotoneX" />
                  <VisScatter :x="x" :y="yUploads" :color="SERIES_COLORS.uploads" :size="4" />
                  <VisLine :x="x" :y="yFailures" :color="SERIES_COLORS.failures" curveType="monotoneX" />
                  <VisScatter :x="x" :y="yFailures" :color="SERIES_COLORS.failures" :size="4" />
                  <VisCrosshair :template="uploadCrosshairTemplate" />
                  <VisTooltip />
                  <VisAxis type="x" :tickFormat="xTickFormat" />
                  <VisAxis type="y" :tickValues="uploadTickValues" :tickFormat="uploadsTickFormat" />
                </VisXYContainer>
                <!-- Unovis keeps one y scale per container, so the failure axis is drawn by
                     hand: the same tick positions, labelled on the failure scale. -->
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 text-xs text-muted-foreground"
                  :style="{ width: `${UPLOAD_CHART_MARGIN.right}px` }"
                  data-testid="statistics-upload-right-axis"
                  aria-hidden="true"
                >
                  <span
                    v-for="tick in uploadTickValues"
                    :key="tick"
                    class="absolute left-2 -translate-y-1/2 tabular-nums"
                    :style="{ top: rightAxisTickTop(tick) }"
                  >
                    {{ failuresTickFormat(tick) }}
                  </span>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                <div v-for="item in uploadLegendItems" :key="item.key" class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                  {{ item.label }}
                </div>
              </div>
            </section>
            <section class="min-w-0" aria-labelledby="statistics-registration-trend-title">
              <h3 id="statistics-registration-trend-title" class="mb-2 text-sm font-medium">
                {{ t("adminStatistics.dashboard.chart.registrationTitle") }}
              </h3>
              <div class="h-64" data-testid="statistics-registration-trend">
                <VisXYContainer :data="chartData" :height="256">
                  <VisArea :x="x" :y="yRegistrations" :color="SERIES_COLORS.registrations" :opacity="0.15" curveType="monotoneX" />
                  <VisLine :x="x" :y="yRegistrations" :color="SERIES_COLORS.registrations" curveType="monotoneX" />
                  <VisScatter :x="x" :y="yRegistrations" :color="SERIES_COLORS.registrations" :size="4" />
                  <VisCrosshair :template="registrationCrosshairTemplate" />
                  <VisTooltip />
                  <VisAxis type="x" :tickFormat="xTickFormat" />
                  <VisAxis type="y" />
                </VisXYContainer>
              </div>
            </section>
          </div>
        </template>
        <template v-else>
          <div class="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
            <LucideChartLine class="h-8 w-8 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminStatistics.dashboard.chart.empty") }}</p>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
