<script setup lang="ts">
import { useI18n } from "vue-i18n"
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
  LucideXCircle,
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
import {
  ticketPriorityBadgeClass,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
  ticketStatusTextClass,
} from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import { useTicketDetail } from "@/modules/tickets/composables/useTicketDetail"

const props = defineProps<{ ticketId: string }>()
const { t, locale } = useI18n()
const {
  loading,
  ticket,
  newMessage,
  sending,
  closing,
  messageContainer,
  isOpen,
  sendMessage,
  handleClose,
  isMe,
  goBackToTicketList,
} = useTicketDetail(() => props.ticketId)

function formatDateTime(value?: string) {
  if (!value) return t("tickets.common.dateFallback")
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t("tickets.common.dateFallback")
  return date.toLocaleString(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCategory(category: string) {
  return isTicketCategory(category) ? ticketCategoryLabel(category, t) : category
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto flex flex-col gap-4 h-full">
    <Button variant="ghost" size="sm" class="self-start" @click="goBackToTicketList">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.detail.backButton") }}
    </Button>

    <template v-if="loading">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="ticket">
      <!-- Ticket info -->
      <Card>
        <CardHeader class="py-0">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <CardTitle class="truncate">{{ ticket.subject }}</CardTitle>
              <CardDescription class="mt-2 flex items-center gap-2 text-sm flex-wrap">
                <span>{{ formatCategory(ticket.category) }}</span>
                <span>·</span>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', ticketPriorityBadgeClass(ticket.priority)]">
                  <component :is="ticketPriorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="ticketPriorityIcon(ticket.priority)" />
                  {{ ticketPriorityLabel(ticket.priority) }} {{ t("tickets.detail.prioritySuffix") }}
                </span>
                <span>·</span>
                <span>{{ t("tickets.detail.createdAt", { date: formatDateTime(ticket.createdAt) }) }}</span>
              </CardDescription>
            </div>
            <span :class="['inline-flex items-center gap-1 text-sm font-medium flex-shrink-0', ticketStatusTextClass(ticket.status)]">
              <component :is="ticketStatusIcon(ticket.status)" class="w-4 h-4" />
              {{ ticketStatusLabel(ticket.status) }}
            </span>
          </div>
        </CardHeader>
      </Card>

      <!-- Message list -->
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
                    {{ msg.senderName || t("tickets.detail.adminSender") }}
                  </div>
                  <p class="text-sm whitespace-pre-wrap break-words">{{ msg.message }}</p>
                  <div :class="['text-xs mt-1', isMe(msg) ? 'text-primary-foreground/60' : 'text-muted-foreground']">
                    {{ formatDateTime(msg.createdAt) }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-muted-foreground py-8">{{ t("tickets.detail.noMessages") }}</div>
            </template>
          </div>

          <!-- Input area -->
          <div v-if="isOpen" class="border-t p-3 flex gap-2 items-stretch">
            <textarea
              v-model="newMessage"
              :placeholder="t('tickets.detail.inputPlaceholder')"
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
              <span class="text-xs tracking-widest">{{ t("tickets.detail.sendButton") }}</span>
            </Button>
          </div>
          <div v-else class="border-t p-3 text-center text-sm text-muted-foreground">
            {{ t("tickets.detail.closedHint") }}
          </div>
        </CardContent>
      </Card>

      <!-- Close action -->
      <div v-if="isOpen && ticket.status !== 'resolved'" class="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" size="sm" :disabled="closing" class="text-destructive">
              <LucideXCircle class="w-4 h-4 mr-1" /> {{ t("tickets.detail.closeButton") }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t("tickets.detail.closeDialog.title") }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t("tickets.detail.closeDialog.description") }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t("tickets.detail.closeDialog.cancel") }}</AlertDialogCancel>
              <AlertDialogAction @click="handleClose">{{ t("tickets.detail.closeDialog.confirm") }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </template>

    <template v-else>
      <Card>
        <CardContent class="py-16 text-center text-muted-foreground">
          {{ t("tickets.detail.notFound") }}
        </CardContent>
      </Card>
    </template>
  </div>
</template>
