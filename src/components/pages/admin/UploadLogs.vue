<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { toast } from "vue-sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideSearch,
  LucideFilter,
  LucideRefreshCw,
  LucideCheckCircle,
  LucideXCircle,
  LucideUpload,
  LucideTrendingUp,
  LucideTrendingDown,
  LucidePieChart,
} from "lucide-vue-next"
import { VisSingleContainer, VisDonut } from "@unovis/vue"
import { RouterLink } from "vue-router"
import { getUploadLogs } from "@/api/admin/statistics"
import type { UploadLog, UploadLogsResponse, UploadLogsSummary } from "@/types/admin"

// ===== 状态 =====
const loading = ref(true)
const logs = ref<UploadLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const summary = ref<UploadLogsSummary | null>(null)
const responseFrom = ref("")
const responseTo = ref("")
const filtersExpanded = ref(true)

// ===== 筛选器 =====
const filterFrom = ref<Date>()
const filterTo = ref<Date>()
const filterMethod = ref<string>("all")
const filterDataType = ref<string>("all")
const filterServer = ref<string>("all")
const filterSuccess = ref<string>("all")
const filterSort = ref<string>("upload_time_desc")
const filterGameUserId = ref("")

// ===== 常量 =====
const uploadMethods = [
  { value: "all", label: "全部方式" },
  { value: "manual", label: "手动上传" },
  { value: "ios_proxy", label: "iOS代理" },
  { value: "ios_script", label: "iOS脚本" },
  { value: "haruki_proxy", label: "HarukiProxy" },
  { value: "inherit", label: "继承码" },
]

const servers = [
  { value: "all", label: "全部区服" },
  { value: "jp", label: "日服" },
  { value: "en", label: "国际服" },
  { value: "tw", label: "台服" },
  { value: "kr", label: "韩服" },
  { value: "cn", label: "国服" },
]

const sortOptions = [
  { value: "upload_time_desc", label: "上传时间 ↓" },
  { value: "upload_time_asc", label: "上传时间 ↑" },
  { value: "id_desc", label: "ID ↓" },
  { value: "id_asc", label: "ID ↑" },
]

const successOptions = [
  { value: "all", label: "全部状态" },
  { value: "true", label: "成功" },
  { value: "false", label: "失败" },
]

// ===== 加载 =====
async function loadLogs() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
      sort: filterSort.value,
    }
    if (filterFrom.value) params.from = filterFrom.value.toISOString()
    if (filterTo.value) params.to = filterTo.value.toISOString()
    if (filterMethod.value && filterMethod.value !== "all") params.upload_method = filterMethod.value
    if (filterDataType.value && filterDataType.value !== "all") params.data_type = filterDataType.value
    if (filterServer.value && filterServer.value !== "all") params.server = filterServer.value
    if (filterSuccess.value !== "all") params.success = filterSuccess.value
    if (filterGameUserId.value.trim()) params.game_user_id = filterGameUserId.value.trim()

    const res: UploadLogsResponse = await getUploadLogs(params)
    logs.value = res.items ?? []
    total.value = res.total ?? 0
    summary.value = res.summary ?? null
    responseFrom.value = res.from ?? ""
    responseTo.value = res.to ?? ""
  } catch (e: unknown) {
    toast.error("加载上传日志失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  loadLogs()
}

function resetFilters() {
  filterFrom.value = undefined
  filterTo.value = undefined
  filterMethod.value = "all"
  filterDataType.value = "all"
  filterServer.value = "all"
  filterSuccess.value = "all"
  filterSort.value = "upload_time_desc"
  filterGameUserId.value = ""
  page.value = 1
  loadLogs()
}

onMounted(() => loadLogs())

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
function prevPage() { if (page.value > 1) { page.value--; loadLogs() } }
function nextPage() { if (page.value < totalPages.value) { page.value++; loadLogs() } }

// ===== 工具函数 =====
function methodLabel(method?: string) {
  return uploadMethods.find(m => m.value === method)?.label ?? method ?? "—"
}

function serverLabel(server?: string) {
  return servers.find(s => s.value === server)?.label ?? server ?? "—"
}

function formatTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("zh-CN")
}

function dataTypeLabel(type?: string) {
  if (type === "suite") return "基础数据"
  if (type === "mysekai") return "增强数据/MySekai"
  return type || "—"
}

const successRate = computed(() => {
  if (!summary.value) return null
  const total = summary.value.success + summary.value.failed
  if (total === 0) return null
  return ((summary.value.success / total) * 100).toFixed(1)
})

const timeRangeLabel = computed(() => {
  if (!responseFrom.value || !responseTo.value) return ""
  return `${formatTime(responseFrom.value)} — ${formatTime(responseTo.value)}`
})

const donutData = computed(() => {
  if (!summary.value) return []
  return [
    { key: '成功', value: summary.value.success, color: '#22c55e' },
    { key: '失败', value: summary.value.failed, color: '#ef4444' },
  ].filter(d => d.value > 0)
})

const donutValue = (d: { value: number }) => d.value
const donutColor = (d: { color: string }) => d.color

// Chart color palette
const chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16']

const methodChartData = computed(() => {
  if (!summary.value?.byMethod?.length) return []
  return [...summary.value.byMethod]
    .sort((a, b) => b.count - a.count)
    .map((item, i) => ({
      label: methodLabel(item.key),
      value: item.count,
      color: chartColors[i % chartColors.length],
    }))
})

const methodTotal = computed(() => methodChartData.value.reduce((s, d) => s + d.value, 0))

const dataTypeChartData = computed(() => {
  if (!summary.value?.byDataType?.length) return []
  return [...summary.value.byDataType]
    .sort((a, b) => b.count - a.count)
    .map((item, i) => ({
      label: dataTypeLabel(item.key),
      value: item.count,
      color: chartColors[i % chartColors.length],
    }))
})

const dataTypeTotal = computed(() => dataTypeChartData.value.reduce((s, d) => s + d.value, 0))
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 筛选器 -->
    <Card>
      <CardHeader class="pb-3 cursor-pointer" @click="filtersExpanded = !filtersExpanded">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <LucideFilter class="w-5 h-5 text-muted-foreground" />
            <CardTitle class="text-base">筛选条件</CardTitle>
          </div>
          <Button variant="ghost" size="sm" class="text-muted-foreground">
            {{ filtersExpanded ? '收起' : '展开' }}
          </Button>
        </div>
      </CardHeader>
      <CardContent v-if="filtersExpanded" class="pt-0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- 时间范围 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">开始时间</Label>
            <DateTimePicker24h v-model="filterFrom" placeholder="选择开始时间" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">结束时间</Label>
            <DateTimePicker24h v-model="filterTo" placeholder="选择结束时间" />
          </div>

          <!-- 游戏UID -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">游戏UID</Label>
            <Input v-model="filterGameUserId" placeholder="多个UID用逗号分隔" />
          </div>

          <!-- 上传方式 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">上传方式</Label>
            <Select v-model="filterMethod">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="全部方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in uploadMethods" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 区服 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">区服</Label>
            <Select v-model="filterServer">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="全部区服" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in servers" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 状态 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">上传状态</Label>
            <Select v-model="filterSuccess">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in successOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 排序 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">排序</Label>
            <Select v-model="filterSort">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex flex-wrap flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
          <div class="flex items-center gap-2">
            <Button size="sm" @click="applyFilters">
              <LucideSearch class="w-4 h-4 mr-1" />
              查询
            </Button>
            <Button variant="outline" size="sm" @click="resetFilters">
              <LucideRefreshCw class="w-4 h-4 mr-1" />
              重置
            </Button>
          </div>
          <span v-if="timeRangeLabel" class="text-xs text-muted-foreground mr-1">
            时间范围: {{ timeRangeLabel }}
          </span>
        </div>
      </CardContent>
    </Card>

    <!-- 汇总统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="px-4 py-0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <LucideUpload class="w-4 h-4" />
            总上传数
          </div>
          <template v-if="loading">
            <Skeleton class="h-8 w-20 mt-1" />
          </template>
          <template v-else>
            <div class="text-2xl font-bold tabular-nums mt-1">
              {{ total.toLocaleString() }}
            </div>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="px-4 py-0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <LucideCheckCircle class="w-4 h-4 text-green-500" />
            成功
          </div>
          <template v-if="loading">
            <Skeleton class="h-8 w-20 mt-1" />
          </template>
          <template v-else>
            <div class="text-2xl font-bold tabular-nums mt-1 text-green-600 dark:text-green-400">
              {{ summary?.success?.toLocaleString() ?? '—' }}
            </div>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="px-4 py-0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <LucideXCircle class="w-4 h-4 text-red-500" />
            失败
          </div>
          <template v-if="loading">
            <Skeleton class="h-8 w-20 mt-1" />
          </template>
          <template v-else>
            <div class="text-2xl font-bold tabular-nums mt-1 text-red-600 dark:text-red-400">
              {{ summary?.failed?.toLocaleString() ?? '—' }}
            </div>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="px-4 py-0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <component :is="(successRate && Number(successRate) >= 90) ? LucideTrendingUp : LucideTrendingDown"
              :class="['w-4 h-4', (successRate && Number(successRate) >= 90) ? 'text-green-500' : 'text-orange-500']" />
            成功率
          </div>
          <template v-if="loading">
            <Skeleton class="h-8 w-20 mt-1" />
          </template>
          <template v-else>
            <div :class="['text-2xl font-bold tabular-nums mt-1',
              (successRate && Number(successRate) >= 90) ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400']">
              {{ successRate ? `${successRate}%` : '—' }}
            </div>
          </template>
        </CardContent>
      </Card>
    </div>

    <!-- 图表分布 -->
    <div v-if="summary && !loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 成功率甜甜圈图 -->
      <Card>
        <CardHeader class="pb-2">
          <div class="flex items-center gap-2">
            <LucidePieChart class="w-4 h-4 text-muted-foreground" />
            <CardTitle class="text-sm">成功率分布</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-0 flex flex-col items-center">
          <div class="relative w-full" style="height: 180px">
            <VisSingleContainer :data="donutData" :height="180">
              <VisDonut :value="donutValue" :color="donutColor" :arcWidth="30" :padAngle="0.02" :cornerRadius="4" />
            </VisSingleContainer>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="text-center">
                <div :class="['text-2xl font-bold tabular-nums',
                  (successRate && Number(successRate) >= 90) ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400']">
                  {{ successRate ? `${successRate}%` : '—' }}
                </div>
                <div class="text-xs text-muted-foreground">成功率</div>
              </div>
            </div>
          </div>
          <div class="flex gap-4 mt-2 text-xs">
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span> 成功 {{ summary.success.toLocaleString() }}</div>
            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> 失败 {{ summary.failed.toLocaleString() }}</div>
          </div>
        </CardContent>
      </Card>

      <!-- 按方式分布 -->
      <Card v-if="summary.byMethod?.length">
        <CardHeader class="pb-2">
          <div class="flex items-center gap-2">
            <LucidePieChart class="w-4 h-4 text-muted-foreground" />
            <CardTitle class="text-sm">按上传方式</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-0 flex flex-col items-center">
          <div class="relative w-full" style="height: 180px">
            <VisSingleContainer :data="methodChartData" :height="180">
              <VisDonut :value="donutValue" :color="donutColor" :arcWidth="28" :padAngle="0.02" :cornerRadius="4" />
            </VisSingleContainer>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="text-center">
                <div class="text-lg font-bold tabular-nums">{{ methodTotal.toLocaleString() }}</div>
                <div class="text-xs text-muted-foreground">总计</div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-xs">
            <div v-for="item in methodChartData" :key="item.label" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: item.color }"></span>
              <span>{{ item.label }}</span>
              <span class="text-muted-foreground tabular-nums">{{ item.value.toLocaleString() }} ({{ ((item.value / methodTotal) * 100).toFixed(1) }}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 按数据类型分布 -->
      <Card v-if="summary.byDataType?.length">
        <CardHeader class="pb-2">
          <div class="flex items-center gap-2">
            <LucidePieChart class="w-4 h-4 text-muted-foreground" />
            <CardTitle class="text-sm">按数据类型</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-0 flex flex-col items-center">
          <div class="relative w-full" style="height: 180px">
            <VisSingleContainer :data="dataTypeChartData" :height="180">
              <VisDonut :value="donutValue" :color="donutColor" :arcWidth="28" :padAngle="0.02" :cornerRadius="4" />
            </VisSingleContainer>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="text-center">
                <div class="text-lg font-bold tabular-nums">{{ dataTypeTotal.toLocaleString() }}</div>
                <div class="text-xs text-muted-foreground">总计</div>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-xs">
            <div v-for="item in dataTypeChartData" :key="item.label" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: item.color }"></span>
              <span>{{ item.label }}</span>
              <span class="text-muted-foreground tabular-nums">{{ item.value.toLocaleString() }} ({{ ((item.value / dataTypeTotal) * 100).toFixed(1) }}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 日志表格 -->
    <Card>
      <CardContent class="p-0">
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-6">状态</TableHead>
                <TableHead>用户</TableHead>
                <TableHead class="hidden md:table-cell">区服</TableHead>
                <TableHead class="hidden md:table-cell">方式</TableHead>
                <TableHead class="hidden lg:table-cell">数据类型</TableHead>
                <TableHead class="pr-6">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in logs" :key="log.id">
                <TableCell class="pl-6">
                  <span v-if="log.success"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <LucideCheckCircle class="w-3 h-3" />
                    成功
                  </span>
                  <span v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <LucideXCircle class="w-3 h-3" />
                    失败
                  </span>
                </TableCell>
                <TableCell>
                  <RouterLink :to="`/admin/users/${log.userId}`" class="flex flex-col hover:underline text-primary">
                    <span class="font-medium text-sm">{{ log.userName || log.userId }}</span>
                    <span v-if="log.gameUserId" class="text-xs text-muted-foreground/80">
                      UID: {{ log.gameUserId }}
                    </span>
                  </RouterLink>
                </TableCell>
                <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                  {{ serverLabel(log.server) }}
                </TableCell>
                <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                  {{ methodLabel(log.uploadMethod) }}
                </TableCell>
                <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                  {{ dataTypeLabel(log.dataType) }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground whitespace-nowrap pr-6">
                  {{ formatTime(log.uploadTime) }}
                </TableCell>
              </TableRow>
              <TableRow v-if="logs.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">
                  暂无上传日志
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">共 {{ total.toLocaleString() }} 条记录</span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
