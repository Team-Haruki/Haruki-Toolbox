<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatLocalizedDateTime } from "@/lib/date-time"
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
  LucideHourglass,
  LucideLoader2,
  LucideMessageSquare,
  LucideMessageSquareReply,
  LucideSend,
  LucideTicketX,
  LucideTimer,
  LucideUserCog,
} from "lucide-vue-next"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile, { type AdminStatTone } from "@/modules/admin/components/AdminStatTile.vue"
import { roleLabel } from "@/modules/admin-users/constants"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import AdminTicketThread from "@/modules/tickets/components/AdminTicketThread.vue"
import { adminTicketPriorityTone, adminTicketStatusTone } from "@/modules/tickets/lib/admin-ticket-display"
import { durationParts } from "@/modules/tickets/lib/admin-ticket-thread"
import {
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
} from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import { useAdminTicketDetail } from "@/modules/tickets/composables/useAdminTicketDetail"

const props = defineProps<{ ticketId: string }>()
const { t, locale } = useI18n()
const {
  loading,
  refreshing,
  ticket,
  notFound,
  loadError,
  retryLoad,
  newMessage,
  isInternal,
  sending,
  actionLoading,
  assigneeId,
  adminUsers,
  adminUsersLoading,
  adminUsersLoadFailed,
  statusOptions,
  threadSummary,
  creatorRole,
  messageRole,
  sendMessage,
  handleStatusChange,
  handleAssign,
  loadAdmins,
  goBack,
} = useAdminTicketDetail(() => props.ticketId)

function handleComposeEnter(event: KeyboardEvent) {
  // Ignore the Enter that confirms an IME composition (e.g. picking a pinyin
  // candidate); otherwise an unfinished message would be sent prematurely.
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  void sendMessage()
}

function formatDateTime(value?: string) {
  return formatLocalizedDateTime(value, "dateTime", t("tickets.common.dateFallback"))
}

function formatCategory(category: string) {
  return isTicketCategory(category) ? ticketCategoryLabel(category, t) : category
}

function formatDuration(ms: number): string {
  const parts = durationParts(ms)
  switch (parts.unit) {
    case "days":
      return t("tickets.adminDetail.duration.days", { days: parts.days, hours: parts.hours })
    case "hours":
      return t("tickets.adminDetail.duration.hours", { hours: parts.hours, minutes: parts.minutes })
    case "minutes":
      return t("tickets.adminDetail.duration.minutes", { minutes: parts.minutes })
    case "moment":
      return t("tickets.adminDetail.duration.moment")
  }
}

const creatorName = computed(() =>
  ticket.value?.creatorUserName || ticket.value?.creatorUserId || t("tickets.adminDetail.unknownUser"),
)
const assigneeName = computed(() =>
  ticket.value?.assigneeAdminName || ticket.value?.assigneeAdminId || t("tickets.adminDetail.unassigned"),
)

const firstResponse = computed(() => {
  const ms = threadSummary.value?.firstResponseMs
  return ms == null ? t("tickets.adminDetail.stats.firstResponseNone") : formatDuration(ms)
})

type WaitingTile = { label: string; text: string; detail: string | null; tone: AdminStatTone }

const waitingTile = computed<WaitingTile>(() => {
  const waiting = threadSummary.value?.waiting
  if (!waiting) {
    return { label: t("tickets.adminDetail.stats.waitingNone"), text: "—", detail: null, tone: "default" }
  }
  const text = formatDuration(waiting.ms)
  if (waiting.on === "admin") {
    return { label: t("tickets.adminDetail.stats.waitingAdmin"), text, detail: t("tickets.adminDetail.stats.waitingAdminDetail"), tone: "warning" }
  }
  if (waiting.on === "user") {
    return { label: t("tickets.adminDetail.stats.waitingUser"), text, detail: t("tickets.adminDetail.stats.waitingUserDetail"), tone: "info" }
  }
  return { label: t("tickets.adminDetail.stats.closedAfter"), text, detail: t("tickets.adminDetail.stats.closedAfterDetail"), tone: "default" }
})
</script>

<template>
  <!-- Laid out against this column (it sits beside the admin nav), not the viewport. -->
  <div class="@container w-full" data-testid="admin-ticket-detail">
    <div class="flex flex-col gap-4">
      <Button variant="ghost" size="sm" class="self-start" @click="goBack">
        <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.adminDetail.backButton") }}
      </Button>

      <div v-if="loading" class="flex flex-col gap-4" aria-busy="true">
        <Skeleton class="h-36 w-full rounded-xl" />
        <Skeleton class="h-24 w-full rounded-xl" />
        <Skeleton class="h-64 w-full rounded-xl" />
      </div>

      <!-- From 52rem: the ticket and its thread on the left, actions and figures in a
           side column. Below that the same four blocks stack: ticket, actions, thread, figures. -->
      <div v-else-if="ticket" class="flex flex-col gap-4 @min-[52rem]:flex-row @min-[52rem]:items-start">
        <div class="contents @min-[52rem]:flex @min-[52rem]:min-w-0 @min-[52rem]:flex-1 @min-[52rem]:flex-col @min-[52rem]:gap-4">
          <!-- Ticket -->
          <section class="order-1 overflow-hidden rounded-xl border bg-card" data-testid="admin-ticket-summary">
            <div class="px-4 py-3.5">
              <p class="text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">{{ ticket.ticketId }}</p>
              <h1 class="mt-0.5 text-lg leading-snug font-semibold [overflow-wrap:anywhere]">{{ ticket.subject }}</h1>
              <div class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                <AdminTicketChip :tone="adminTicketStatusTone(ticket.status)" :icon="ticketStatusIcon(ticket.status)" data-chip="status">
                  {{ ticketStatusLabel(ticket.status) }}
                </AdminTicketChip>
                <AdminTicketChip :tone="adminTicketPriorityTone(ticket.priority)" :icon="ticketPriorityIcon(ticket.priority)" data-chip="priority">
                  <span class="sr-only">{{ t("tickets.adminDetail.summary.priority") }}</span>
                  {{ ticketPriorityLabel(ticket.priority) }}
                </AdminTicketChip>
                <AdminTicketChip data-chip="category">
                  <span class="sr-only">{{ t("tickets.adminDetail.summary.category") }}</span>
                  {{ formatCategory(ticket.category) }}
                </AdminTicketChip>
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/60 px-4 py-3 text-sm @min-[34rem]:grid-cols-3">
              <div class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.creator") }}</dt>
                <dd class="mt-0.5 min-w-0">
                  <span class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    <RouterLink
                      v-if="ticket.creatorUserId"
                      :to="{ name: 'admin.userDetail', params: { userId: ticket.creatorUserId } }"
                      class="max-w-full min-w-0 truncate font-medium underline-offset-4 hover:underline"
                      :title="t('tickets.adminDetail.viewUser', { name: creatorName })"
                    >
                      {{ creatorName }}
                    </RouterLink>
                    <span v-else class="font-medium">{{ creatorName }}</span>
                    <AdminTicketChip v-if="creatorRole" :tone="creatorRole === 'user' ? 'neutral' : 'primary'">
                      {{ roleLabel(creatorRole, t) }}
                    </AdminTicketChip>
                  </span>
                  <span
                    v-if="ticket.creatorUserName && ticket.creatorUserId"
                    class="block text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]"
                  >
                    {{ ticket.creatorUserId }}
                  </span>
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.assignee") }}</dt>
                <dd class="mt-0.5 min-w-0">
                  <span :class="['block truncate', ticket.assigneeAdminId ? 'font-medium' : 'text-muted-foreground']" :title="assigneeName">
                    {{ assigneeName }}
                  </span>
                  <span
                    v-if="ticket.assigneeAdminName && ticket.assigneeAdminId"
                    class="block text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]"
                  >
                    {{ ticket.assigneeAdminId }}
                  </span>
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.createdAt") }}</dt>
                <dd class="mt-0.5 font-medium tabular-nums">{{ formatDateTime(ticket.createdAt) }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.updatedAt") }}</dt>
                <dd class="mt-0.5 font-medium tabular-nums">{{ formatDateTime(ticket.updatedAt) }}</dd>
              </div>
              <div v-if="ticket.lastMessageAt" class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.lastMessageAt") }}</dt>
                <dd class="mt-0.5 font-medium tabular-nums">{{ formatDateTime(ticket.lastMessageAt) }}</dd>
              </div>
              <div v-if="ticket.closedAt" class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ t("tickets.adminDetail.summary.closedAt") }}</dt>
                <dd class="mt-0.5 font-medium tabular-nums">{{ formatDateTime(ticket.closedAt) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Conversation -->
          <AdminPanel
            class="order-3"
            flush
            :title="t('tickets.adminDetail.messagesTitle')"
            :description="t('tickets.adminDetail.messagesDescription')"
            data-testid="admin-ticket-conversation"
          >
            <template v-if="refreshing" #actions>
              <LucideLoader2 class="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
            </template>
            <div ref="messageContainer" class="max-h-[32rem] overflow-y-auto">
              <AdminTicketThread v-if="ticket.messages.length > 0" :messages="ticket.messages" :role-of="messageRole" />
              <EmptyState v-else size="sm" :icon="LucideMessageSquare" :title="t('tickets.adminDetail.noMessages')" />
            </div>

            <!-- Reply -->
            <div :class="['flex flex-col gap-2 border-t border-border/60 p-3', isInternal ? 'bg-amber-500/10' : '']">
              <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                <p class="text-sm font-medium">
                  {{ isInternal ? t("tickets.adminDetail.compose.internalTitle") : t("tickets.adminDetail.compose.replyTitle") }}
                </p>
                <div class="flex items-center gap-2">
                  <Switch id="internal-toggle" :model-value="isInternal" @update:model-value="(v: boolean) => isInternal = v" />
                  <Label for="internal-toggle" class="text-xs text-muted-foreground">
                    {{ t("tickets.adminDetail.internalSwitchLabel") }}
                  </Label>
                </div>
              </div>
              <div class="flex items-end gap-2">
                <textarea
                  v-model="newMessage"
                  :placeholder="isInternal ? t('tickets.adminDetail.internalInputPlaceholder') : t('tickets.adminDetail.replyInputPlaceholder')"
                  :aria-label="isInternal ? t('tickets.adminDetail.internalInputPlaceholder') : t('tickets.adminDetail.replyInputPlaceholder')"
                  rows="3"
                  :class="[
                    'min-w-0 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:outline-none dark:bg-input/30',
                    isInternal ? 'border-amber-500/50 focus-visible:ring-amber-500' : 'border-input focus-visible:ring-ring',
                  ]"
                  @keydown.enter.exact="handleComposeEnter"
                />
                <Button
                  :class="['shrink-0', isInternal ? 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' : '']"
                  :disabled="sending || !newMessage.trim()"
                  @click="sendMessage"
                >
                  <LucideLoader2 v-if="sending" class="animate-spin" aria-hidden="true" />
                  <LucideSend v-else aria-hidden="true" />
                  {{ isInternal ? t("tickets.adminDetail.noteButton") : t("tickets.adminDetail.sendButton") }}
                </Button>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div class="contents @min-[52rem]:flex @min-[52rem]:w-72 @min-[52rem]:shrink-0 @min-[52rem]:flex-col @min-[52rem]:gap-4">
          <!-- Actions -->
          <AdminPanel
            class="order-2"
            :title="t('tickets.adminDetail.actionsTitle')"
            :description="t('tickets.adminDetail.actionsDescription')"
            data-testid="admin-ticket-actions"
          >
            <template v-if="actionLoading" #actions>
              <LucideLoader2 class="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
            </template>
            <div class="@container">
              <div class="grid gap-3 @min-[26rem]:grid-cols-[11rem_minmax(0,1fr)]">
                <div class="flex min-w-0 flex-col gap-1.5">
                  <Label id="admin-ticket-status-label" for="admin-ticket-status" class="text-xs">{{ t("tickets.adminDetail.statusChangeLabel") }}</Label>
                  <Select id="admin-ticket-status" :key="locale" :model-value="ticket.status" :disabled="actionLoading" @update:model-value="handleStatusChange">
                    <SelectTrigger class="w-full" aria-labelledby="admin-ticket-status-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="flex min-w-0 flex-col gap-1.5">
                  <Label id="admin-ticket-assignee-label" for="admin-ticket-assignee" class="text-xs">{{ t("tickets.adminDetail.assigneeLabel") }}</Label>
                  <div class="flex min-w-0 flex-wrap gap-2">
                    <div class="min-w-0 flex-1 basis-36">
                      <Select
                        id="admin-ticket-assignee"
                        :key="locale"
                        v-model="assigneeId"
                        :disabled="adminUsersLoading || adminUsersLoadFailed || actionLoading"
                      >
                        <SelectTrigger class="w-full" aria-labelledby="admin-ticket-assignee-label">
                          <SelectValue :placeholder="t('tickets.adminDetail.assigneePlaceholder')" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{{ t("tickets.adminDetail.unassigned") }}</SelectItem>
                          <SelectItem v-for="admin in adminUsers" :key="admin.userId" :value="admin.userId">
                            {{ admin.name }} ({{ admin.userId }})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      class="shrink-0"
                      :disabled="actionLoading || adminUsersLoading || adminUsersLoadFailed"
                      @click="handleAssign"
                    >
                      <LucideUserCog aria-hidden="true" /> {{ t("tickets.adminDetail.assignButton") }}
                    </Button>
                  </div>
                  <div v-if="adminUsersLoading" class="text-xs text-muted-foreground">
                    {{ t("tickets.adminDetail.assigneeLoading") }}
                  </div>
                  <div v-else-if="adminUsersLoadFailed" class="flex flex-wrap items-center gap-2 text-xs text-destructive-tint-foreground">
                    <span>{{ t("tickets.adminDetail.assigneeLoadFailedHint") }}</span>
                    <Button variant="ghost" size="sm" class="h-auto px-2 py-1" @click="loadAdmins">
                      {{ t("tickets.adminDetail.retryLoadAssignees") }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AdminPanel>

          <!-- Figures of this thread: every message of the ticket, read when it was loaded. -->
          <section v-if="threadSummary" class="order-4" :aria-label="t('tickets.adminDetail.stats.label')" data-testid="admin-ticket-thread-stats">
            <AdminStatGrid :columns="2">
              <AdminStatTile
                :label="t('tickets.adminDetail.stats.userMessages')"
                :value="threadSummary.userMessages"
                :icon="LucideMessageSquare"
                data-stat="user-messages"
              />
              <AdminStatTile
                :label="t('tickets.adminDetail.stats.adminReplies')"
                :value="threadSummary.adminReplies"
                :icon="LucideMessageSquareReply"
                tone="primary"
                :detail="t('tickets.adminDetail.stats.internalNotes', { count: threadSummary.internalNotes })"
                data-stat="admin-replies"
              />
              <AdminStatTile
                :label="t('tickets.adminDetail.stats.firstResponse')"
                :text="firstResponse"
                :icon="LucideTimer"
                tone="success"
                :detail="t('tickets.adminDetail.stats.firstResponseDetail')"
                data-stat="first-response"
              />
              <AdminStatTile
                :label="waitingTile.label"
                :text="waitingTile.text"
                :icon="LucideHourglass"
                :tone="waitingTile.tone"
                :detail="waitingTile.detail"
                data-stat="waiting"
              />
            </AdminStatGrid>
          </section>
        </div>
      </div>

      <!-- A failed load is retryable; a 404 is a different state with a different next step. -->
      <section v-else-if="loadError && !notFound" class="rounded-xl border bg-card px-4">
        <LoadErrorState
          :title="t('tickets.adminDetail.toast.loadFailedTitle')"
          :description="loadError.message"
          :detail="loadError.detail"
          :retrying="loading"
          @retry="retryLoad"
        />
      </section>

      <section v-else class="rounded-xl border bg-card px-4">
        <EmptyState :icon="LucideTicketX" :title="t('tickets.adminDetail.notFound')">
          <template #action>
            <Button variant="outline" size="sm" @click="goBack">
              <LucideArrowLeft class="w-4 h-4 mr-1" />
              {{ t("tickets.adminDetail.backButton") }}
            </Button>
          </template>
        </EmptyState>
      </section>
    </div>
  </div>
</template>
