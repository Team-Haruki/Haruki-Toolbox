<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideArrowLeft,
  LucideSend,
  LucideLoader2,
  LucideCircleDot,
  LucideClock,
  LucideCheckCircle2,
  LucideXCircle,
  LucideUserCog,
  LucideFlame,
  LucideChevronUp,
  LucideMinus,
  LucideChevronDown,
} from "lucide-vue-next"
import { getAdminTicketDetail, addAdminTicketMessage, updateTicketStatus, assignTicket } from "@/api/tickets"
import { getUsers } from "@/api/admin/users"
import type { TicketDetail, TicketMessage, TicketStatus } from "@/types/ticket"
import type { AdminUser } from "@/types/admin"

const props = defineProps<{ ticketId: string }>()
const router = useRouter()

const loading = ref(true)
const ticket = ref<TicketDetail | null>(null)
const newMessage = ref("")
const isInternal = ref(false)
const sending = ref(false)
const actionLoading = ref(false)
const messageContainer = ref<HTMLElement>()
const assigneeId = ref("")
const adminUsers = ref<AdminUser[]>([])

async function loadAdmins() {
  try {
    const [admins, superAdmins] = await Promise.all([
      getUsers({ role: 'admin', page_size: 100 }),
      getUsers({ role: 'super_admin', page_size: 100 }),
    ])
    const all = [...(admins.items ?? []), ...(superAdmins.items ?? [])]
    // Deduplicate by userId
    const map = new Map<string, AdminUser>()
    all.forEach(u => map.set(u.userId, u))
    adminUsers.value = Array.from(map.values())
  } catch {
    // Silently fail — Select will just be empty
  }
}

async function loadTicket() {
  loading.value = true
  try {
    ticket.value = await getAdminTicketDetail(props.ticketId)
    // If creator info is missing, try to get from first non-admin message
    if (!ticket.value.creatorUserId && ticket.value.messages?.length) {
      const userMsg = ticket.value.messages.find(m => m.senderRole === 'user')
      if (userMsg) {
        ticket.value.creatorUserId = userMsg.senderId
        ticket.value.creatorUserName = userMsg.senderName
      }
    }
    assigneeId.value = ticket.value.assigneeAdminId || ""
    await nextTick()
    scrollToBottom()
  } catch (e: unknown) {
    toast.error("加载工单详情失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

async function sendMessage() {
  if (!newMessage.value.trim()) return
  sending.value = true
  try {
    await addAdminTicketMessage(props.ticketId, {
      message: newMessage.value.trim(),
      internal: isInternal.value,
    })
    newMessage.value = ""
    await loadTicket()
  } catch (e: unknown) {
    toast.error("发送失败", { description: (e as Error).message })
  } finally {
    sending.value = false
  }
}

async function handleStatusChange(newStatus: unknown) {
  if (!newStatus) return
  const statusStr = String(newStatus) as TicketStatus
  actionLoading.value = true
  try {
    await updateTicketStatus(props.ticketId, { status: statusStr })
    toast.success(`状态已更新为 ${statusLabel(statusStr)}`)
    await loadTicket()
  } catch (e: unknown) {
    toast.error("更新状态失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleAssign() {
  actionLoading.value = true
  try {
    const realId = assigneeId.value === '__none__' ? '' : assigneeId.value
    await assignTicket(props.ticketId, { assigneeAdminId: realId || undefined })
    toast.success(realId ? "已分配处理人" : "已取消分配")
    await loadTicket()
  } catch (e: unknown) {
    toast.error("分配失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadTicket()
  loadAdmins()
})

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
    case "open": return "text-blue-500"
    case "in_progress": return "text-orange-500"
    case "resolved": return "text-green-500"
    case "closed": return "text-gray-500"
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

function priorityLabel(p: string) {
  switch (p) {
    case "urgent": return "紧急"
    case "high": return "高"
    case "medium": return "中"
    case "low": return "低"
    default: return p
  }
}

function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "low": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    default: return ""
  }
}

function priorityIcon(p: string) {
  switch (p) {
    case "urgent": return LucideFlame
    case "high": return LucideChevronUp
    case "medium": return LucideMinus
    case "low": return LucideChevronDown
    default: return null
  }
}

const isAdmin = (msg: TicketMessage) => msg.senderRole === "admin"
</script>

<template>
  <div class="w-full flex flex-col gap-4 h-full">
    <Button variant="ghost" size="sm" class="self-start" @click="router.push('/admin/tickets')">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> 返回工单列表
    </Button>

    <template v-if="loading">
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="ticket">
      <!-- 工单信息 + 操作 -->
      <Card>
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{{ ticket.subject }}</CardTitle>
              <CardDescription class="mt-2 flex items-center gap-2 text-sm">
                <span>{{ ticket.category }}</span>
                <span>·</span>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', priorityColor(ticket.priority)]">
                  <component :is="priorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="priorityIcon(ticket.priority)" />
                  {{ priorityLabel(ticket.priority) }}优先级
                </span>
                <span>·</span>
                <span>用户: {{ ticket.creatorUserName ? `${ticket.creatorUserName} (${ticket.creatorUserId})` : ticket.creatorUserId || '未知' }}</span>
                <span>·</span>
                <span>创建于 {{ new Date(ticket.createdAt).toLocaleString('zh-CN') }}</span>
              </CardDescription>
            </div>
            <span :class="['inline-flex items-center gap-1 text-sm font-medium flex-shrink-0', statusColor(ticket.status)]">
              <component :is="statusIcon(ticket.status)" class="w-4 h-4" />
              {{ statusLabel(ticket.status) }}
            </span>
          </div>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-3 items-end border-t pt-4">
          <!-- 状态变更 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">变更状态</Label>
            <Select :model-value="ticket.status" @update:model-value="handleStatusChange" :disabled="actionLoading">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">已开启</SelectItem>
                <SelectItem value="in_progress">处理中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 分配处理人 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">处理人</Label>
            <div class="flex gap-2">
              <Select v-model="assigneeId">
                <SelectTrigger class="w-48">
                  <SelectValue placeholder="选择处理人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未分配</SelectItem>
                  <SelectItem v-for="admin in adminUsers" :key="admin.userId" :value="admin.userId">
                    {{ admin.name }} ({{ admin.userId }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleAssign">
                <LucideUserCog class="w-4 h-4 mr-1" /> 分配
              </Button>
            </div>
          </div>

          <LucideLoader2 v-if="actionLoading" class="w-4 h-4 animate-spin self-center" />
        </CardContent>
      </Card>

      <!-- 消息列表 -->
      <Card class="flex-1 flex flex-col min-h-0">
        <CardContent class="flex-1 flex flex-col p-0 min-h-0">
          <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4 max-h-[28rem]">
            <template v-if="ticket.messages.length > 0">
              <div
                v-for="msg in ticket.messages"
                :key="msg.id"
                :class="['flex', isAdmin(msg) ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[80%] rounded-2xl px-4 py-2.5',
                    msg.internal
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-br-md'
                      : isAdmin(msg)
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                  ]"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="['text-xs font-medium', msg.internal ? 'text-amber-600 dark:text-amber-400' : isAdmin(msg) ? 'text-primary-foreground/70' : 'opacity-70']">
                      {{ msg.senderName || (isAdmin(msg) ? '管理员' : '用户') }}
                    </span>
                    <span v-if="msg.internal" class="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium">内部备注</span>
                  </div>
                  <p :class="['text-sm whitespace-pre-wrap break-words', msg.internal ? 'text-amber-900 dark:text-amber-100' : '']">{{ msg.message }}</p>
                  <div :class="['text-xs mt-1', msg.internal ? 'text-amber-500' : isAdmin(msg) ? 'text-primary-foreground/60' : 'text-muted-foreground']">
                    {{ new Date(msg.createdAt).toLocaleString('zh-CN') }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-muted-foreground py-8">暂无消息</div>
            </template>
          </div>

          <!-- 输入区 -->
          <div class="border-t p-3 flex flex-col gap-2">
            <div class="flex gap-2 items-stretch">
              <textarea
                v-model="newMessage"
                :placeholder="isInternal ? '输入内部备注（仅管理员可见）…' : '输入回复…'"
                rows="2"
                :class="[
                  'flex-1 rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 resize-none',
                  isInternal
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400'
                    : 'bg-transparent border-input focus-visible:ring-ring'
                ]"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <Button 
                :class="['h-auto min-w-[5rem] shrink-0 flex flex-col items-center justify-center gap-1.5 transition-colors', isInternal ? 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700' : '']"
                :variant="isInternal ? 'default' : 'default'"
                :disabled="sending || !newMessage.trim()" 
                @click="sendMessage"
              >
                <LucideLoader2 v-if="sending" class="w-4 h-4 animate-spin" />
                <LucideSend v-else class="w-4 h-4" />
                <span class="text-xs tracking-widest">{{ isInternal ? '备注' : '发送' }}</span>
              </Button>
            </div>
            <div class="flex items-center gap-2">
              <Switch :model-value="isInternal" @update:model-value="(v: boolean) => isInternal = v" id="internal-toggle" />
              <Label for="internal-toggle" class="text-xs text-muted-foreground">
                内部备注（仅管理员可见）
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <template v-else>
      <Card>
        <CardContent class="py-16 text-center text-muted-foreground">
          工单不存在或加载失败
        </CardContent>
      </Card>
    </template>
  </div>
</template>
