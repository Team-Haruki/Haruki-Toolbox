<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideArrowLeft,
  LucideSend,
  LucideLoader2,
  LucideCircleDot,
  LucideXCircle,
  LucideClock,
  LucideCheckCircle2,
  LucideFlame,
  LucideChevronUp,
  LucideMinus,
  LucideChevronDown,
} from "lucide-vue-next"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getUserTicketDetail, addUserTicketMessage, closeTicket } from "@/api/tickets"
import type { TicketDetail, TicketMessage, TicketStatus } from "@/types/ticket"

const props = defineProps<{ ticketId: string }>()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const ticket = ref<TicketDetail | null>(null)
const newMessage = ref("")
const sending = ref(false)
const closing = ref(false)
const messageContainer = ref<HTMLElement>()

async function loadTicket() {
  if (!userStore.userId) return
  loading.value = true
  try {
    ticket.value = await getUserTicketDetail(userStore.userId, props.ticketId)
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
  if (!newMessage.value.trim() || !userStore.userId) return
  sending.value = true
  try {
    await addUserTicketMessage(userStore.userId, props.ticketId, {
      message: newMessage.value.trim(),
    })
    newMessage.value = ""
    await loadTicket()
  } catch (e: unknown) {
    toast.error("发送失败", { description: (e as Error).message })
  } finally {
    sending.value = false
  }
}

async function handleClose() {
  if (!userStore.userId) return
  closing.value = true
  try {
    await closeTicket(userStore.userId, props.ticketId)
    toast.success("工单已关闭")
    await loadTicket()
  } catch (e: unknown) {
    toast.error("关闭失败", { description: (e as Error).message })
  } finally {
    closing.value = false
  }
}

onMounted(loadTicket)

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

const isOpen = computed(() => ticket.value && ticket.value.status !== "closed")
const isMe = (msg: TicketMessage) => msg.senderId === userStore.userId
</script>

<template>
  <div class="w-full max-w-3xl mx-auto flex flex-col gap-4 h-full">
    <Button variant="ghost" size="sm" class="self-start" @click="router.push('/tickets')">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> 返回工单列表
    </Button>

    <template v-if="loading">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="ticket">
      <!-- 工单信息 -->
      <Card>
        <CardHeader class="py-0">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <CardTitle class="truncate">{{ ticket.subject }}</CardTitle>
              <CardDescription class="mt-2 flex items-center gap-2 text-sm flex-wrap">
                <span>{{ ticket.category }}</span>
                <span>·</span>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', priorityColor(ticket.priority)]">
                  <component :is="priorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="priorityIcon(ticket.priority)" />
                  {{ priorityLabel(ticket.priority) }}优先级
                </span>
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
      </Card>

      <!-- 消息列表 -->
      <Card class="flex-1 flex flex-col min-h-0">
        <CardContent class="flex-1 flex flex-col p-0 min-h-0">
          <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            <template v-if="ticket.messages.length > 0">
              <div
                v-for="msg in ticket.messages"
                :key="msg.id"
                :class="[
                  'flex',
                  isMe(msg) ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'max-w-[80%] rounded-2xl px-4 py-2.5',
                    isMe(msg)
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  ]"
                >
                  <div v-if="!isMe(msg)" class="text-xs font-medium mb-1 opacity-70">
                    {{ msg.senderName || '管理员' }}
                  </div>
                  <p class="text-sm whitespace-pre-wrap break-words">{{ msg.message }}</p>
                  <div :class="['text-xs mt-1', isMe(msg) ? 'text-primary-foreground/60' : 'text-muted-foreground']">
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
          <div v-if="isOpen" class="border-t p-3 flex gap-2 items-stretch">
            <textarea
              v-model="newMessage"
              placeholder="输入消息…"
              rows="2"
              class="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <Button 
              class="h-auto min-w-[5rem] shrink-0 flex flex-col items-center justify-center gap-1.5 transition-colors"
              :disabled="sending || !newMessage.trim()" 
              @click="sendMessage"
            >
              <LucideLoader2 v-if="sending" class="w-4 h-4 animate-spin" />
              <LucideSend v-else class="w-4 h-4" />
              <span class="text-xs tracking-widest">发送</span>
            </Button>
          </div>
          <div v-else class="border-t p-3 text-center text-sm text-muted-foreground">
            工单已关闭，无法发送消息
          </div>
        </CardContent>
      </Card>

      <!-- 关闭 -->
      <div v-if="isOpen && ticket.status !== 'resolved'" class="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" size="sm" :disabled="closing" class="text-destructive">
              <LucideXCircle class="w-4 h-4 mr-1" /> 关闭工单
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认关闭工单</AlertDialogTitle>
              <AlertDialogDescription>关闭后将无法继续发送消息。确认关闭？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction @click="handleClose">确认关闭</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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
