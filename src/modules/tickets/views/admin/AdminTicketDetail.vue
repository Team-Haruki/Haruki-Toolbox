<script setup lang="ts">
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
  LucideUserCog,
  LucideMessageSquare,
} from "lucide-vue-next"
import {
  ticketPriorityBadgeClass,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
  ticketStatusTextClass,
} from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import { useAdminTicketDetail } from "@/modules/tickets/composables/useAdminTicketDetail"
import type { TicketDetail, TicketMessage } from "@/types/ticket"

const props = defineProps<{ ticketId: string }>()
const { t, locale } = useI18n()
const {
  loading,
  refreshing,
  ticket,
  newMessage,
  isInternal,
  sending,
  actionLoading,
  messageContainer,
  assigneeId,
  adminUsers,
  adminUsersLoading,
  adminUsersLoadFailed,
  statusOptions,
  sendMessage,
  handleStatusChange,
  handleAssign,
  loadAdmins,
  goBack,
  isAdmin,
} = useAdminTicketDetail(() => props.ticketId)

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
  return isTicketCategory(category) ? ticketCategoryLabel(category, t) : category
}

function formatCreator(ticketDetail: TicketDetail) {
  if (ticketDetail.creatorUserName && ticketDetail.creatorUserId) {
    return `${ticketDetail.creatorUserName} (${ticketDetail.creatorUserId})`
  }
  return ticketDetail.creatorUserName || ticketDetail.creatorUserId || t("tickets.adminDetail.unknownUser")
}

function formatAssignee(ticketDetail: TicketDetail) {
  return ticketDetail.assigneeAdminName || ticketDetail.assigneeAdminId || t("tickets.adminDetail.unassigned")
}

function messageSenderLabel(message: TicketMessage) {
  if (message.senderName) return message.senderName
  switch (message.senderRole) {
    case "admin":
      return t("tickets.adminDetail.adminSender")
    case "system":
      return t("tickets.adminDetail.systemSender")
    case "user":
    default:
      return t("tickets.adminDetail.userSender")
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4 h-full">
    <Button variant="ghost" size="sm" class="self-start" @click="goBack">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.adminDetail.backButton") }}
    </Button>

    <template v-if="loading">
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="ticket">
      <!-- Ticket summary -->
      <Card>
        <CardHeader class="pb-2 gap-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <CardTitle>{{ ticket.subject }}</CardTitle>
              <CardDescription class="mt-1 break-all">{{ ticket.ticketId }}</CardDescription>
            </div>
            <span :class="['inline-flex items-center gap-1 text-sm font-medium flex-shrink-0', ticketStatusTextClass(ticket.status)]">
              <component :is="ticketStatusIcon(ticket.status)" class="w-4 h-4" />
              {{ ticketStatusLabel(ticket.status) }}
            </span>
          </div>
        </CardHeader>
        <CardContent class="border-t pt-4">
          <div class="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.category") }}</div>
              <div class="font-medium">{{ formatCategory(ticket.category) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.priority") }}</div>
              <span :class="['mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', ticketPriorityBadgeClass(ticket.priority)]">
                <component :is="ticketPriorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="ticketPriorityIcon(ticket.priority)" />
                {{ ticketPriorityLabel(ticket.priority) }}
              </span>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.creator") }}</div>
              <div class="font-medium break-all">{{ formatCreator(ticket) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.assignee") }}</div>
              <div class="font-medium break-all">{{ formatAssignee(ticket) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.createdAt") }}</div>
              <div class="font-medium">{{ formatDateTime(ticket.createdAt) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.updatedAt") }}</div>
              <div class="font-medium">{{ formatDateTime(ticket.updatedAt) }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Ticket actions -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <CardTitle class="text-base">{{ t("tickets.adminDetail.actionsTitle") }}</CardTitle>
              <CardDescription>{{ t("tickets.adminDetail.actionsDescription") }}</CardDescription>
            </div>
            <LucideLoader2 v-if="actionLoading" class="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent class="flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-end">
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">{{ t("tickets.adminDetail.statusChangeLabel") }}</Label>
            <Select :key="locale" :model-value="ticket.status" @update:model-value="handleStatusChange" :disabled="actionLoading">
              <SelectTrigger class="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label class="text-xs">{{ t("tickets.adminDetail.assigneeLabel") }}</Label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <Select
                :key="locale"
                v-model="assigneeId"
                :disabled="adminUsersLoading || adminUsersLoadFailed || actionLoading"
              >
                <SelectTrigger class="w-full sm:w-72">
                  <SelectValue :placeholder="t('tickets.adminDetail.assigneePlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{{ t("tickets.adminDetail.unassigned") }}</SelectItem>
                  <SelectItem v-for="admin in adminUsers" :key="admin.userId" :value="admin.userId">
                    {{ admin.name }} ({{ admin.userId }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                class="shrink-0"
                :disabled="actionLoading || adminUsersLoading || adminUsersLoadFailed"
                @click="handleAssign"
              >
                <LucideUserCog class="w-4 h-4 mr-1" /> {{ t("tickets.adminDetail.assignButton") }}
              </Button>
            </div>
            <div v-if="adminUsersLoading" class="text-xs text-muted-foreground">
              {{ t("tickets.adminDetail.assigneeLoading") }}
            </div>
            <div v-else-if="adminUsersLoadFailed" class="flex items-center gap-2 text-xs text-destructive">
              <span>{{ t("tickets.adminDetail.assigneeLoadFailedHint") }}</span>
              <Button variant="ghost" size="sm" class="h-auto px-2 py-1" @click="loadAdmins">
                {{ t("tickets.adminDetail.retryLoadAssignees") }}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Message list -->
      <Card class="flex-1 flex flex-col min-h-0">
        <CardHeader class="pb-3 border-b">
          <div class="flex items-center gap-2">
            <LucideMessageSquare class="w-4 h-4 text-muted-foreground" />
            <div>
              <CardTitle class="text-base">{{ t("tickets.adminDetail.messagesTitle") }}</CardTitle>
              <CardDescription>{{ t("tickets.adminDetail.messagesDescription") }}</CardDescription>
            </div>
            <LucideLoader2 v-if="refreshing" class="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </CardHeader>
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
                      {{ messageSenderLabel(msg) }}
                    </span>
                    <span
                      v-if="msg.internal"
                      class="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium"
                    >
                      {{ t("tickets.adminDetail.internalTag") }}
                    </span>
                  </div>
                  <p :class="['text-sm whitespace-pre-wrap break-words', msg.internal ? 'text-amber-900 dark:text-amber-100' : '']">{{ msg.message }}</p>
                  <div :class="['text-xs mt-1', msg.internal ? 'text-amber-500' : isAdmin(msg) ? 'text-primary-foreground/60' : 'text-muted-foreground']">
                    {{ formatDateTime(msg.createdAt) }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-muted-foreground py-8">{{ t("tickets.adminDetail.noMessages") }}</div>
            </template>
          </div>

          <!-- Input area -->
          <div
            data-glass-surface="compose-bar"
            class="sticky bottom-0 flex flex-col gap-2 border-t border-white/55 bg-background/82 p-3 shadow-[0_-14px_34px_-28px_rgba(15,23,42,0.8)] backdrop-blur-md supports-[backdrop-filter]:bg-background/68 dark:border-white/10 dark:bg-slate-950/70 dark:supports-[backdrop-filter]:bg-slate-950/56"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-medium">
                {{ isInternal ? t("tickets.adminDetail.compose.internalTitle") : t("tickets.adminDetail.compose.replyTitle") }}
              </div>
              <div class="flex items-center gap-2">
                <Switch :model-value="isInternal" @update:model-value="(v: boolean) => isInternal = v" id="internal-toggle" />
                <Label for="internal-toggle" class="text-xs text-muted-foreground">
                  {{ t("tickets.adminDetail.internalSwitchLabel") }}
                </Label>
              </div>
            </div>
            <div class="flex gap-2 items-stretch">
              <textarea
                v-model="newMessage"
                :placeholder="isInternal ? t('tickets.adminDetail.internalInputPlaceholder') : t('tickets.adminDetail.replyInputPlaceholder')"
                rows="2"
                :class="[
                  'flex-1 rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 resize-none',
                  isInternal
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400'
                    : 'bg-transparent border-input focus-visible:ring-ring'
                ]"
                @keydown.enter.exact="handleComposeEnter"
              />
              <Button 
                :class="['h-auto min-w-[5rem] shrink-0 flex flex-col items-center justify-center gap-1.5 transition-colors', isInternal ? 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700' : '']"
                :variant="isInternal ? 'default' : 'default'"
                :disabled="sending || !newMessage.trim()" 
                @click="sendMessage"
              >
                <LucideLoader2 v-if="sending" class="w-4 h-4 animate-spin" />
                <LucideSend v-else class="w-4 h-4" />
                <span class="text-xs tracking-widest">{{ isInternal ? t("tickets.adminDetail.noteButton") : t("tickets.adminDetail.sendButton") }}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <template v-else>
      <Card>
        <CardContent class="py-16 text-center text-muted-foreground">
          {{ t("tickets.adminDetail.notFound") }}
        </CardContent>
      </Card>
    </template>
  </div>
</template>
