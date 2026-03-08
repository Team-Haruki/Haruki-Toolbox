<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { VisXYContainer, VisLine, VisArea, VisAxis, VisScatter, VisCrosshair, VisTooltip } from "@unovis/vue"
import {
  LucideUsers,
  LucideShield,
  LucideUploadCloud,
  LucideLink,
} from "lucide-vue-next"
import { getDashboard, getTimeseries } from "@/api/admin/statistics"
import type { DashboardData, TimeseriesPoint } from "@/types/admin"

const loading = ref(true)
const dashboard = ref<DashboardData | null>(null)
const chartData = ref<TimeseriesPoint[]>([])
const chartLoading = ref(true)

async function loadDashboard() {
  loading.value = true
  try {
    dashboard.value = await getDashboard()
  } catch (e: unknown) {
    toast.error("加载仪表盘失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

async function loadChart() {
  chartLoading.value = true
  try {
    const res = await getTimeseries({ bucket: "day" })
    chartData.value = res.points || []
  } catch (e: unknown) {
    toast.error("加载图表失败", { description: (e as Error).message })
  } finally {
    chartLoading.value = false
  }
}

onMounted(() => { loadDashboard(); loadChart() })

const statCards = [
  { key: "totalUsers", label: "总用户数", icon: LucideUsers, color: "text-blue-500", getter: () => dashboard.value?.users.total ?? 0 },
  { key: "superAdmin", label: "超级管理员", icon: LucideShield, color: "text-purple-500", getter: () => dashboard.value?.users.superAdmin ?? 0 },
  { key: "totalBindings", label: "游戏绑定", icon: LucideLink, color: "text-green-500", getter: () => dashboard.value?.bindings.total ?? 0 },
  { key: "totalUploads", label: "总上传 (全部)", icon: LucideUploadCloud, color: "text-orange-500", getter: () => dashboard.value?.uploads.totalAllTime ?? 0 },
]

const x = (_: TimeseriesPoint, i: number) => i
const yUploads = (d: TimeseriesPoint) => d.uploads
const yRegistrations = (d: TimeseriesPoint) => d.registrations

const crosshairTemplate = (d: TimeseriesPoint) => {
  const date = d.time ? new Date(d.time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''
  return `<div style="font-size:12px;padding:4px 8px;background:var(--background);border:1px solid var(--border);border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="font-weight:600;margin-bottom:2px">${date}</div>
    <div style="color:#3b82f6">上传: ${d.uploads}</div>
    <div style="color:#22c55e">注册: ${d.registrations}</div>
  </div>`
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <!-- 统计卡片 -->
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
            <div class="text-2xl font-bold tabular-nums">{{ card.getter().toLocaleString() }}</div>
          </template>
        </CardContent>
      </Card>
    </div>

    <!-- 24小时上传统计 -->
    <div v-if="dashboard" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card v-for="item in [
        { label: '24h 上传总量', value: dashboard.uploads.total },
        { label: '24h 成功', value: dashboard.uploads.success, color: 'text-green-500' },
        { label: '24h 失败', value: dashboard.uploads.failed, color: 'text-red-500' },
        { label: '被封用户', value: dashboard.users.banned, color: 'text-red-500' },
      ]" :key="item.label">
        <CardContent class="p-4">
          <div class="text-xs text-muted-foreground">{{ item.label }}</div>
          <div :class="['text-xl font-bold tabular-nums mt-1', item.color || '']">
            {{ item.value.toLocaleString() }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 时序图表 -->
    <Card>
      <CardHeader>
        <CardTitle>趋势图</CardTitle>
        <CardDescription>注册与上传趋势</CardDescription>
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
              <VisAxis type="x" :tickFormat="(i: number) => chartData[i]?.time ? new Date(chartData[i].time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''" />
              <VisAxis type="y" />
            </VisXYContainer>
          </div>
          <div class="flex gap-4 mt-2 text-sm">
            <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> 上传</div>
            <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> 注册</div>
          </div>
        </template>
        <template v-else>
          <div class="h-64 flex items-center justify-center text-muted-foreground">暂无数据</div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
