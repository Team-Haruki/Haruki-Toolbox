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
import { VisXYContainer, VisLine, VisArea, VisAxis, VisScatter, VisCrosshair, VisTooltip } from "@unovis/vue"
import { useI18n } from "vue-i18n"
import { useDashboardStats } from "@/modules/admin-statistics/composables/useDashboardStats"
import { formatNumberCN } from "@/lib/number-format"

const { t } = useI18n()

const {
  loading,
  dashboard,
  chartData,
  chartLoading,
  statCards,
  x,
  yUploads,
  yRegistrations,
  crosshairTemplate,
  xTickFormat,
} = useDashboardStats()

const uploadSummaryCards = computed(() => {
  if (!dashboard.value) {
    return []
  }
  return [
    { key: "total24h", label: t("adminStatistics.dashboard.upload24h.total"), value: dashboard.value.uploads.total },
    { key: "success24h", label: t("adminStatistics.common.success"), value: dashboard.value.uploads.success, color: "text-green-500" },
    { key: "failed24h", label: t("adminStatistics.common.failure"), value: dashboard.value.uploads.failed, color: "text-red-500" },
    { key: "bannedUsers", label: t("adminStatistics.dashboard.upload24h.bannedUsers"), value: dashboard.value.users.banned, color: "text-red-500" },
  ] as const
})
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card v-for="card in statCards" :key="card.key">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ card.label }}</CardTitle>
          <component :is="card.icon" :class="['w-4 h-4', card.color]" />
        </CardHeader>
        <CardContent>
          <template v-if="loading">
            <Skeleton class="h-8 w-20" />
          </template>
          <template v-else>
            <div class="text-2xl font-bold tabular-nums">{{ formatNumberCN(card.getter(), "0") }}</div>
          </template>
        </CardContent>
      </Card>
    </div>

    <div v-if="dashboard" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card v-for="item in uploadSummaryCards" :key="item.key">
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground">{{ item.label }}</div>
          <div :class="['text-xl font-bold tabular-nums mt-1', item.color || '']">
            {{ formatNumberCN(item.value, "0") }}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("adminStatistics.dashboard.chart.title") }}</CardTitle>
        <CardDescription>{{ t("adminStatistics.dashboard.chart.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <template v-if="chartLoading">
          <Skeleton class="h-64 w-full" />
        </template>
        <template v-else-if="chartData.length > 0">
          <div class="h-64">
            <VisXYContainer :data="chartData" :height="250">
              <VisArea :x="x" :y="yUploads" color="#3b82f6" :opacity="0.15" curveType="monotoneX" />
              <VisLine :x="x" :y="yUploads" color="#3b82f6" curveType="monotoneX" />
              <VisScatter :x="x" :y="yUploads" color="#3b82f6" :size="4" />
              <VisLine :x="x" :y="yRegistrations" color="#22c55e" curveType="monotoneX" />
              <VisScatter :x="x" :y="yRegistrations" color="#22c55e" :size="4" />
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tickFormat="xTickFormat" />
              <VisAxis type="y" />
            </VisXYContainer>
          </div>
          <div class="flex gap-4 mt-2 text-sm">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              {{ t("adminStatistics.dashboard.chart.uploads") }}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              {{ t("adminStatistics.dashboard.chart.registrations") }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="h-64 flex items-center justify-center text-muted-foreground">
            {{ t("adminStatistics.dashboard.chart.empty") }}
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
