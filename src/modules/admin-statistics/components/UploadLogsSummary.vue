<script setup lang="ts">
import { computed } from "vue"
import { VisDonut, VisSingleContainer } from "@unovis/vue"
import {
  LucideCheckCircle,
  LucidePieChart,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideUpload,
  LucideXCircle,
} from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "vue-i18n"
import type { UploadLogsSummary } from "@/types/admin"
import { formatNumberCN } from "@/lib/number-format"

type DonutChartItem = {
  key?: string
  label?: string
  value: number
  color: string
}

interface Props {
  loading: boolean
  total: number
  summary: UploadLogsSummary | null
  successRate: string | null
  isSuccessRateHealthy: boolean
  donutData: DonutChartItem[]
  methodChartData: DonutChartItem[]
  methodTotal: number
  dataTypeChartData: DonutChartItem[]
  dataTypeTotal: number
}

const props = defineProps<Props>()
const { t } = useI18n()

const successRateClass = computed(() =>
  props.isSuccessRateHealthy
    ? "text-green-600 dark:text-green-400"
    : "text-orange-600 dark:text-orange-400"
)

const donutValue = (item: DonutChartItem) => item.value
const donutColor = (item: DonutChartItem) => item.color
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent class="px-4 py-0">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <LucideUpload class="w-4 h-4" />
          {{ t("adminStatistics.uploadLogs.summary.totalUploads") }}
        </div>
        <template v-if="loading">
          <Skeleton class="h-8 w-20 mt-1" />
        </template>
        <template v-else>
          <div class="text-2xl font-bold tabular-nums mt-1">
            {{ formatNumberCN(total, "0") }}
          </div>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="px-4 py-0">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <LucideCheckCircle class="w-4 h-4 text-green-500" />
          {{ t("adminStatistics.common.success") }}
        </div>
        <template v-if="loading">
          <Skeleton class="h-8 w-20 mt-1" />
        </template>
        <template v-else>
          <div class="text-2xl font-bold tabular-nums mt-1 text-green-600 dark:text-green-400">
            {{ formatNumberCN(summary?.success) }}
          </div>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="px-4 py-0">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <LucideXCircle class="w-4 h-4 text-red-500" />
          {{ t("adminStatistics.common.failure") }}
        </div>
        <template v-if="loading">
          <Skeleton class="h-8 w-20 mt-1" />
        </template>
        <template v-else>
          <div class="text-2xl font-bold tabular-nums mt-1 text-red-600 dark:text-red-400">
            {{ formatNumberCN(summary?.failed) }}
          </div>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="px-4 py-0">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <component
            :is="isSuccessRateHealthy ? LucideTrendingUp : LucideTrendingDown"
            :class="['w-4 h-4', isSuccessRateHealthy ? 'text-green-500' : 'text-orange-500']"
          />
          {{ t("adminStatistics.uploadLogs.summary.successRate") }}
        </div>
        <template v-if="loading">
          <Skeleton class="h-8 w-20 mt-1" />
        </template>
        <template v-else>
          <div :class="['text-2xl font-bold tabular-nums mt-1', successRateClass]">
            {{ successRate ? `${successRate}%` : "—" }}
          </div>
        </template>
      </CardContent>
    </Card>
  </div>

  <div v-if="summary && !loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center gap-2">
          <LucidePieChart class="w-4 h-4 text-muted-foreground" />
          <CardTitle class="text-sm">{{ t("adminStatistics.uploadLogs.charts.successRateDistribution") }}</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="pt-0 flex flex-col items-center">
        <div class="relative w-full" style="height: 180px">
          <VisSingleContainer :data="donutData" :height="180">
            <VisDonut :value="donutValue" :color="donutColor" :arc-width="30" :pad-angle="0.02" :corner-radius="4" />
          </VisSingleContainer>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center">
              <div :class="['text-2xl font-bold tabular-nums', successRateClass]">
                {{ successRate ? `${successRate}%` : "—" }}
              </div>
              <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.summary.successRate") }}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-4 mt-2 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500" />
            {{ t("adminStatistics.common.success") }} {{ formatNumberCN(summary.success, "0") }}
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500" />
            {{ t("adminStatistics.common.failure") }} {{ formatNumberCN(summary.failed, "0") }}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="summary.byMethod?.length">
      <CardHeader class="pb-2">
        <div class="flex items-center gap-2">
          <LucidePieChart class="w-4 h-4 text-muted-foreground" />
          <CardTitle class="text-sm">{{ t("adminStatistics.uploadLogs.charts.byMethod") }}</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="pt-0 flex flex-col items-center">
        <div class="relative w-full" style="height: 180px">
          <VisSingleContainer :data="methodChartData" :height="180">
            <VisDonut :value="donutValue" :color="donutColor" :arc-width="28" :pad-angle="0.02" :corner-radius="4" />
          </VisSingleContainer>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center">
              <div class="text-lg font-bold tabular-nums">{{ formatNumberCN(methodTotal, "0") }}</div>
              <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.charts.total") }}</div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-xs">
          <div v-for="item in methodChartData" :key="item.label" class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: item.color }" />
            <span>{{ item.label }}</span>
            <span class="text-muted-foreground tabular-nums">
              {{ formatNumberCN(item.value, "0") }} ({{ ((item.value / methodTotal) * 100).toFixed(1) }}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="summary.byDataType?.length">
      <CardHeader class="pb-2">
        <div class="flex items-center gap-2">
          <LucidePieChart class="w-4 h-4 text-muted-foreground" />
          <CardTitle class="text-sm">{{ t("adminStatistics.uploadLogs.charts.byDataType") }}</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="pt-0 flex flex-col items-center">
        <div class="relative w-full" style="height: 180px">
          <VisSingleContainer :data="dataTypeChartData" :height="180">
            <VisDonut :value="donutValue" :color="donutColor" :arc-width="28" :pad-angle="0.02" :corner-radius="4" />
          </VisSingleContainer>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center">
              <div class="text-lg font-bold tabular-nums">{{ formatNumberCN(dataTypeTotal, "0") }}</div>
              <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.charts.total") }}</div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-xs">
          <div v-for="item in dataTypeChartData" :key="item.label" class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: item.color }" />
            <span>{{ item.label }}</span>
            <span class="text-muted-foreground tabular-nums">
              {{ formatNumberCN(item.value, "0") }} ({{ ((item.value / dataTypeTotal) * 100).toFixed(1) }}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
