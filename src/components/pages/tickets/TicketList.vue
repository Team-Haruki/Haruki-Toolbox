<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucidePlus,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleDot,
  LucideCheckCircle2,
  LucideClock,
  LucideXCircle,
  LucideFlame,
  LucideChevronUp,
  LucideMinus,
  LucideChevronDown,
} from "lucide-vue-next"
import { getUserTickets } from "@/api/tickets"
import type { Ticket, TicketStatus } from "@/types/ticket"

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const tickets = ref<Ticket[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const statusFilter = ref<string>("all")

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "已开启" },
  { value: "in_progress", label: "处理中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
]

async function loadTickets() {
  if (!userStore.userId) return
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (statusFilter.value !== "all") {
      params.status = statusFilter.value
    }
    const res = await getUserTickets(userStore.userId, params)
    tickets.value = res.items
    total.value = res.total
  } catch (e: unknown) {
    toast.error("加载工单列表失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

watch(statusFilter, () => {
  page.value = 1
  loadTickets()
})

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push("/user/login")
    return
  }
  loadTickets()
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function prevPage() { if (page.value > 1) { page.value--; loadTickets() } }
function nextPage() { if (page.value < totalPages.value) { page.value++; loadTickets() } }

function statusIcon(status: TicketStatus) {
  switch (status) {
    case "open": return LucideCircleDot
    case "in_progress": return LucideClock
    case "resolved": return LucideCheckCircle2
    case "closed": return LucideXCircle
  }
}

function statusLabel(status: TicketStatus) {
  switch (status) {
    case "open": return "已开启"
    case "in_progress": return "处理中"
    case "resolved": return "已解决"
    case "closed": return "已关闭"
  }
}

function statusColor(status: TicketStatus) {
  switch (status) {
    case "open": return "text-blue-500"
    case "in_progress": return "text-orange-500"
    case "resolved": return "text-green-500"
    case "closed": return "text-gray-500"
  }
}

function priorityLabel(p: string) {
  switch (p) {
    case "urgent": return "紧急"
    case "high": return "高"
    case "medium": return "中"
    case "normal": return "普通"
    case "low": return "低"
    default: return p
  }
}

function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "normal": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "low": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    default: return "bg-gray-100 text-gray-700"
  }
}

function priorityIcon(p: string) {
  switch (p) {
    case "urgent": return LucideFlame
    case "high": return LucideChevronUp
    case "medium": return LucideMinus
    case "normal": return LucideMinus
    case "low": return LucideChevronDown
    default: return null
  }
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">我的工单</h1>
      <Button @click="router.push('/tickets/new')">
        <LucidePlus class="w-4 h-4 mr-1" /> 创建工单
      </Button>
    </div>

    <!-- 筛选 -->
    <div class="flex items-center gap-3">
      <Select v-model="statusFilter">
        <SelectTrigger class="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 工单列表 -->
    <template v-if="loading">
      <Skeleton v-for="i in 3" :key="i" class="h-24 w-full" />
    </template>
    <template v-else-if="tickets.length > 0">
      <Card
        v-for="ticket in tickets"
        :key="ticket.ticketId"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push(`/tickets/${ticket.ticketId}`)"
      >
        <CardContent class="py-0 flex flex-col gap-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-base truncate">{{ ticket.subject }}</h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span :class="['inline-flex items-center gap-1 text-xs font-medium', statusColor(ticket.status)]">
                  <component :is="statusIcon(ticket.status)" class="w-3.5 h-3.5" />
                  {{ statusLabel(ticket.status) }}
                </span>
                <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', priorityColor(ticket.priority)]">
                  <component :is="priorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="priorityIcon(ticket.priority)" />
                  {{ priorityLabel(ticket.priority) }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ ticket.category }}
                </span>
              </div>
            </div>
            <span class="text-xs text-muted-foreground whitespace-nowrap">
              {{ new Date(ticket.updatedAt).toLocaleDateString('zh-CN') }}
            </span>
          </div>
        </CardContent>
      </Card>
    </template>
    <template v-else>
      <Card>
        <CardContent class="py-12 text-center text-muted-foreground">
          暂无工单，点击上方按钮创建
        </CardContent>
      </Card>
    </template>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">共 {{ total }} 个工单</span>
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
