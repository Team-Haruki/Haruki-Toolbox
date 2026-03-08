<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { toast } from "vue-sonner"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideDownload,
  LucideInfo,
  LucideCheckCircle,
  LucideXCircle,
} from "lucide-vue-next"
import { getSystemLogs, getSystemLogSummary, getSystemLogDetail, exportSystemLogs } from "@/api/admin/statistics"
import type { SystemLog, SystemLogSummary } from "@/types/admin"

const loading = ref(true)
const logs = ref<SystemLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref("")
const searchTimer = ref<ReturnType<typeof setTimeout>>()

const summary = ref<SystemLogSummary | null>(null)
const summaryLoading = ref(true)

// 详情弹窗
const detailOpen = ref(false)
const detailLog = ref<SystemLog | null>(null)
const detailLoading = ref(false)

async function loadLogs() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (search.value.trim()) params.q = search.value.trim()
    const res = await getSystemLogs(params)
    logs.value = res.items
    total.value = res.total
  } catch (e: unknown) {
    toast.error("加载日志失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  summaryLoading.value = true
  try {
    summary.value = await getSystemLogSummary()
  } catch (e: unknown) {
    toast.error("加载日志摘要失败", { description: (e as Error).message })
  } finally {
    summaryLoading.value = false
  }
}

async function showDetail(id: number | string) {
  detailOpen.value = true
  detailLoading.value = true
  try {
    detailLog.value = await getSystemLogDetail(String(id))
  } catch (e: unknown) {
    toast.error("加载详情失败", { description: (e as Error).message })
  } finally {
    detailLoading.value = false
  }
}

async function handleExport() {
  try {
    const blob = await exportSystemLogs() as unknown as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("导出成功")
  } catch (e: unknown) {
    toast.error("导出失败", { description: (e as Error).message })
  }
}

watch(search, () => {
  clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => { page.value = 1; loadLogs() }, 400)
})

onMounted(() => { loadLogs(); loadSummary() })

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize.value))
function prevPage() { if (page.value > 1) { page.value--; loadLogs() } }
function nextPage() { if (page.value < totalPages()) { page.value++; loadLogs() } }

function resultColor(result?: string) {
  switch (result) {
    case "success": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "failure": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

function formatTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("zh-CN")
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 日志摘要 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <Card v-for="item in [
        { label: '总日志', value: summary?.total, color: 'text-foreground' },
        { label: '成功', value: summary?.success, color: 'text-green-500' },
        { label: '失败', value: summary?.failure, color: 'text-red-500' },
      ]" :key="item.label">
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">{{ item.label }}</div>
          <template v-if="summaryLoading">
            <Skeleton class="h-8 w-16 mt-1" />
          </template>
          <template v-else>
            <div :class="['text-2xl font-bold tabular-nums mt-1', item.color]">
              {{ item.value?.toLocaleString() ?? '—' }}
            </div>
          </template>
        </CardContent>
      </Card>
    </div>

    <!-- 操作栏 -->
    <Card>
      <CardContent class="p-4 flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-[200px]">
          <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input v-model="search" placeholder="搜索日志…" class="pl-9" />
        </div>
        <Button variant="outline" size="sm" @click="handleExport">
          <LucideDownload class="w-4 h-4 mr-1" /> 导出
        </Button>
      </CardContent>
    </Card>

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
                <TableHead class="w-20">结果</TableHead>
                <TableHead>操作</TableHead>
                <TableHead class="hidden sm:table-cell">方法</TableHead>
                <TableHead class="hidden md:table-cell">用户</TableHead>
                <TableHead>时间</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in logs" :key="log.id">
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', resultColor(log.result)]">
                    <LucideCheckCircle v-if="log.result === 'success'" class="w-3 h-3" />
                    <LucideXCircle v-else class="w-3 h-3" />
                    {{ log.result === 'success' ? '成功' : '失败' }}
                  </span>
                </TableCell>
                <TableCell class="max-w-[200px] truncate font-mono text-sm">{{ log.action }}</TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground text-sm font-mono">
                  {{ log.method || '—' }} {{ log.path || '' }}
                </TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
                  {{ log.actorUserId || '—' }}
                  <span v-if="log.actorRole" class="text-xs opacity-60">({{ log.actorRole }})</span>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm whitespace-nowrap">
                  {{ formatTime(log.eventTime) }}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" @click="showDetail(log.id)">
                    <LucideInfo class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="logs.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">暂无日志</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">共 {{ total }} 条日志</span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages() }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages()" @click="nextPage">
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>日志详情</DialogTitle>
        </DialogHeader>
        <template v-if="detailLoading">
          <Skeleton class="h-32 w-full" />
        </template>
        <template v-else-if="detailLog">
          <div class="flex flex-col gap-3 text-sm">
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">结果</span>
              <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', resultColor(detailLog.result)]">
                {{ detailLog.result === 'success' ? '成功' : '失败' }}
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">时间</span>
              <span>{{ formatTime(detailLog.eventTime) }}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">操作</span>
              <span class="font-mono">{{ detailLog.action }}</span>
            </div>
            <div v-if="detailLog.method" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">请求</span>
              <span class="font-mono">{{ detailLog.method }} {{ detailLog.path }}</span>
            </div>
            <div v-if="detailLog.actorUserId" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">用户</span>
              <span>{{ detailLog.actorUserId }}
                <span v-if="detailLog.actorRole" class="text-xs text-muted-foreground">({{ detailLog.actorRole }})</span>
              </span>
            </div>
            <div v-if="detailLog.ip" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">IP</span>
              <span class="font-mono">{{ detailLog.ip }}</span>
            </div>
            <div v-if="detailLog.userAgent" class="flex flex-col gap-1">
              <span class="text-muted-foreground">User Agent</span>
              <p class="bg-muted p-3 rounded-md text-xs break-words">{{ detailLog.userAgent }}</p>
            </div>
            <div v-if="detailLog.detail" class="flex flex-col gap-1">
              <span class="text-muted-foreground">详情</span>
              <pre class="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-words">{{ detailLog.detail }}</pre>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>
  </div>
</template>
