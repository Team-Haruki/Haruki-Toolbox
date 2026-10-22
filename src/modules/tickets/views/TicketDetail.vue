<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { formatLocalizedDateTime } from "@/lib/date-time"
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
  LucideCheck,
  LucideSend,
  LucideLoader2,
  LucideXCircle,
} from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import {
  ticketPriorityBadgeClass,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
  ticketStatusTextClass,
  ticketUserStatusHint,
} from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import { describeSystemMessage, splitMessageLinks } from "@/modules/tickets/lib/messages"
import { useTicketDetail } from "@/modules/tickets/composables/useTicketDetail"
import type { TicketMessage } from "@/types/ticket"

const props = defineProps<{ ticketId: string }>()
const { t } = useI18n()
const {
  loading,
  loadError,
  notFound,
  ticket,
  messages,
  newMessage,
  sending,
  closing,
  justSent,
  isOpen,
  loadTicket,
  sendMessage,
  handleClose,
  isMe,
  goBackToTicketList,
} = useTicketDetail(() => props.ticketId)

const closeDialogOpen = ref(false)

function handleComposeEnter(event: KeyboardEvent) {
  // Ignore the Enter that confirms an IME composition (e.g. picking a pinyin
  // candidate); otherwise an unfinished message would be sent prematurely.
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  void sendMessage()
}

function formatDateTime(value?: string) {
  return formatLocalizedDateTime(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }, t("tickets.common.dateFallback"))
}

function formatCategory(category: string) {
  return isTicketCategory(category) ? ticketCategoryLabel(category, t) : t("tickets.common.unknownValue")
}

function isSystem(message: TicketMessage) {
  return message.senderRole === "system"
}

function messageSegments(message: TicketMessage) {
  return splitMessageLinks(isSystem(message) ? describeSystemMessage(message.message) : message.message)
}

function senderName(message: TicketMessage) {
  if (isSystem(message)) return t("tickets.detail.systemSender")
  return message.senderName || t("tickets.detail.adminSender")
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto flex min-w-0 flex-col gap-4 h-full">
    <Button variant="ghost" size="sm" class="self-start" @click="goBackToTicketList">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.detail.backButton") }}
    </Button>

    <template v-if="loading">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="ticket">
      <!-- Ticket info -->
      <Card class="min-w-0">
        <CardHeader class="py-0 gap-4">
          <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <CardTitle class="break-words line-clamp-3" :title="ticket.subject">{{ ticket.subject }}</CardTitle>
              <CardDescription class="mt-1 break-all">{{ ticket.ticketId }}</CardDescription>
            </div>
            <span :class="['inline-flex items-center gap-1 text-sm font-medium flex-shrink-0', ticketStatusTextClass(ticket.status)]">
              <component :is="ticketStatusIcon(ticket.status)" class="w-4 h-4" />
              {{ ticketStatusLabel(ticket.status) }}
            </span>
          </div>
          <div class="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {{ ticketUserStatusHint(ticket.status) }}
          </div>
          <div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.detail.summary.category") }}</div>
              <div class="font-medium">{{ formatCategory(ticket.category) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.detail.summary.priority") }}</div>
              <span :class="['mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', ticketPriorityBadgeClass(ticket.priority)]">
                <component :is="ticketPriorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="ticketPriorityIcon(ticket.priority)" />
                {{ ticketPriorityLabel(ticket.priority) }}
              </span>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.detail.summary.createdAt") }}</div>
              <div class="font-medium">{{ formatDateTime(ticket.createdAt) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.detail.summary.updatedAt") }}</div>
              <div class="font-medium">{{ formatDateTime(ticket.updatedAt) }}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <!-- Message list -->
      <Card class="flex-1 flex min-w-0 flex-col min-h-0">
        <CardContent class="flex-1 flex flex-col p-0 min-h-0">
          <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            <template v-if="messages.length > 0">
              <div
                v-for="msg in messages"
                :key="msg.id"
                :class="[
                  'flex',
                  isSystem(msg) ? 'justify-center' : isMe(msg) ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  v-if="isSystem(msg)"
                  class="max-w-[90%] rounded-full bg-muted/60 px-3 py-1 text-center text-xs text-muted-foreground"
                >
                  <span class="font-medium">{{ senderName(msg) }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ describeSystemMessage(msg.message) }}</span>
                  <span class="mx-1">·</span>
                  <span>{{ formatDateTime(msg.createdAt) }}</span>
                </div>
                <div
                  v-else
                  :class="[
                    'max-w-[80%] min-w-0 rounded-2xl px-4 py-2.5',
                    isMe(msg)
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  ]"
                >
                  <div v-if="!isMe(msg)" class="text-xs font-medium mb-1 opacity-70">
                    {{ senderName(msg) }}
                  </div>
                  <p class="text-sm whitespace-pre-wrap break-words">
                    <template v-for="(segment, index) in messageSegments(msg)" :key="index">
                      <a
                        v-if="segment.type === 'link'"
                        :href="segment.href"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        class="underline underline-offset-2 break-all"
                      >{{ segment.value }}</a>
                      <template v-else>{{ segment.value }}</template>
                    </template>
                  </p>
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
          <div
            v-if="isOpen"
            data-glass-surface="compose-bar"
            class="sticky bottom-0 flex flex-col gap-1.5 border-t p-3"
          >
            <div class="flex items-stretch gap-2">
              <textarea
                v-model="newMessage"
                :placeholder="t('tickets.detail.inputPlaceholder')"
                :aria-label="t('tickets.detail.inputPlaceholder')"
                rows="2"
                class="flex-1 min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                @keydown.enter.exact="handleComposeEnter"
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
            <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{{ t("tickets.detail.composeHint") }}</span>
              <span
                v-if="justSent"
                class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                role="status"
                aria-live="polite"
              >
                <LucideCheck class="size-3.5" aria-hidden="true" />
                {{ t("tickets.detail.sentState") }}
              </span>
            </div>
          </div>
          <div
            v-else
            data-glass-surface="compose-bar"
            class="sticky bottom-0 border-t p-3 text-center text-sm text-muted-foreground"
          >
            {{ t("tickets.detail.closedHint") }}
          </div>
        </CardContent>
      </Card>

      <!-- Close action -->
      <div v-if="isOpen" class="flex justify-end">
        <Button variant="outline" size="sm" :disabled="closing" class="text-destructive" @click="closeDialogOpen = true">
          <LucideXCircle class="w-4 h-4 mr-1" /> {{ t("tickets.detail.closeButton") }}
        </Button>
        <ConfirmDialog
          v-model:open="closeDialogOpen"
          :title="t('tickets.detail.closeDialog.title')"
          :description="t('tickets.detail.closeDialog.description')"
          :confirm-label="t('tickets.detail.closeDialog.confirm')"
          :cancel-label="t('tickets.detail.closeDialog.cancel')"
          destructive
          :on-confirm="handleClose"
        />
      </div>
    </template>

    <Card v-else-if="notFound">
      <CardContent class="py-16 text-center">
        <p class="text-base font-medium">{{ t("tickets.detail.notFound") }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ t("tickets.detail.notFoundDescription") }}</p>
        <Button variant="outline" size="sm" class="mt-4" @click="goBackToTicketList">
          <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.detail.backButton") }}
        </Button>
      </CardContent>
    </Card>

    <Card v-else>
      <CardContent>
        <LoadErrorState
          :title="t('tickets.detail.toast.loadFailedTitle')"
          :description="loadError?.message"
          :detail="loadError?.detail"
          :retrying="loading"
          @retry="loadTicket"
        />
      </CardContent>
    </Card>
  </div>
</template>
