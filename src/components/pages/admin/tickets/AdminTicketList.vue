<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleDot,
  LucideClock,
  LucideCheckCircle2,
  LucideXCircle,
  LucideFlame,
  LucideChevronUp,
  LucideMinus,
  LucideChevronDown,
} from "lucide-vue-next"
import { getAdminTickets } from "@/api/tickets"
import type { Ticket, TicketStatus, TicketPriority } from "@/types/ticket"

const router = useRouter()
const loading = ref(true)
const tickets = ref<Ticket[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref("")
const statusFilter = ref("all")
const priorityFilter = ref("all")
const searchTimer = ref<ReturnType<typeof setTimeout>>()

async function loadTickets() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (search.value.trim()) params.q = search.value.trim()
    if (statusFilter.value !== "all") params.status = statusFilter.value
    if (priorityFilter.value !== "all") params.priority = priorityFilter.value
    const res = await getAdminTickets(params)
    tickets.value = res.items
    total.value = res.total
  } catch (e: unknown) {
    toast.error("加载工单列表失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => { page.value = 1; loadTickets() }, 400)
})
watch([statusFilter, priorityFilter], () => { page.value = 1; loadTickets() })
onMounted(loadTickets)

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize.value))
function prevPage() { if (page.value > 1) { page.value--; loadTickets() } }
function nextPage() { if (page.value < totalPages()) { page.value++; loadTickets() } }

function statusLabel(s: TicketStatus) {
  switch (s) {
    case "open": return "已开启"
    case "in_progress": return "处理中"
    case "resolved": return "已解决"
    case "closed": return "已关闭"
  }
}

function statusColor(s: TicketStatus) {
  switch (s) {
    case "open": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "in_progress": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "resolved": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "closed": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

function priorityLabel(p: TicketPriority) {
  switch (p) {
    case "urgent": return "紧急"
    case "high": return "高"
    case "medium": return "中"
    case "low": return "低"
  }
}

function priorityColor(p: TicketPriority) {
  switch (p) {
    case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "low": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

function statusIcon(s: TicketStatus) {
  switch (s) {
    case "open": return LucideCircleDot
    case "in_progress": return LucideClock
    case "resolved": return LucideCheckCircle2
    case "closed": return LucideXCircle
  }
}

function priorityIcon(p: TicketPriority) {
  switch (p) {
    case "urgent": return LucideFlame
    case "high": return LucideChevronUp
    case "medium": return LucideMinus
    case "low": return LucideChevronDown
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 操作栏 -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">工单管理</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="relative flex-1 min-w-[200px]">
            <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input v-model="search" placeholder="搜索工单…" class="pl-9" />
          </div>
          <Select v-model="statusFilter">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="open">已开启</SelectItem>
              <SelectItem value="in_progress">处理中</SelectItem>
              <SelectItem value="resolved">已解决</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="priorityFilter">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              <SelectItem value="urgent">紧急</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- 工单表格 -->
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
                <TableHead>主题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead class="hidden sm:table-cell">创建者</TableHead>
                <TableHead class="hidden md:table-cell">处理人</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="t in tickets"
                :key="t.ticketId"
                class="cursor-pointer hover:bg-muted/50 transition-colors"
                @click="router.push(`/admin/tickets/${t.ticketId}`)"
              >
                <TableCell class="font-medium max-w-[200px] truncate">{{ t.subject }}</TableCell>
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', statusColor(t.status)]">
                    <component :is="statusIcon(t.status)" class="w-3.5 h-3.5" />
                    {{ statusLabel(t.status) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', priorityColor(t.priority)]">
                    <component :is="priorityIcon(t.priority)" class="w-3.5 h-3.5" />
                    {{ priorityLabel(t.priority) }}
                  </span>
                </TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground">{{ t.creatorUserName || t.creatorUserId }}</TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground">{{ t.assigneeAdminName || t.assigneeAdminId || '未分配' }}</TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ new Date(t.updatedAt).toLocaleDateString('zh-CN') }}</TableCell>
              </TableRow>
              <TableRow v-if="tickets.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">暂无工单</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">共 {{ total }} 个工单</span>
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
  </div>
</template>
