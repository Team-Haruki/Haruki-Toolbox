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
import { useDashboardStats } from "@/modules/admin-statistics/composables/useDashboardStats"
import { formatNumberCN } from "@/lib/number-format"

const { t } = useI18n()

const {
  loading,
  dashboard,
  chartData,
  chartLoading,
  rangeDays,
  bucket,
  rangeOptions,
  bucketOptions,
  onRangeChange,
  onBucketChange,
  statCards,
  x,
  yUploads,
  yRegistrations,
  yFailures,
  crosshairTemplate,
  xTickFormat,
} = useDashboardStats()

// Mid-tone series colors that stay legible on both themes. They intentionally
// match the hex values hardcoded in the composable's crosshair template.
const seriesColors = {
  uploads: "#3b82f6",
  registrations: "#22c55e",
  failures: "#ef4444",
} as const

const legendItems = computed(() => [
  { key: "uploads", label: t("adminStatistics.dashboard.chart.uploads"), color: seriesColors.uploads },
  { key: "registrations", label: t("adminStatistics.dashboard.chart.registrations"), color: seriesColors.registrations },
  { key: "failures", label: t("adminStatistics.dashboard.chart.failures"), color: seriesColors.failures },
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
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- KPI section: primary totals + compact 24h summary row -->
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Card v-for="card in statCards" :key="card.key" class="gap-2 py-5">
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <CardTitle class="text-sm font-medium">{{ card.label }}</CardTitle>
          <component :is="card.icon" :class="['h-4 w-4 shrink-0', card.color]" />
        </CardHeader>
        <CardContent>
          <Skeleton v-if="loading" class="h-8 w-20" />
          <div v-else class="text-2xl font-bold tabular-nums">{{ formatNumberCN(card.getter(), "0") }}</div>
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
        <template v-else-if="chartData.length > 0">
          <div class="h-64">
            <VisXYContainer :data="chartData" :height="256">
              <VisArea :x="x" :y="yUploads" :color="seriesColors.uploads" :opacity="0.15" curveType="monotoneX" />
              <VisLine :x="x" :y="yUploads" :color="seriesColors.uploads" curveType="monotoneX" />
              <VisScatter :x="x" :y="yUploads" :color="seriesColors.uploads" :size="4" />
              <VisLine :x="x" :y="yRegistrations" :color="seriesColors.registrations" curveType="monotoneX" />
              <VisScatter :x="x" :y="yRegistrations" :color="seriesColors.registrations" :size="4" />
              <VisLine :x="x" :y="yFailures" :color="seriesColors.failures" curveType="monotoneX" />
              <VisScatter :x="x" :y="yFailures" :color="seriesColors.failures" :size="4" />
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tickFormat="xTickFormat" />
              <VisAxis type="y" />
            </VisXYContainer>
          </div>
        </template>
        <template v-else>
          <div class="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
            <LucideChartLine class="h-8 w-8 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminStatistics.dashboard.chart.empty") }}</p>
          </div>
        </template>
        <div
          v-if="chartLoading || chartData.length > 0"
          class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm"
        >
          <div v-for="item in legendItems" :key="item.key" class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
            {{ item.label }}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
