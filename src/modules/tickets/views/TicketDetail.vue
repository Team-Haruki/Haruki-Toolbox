<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { toast } from "vue-sonner"
import {
  LucideArrowLeft,
  LucideCheck,
  LucideChevronDown,
  LucideCopy,
  LucideHistory,
  LucideMessageSquare,
  LucidePlus,
  LucideRefreshCw,
  LucideTicketX,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { copyTextToClipboard } from "@/lib/clipboard"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { extractErrorMessage } from "@/lib/error-utils"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { useUserStore } from "@/shared/stores/user"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import TicketReplyBox from "@/modules/tickets/components/TicketReplyBox.vue"
import TicketThread from "@/modules/tickets/components/TicketThread.vue"
import { ticketPriorityLabel, userTicketStatusIcon } from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import {
  userTicketStatusHintKey,
  userTicketStatusLabelKey,
  userTicketStatusTone,
} from "@/modules/tickets/lib/user-ticket"
import { buildThreadEntries, foldThread } from "@/modules/tickets/lib/user-ticket-thread"
import { useTicketDetail } from "@/modules/tickets/composables/useTicketDetail"

const props = defineProps<{ ticketId: string }>()
const { t } = useI18n()
const userStore = useUserStore()
const {
  loading,
  refreshing,
  loadError,
  notFound,
  ticket,
  messages,
  newMessage,
  replyLength,
  replyTooLong,
  canSend,
  sending,
  closing,
  justSent,
  canReply,
  canClose,
  loadTicket,
  refresh,
  sendMessage,
  handleClose,
  isMe,
} = useTicketDetail(() => props.ticketId)

const closeDialogOpen = ref(false)
/** Phones fold the facts away so the conversation starts higher; a wide page always shows them. */
const infoOpen = ref(false)
/** A long thread opens on its latest messages; the user asks for the rest. */
const threadExpanded = ref(false)
watch(() => props.ticketId, () => {
  threadExpanded.value = false
  infoOpen.value = false
})

const thread = computed(() => foldThread(messages.value, threadExpanded.value))
const threadEntries = computed(() => buildThreadEntries(thread.value.visible))

const categoryLabel = computed(() =>
  ticket.value && isTicketCategory(ticket.value.category)
    ? ticketCategoryLabel(ticket.value.category, t)
    : t("tickets.common.unknownValue"),
)
const priorityLabel = computed(() => (ticket.value ? ticketPriorityLabel(ticket.value.priority) : ""))
const statusHint = computed(() =>
  ticket.value ? t(userTicketStatusHintKey(ticket.value.status, Boolean(ticket.value.assigneeAdminId))) : "",
)

function formatDateTime(value?: string) {
  return formatLocalizedDateTime(value, "dateTime", t("tickets.common.dateFallback"))
}

function describeCloseError(error: unknown) {
  return extractErrorMessage(error, t("tickets.detail.toast.closeFailedFallback"))
}

const idCopied = ref(false)
let idCopiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyTicketId() {
  const id = ticket.value?.ticketId
  if (!id) return
  if (await copyTextToClipboard(id)) {
    idCopied.value = true
    clearTimeout(idCopiedTimer)
    idCopiedTimer = setTimeout(() => {
      idCopied.value = false
    }, 2000)
    toast.success(t("tickets.detail.idCopied"))
  } else {
    toast.error(t("tickets.detail.copyFailed"))
  }
}
</script>

<template>
  <div class="@container mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 py-1 sm:py-2" data-testid="ticket-detail">
    <!-- Laid out against this column (it sits beside the sidebar), not the viewport. -->
    <PageHeader
      size="compact"
      class="[overflow-wrap:anywhere]"
      :title="ticket?.subject || t('route.tickets.detail')"
      :back="{ name: 'tickets.list' }"
      :back-label="t('tickets.detail.backButton')"
    >
      <p v-if="ticket" class="mt-0.5 flex min-w-0 items-center gap-x-1 text-xs text-muted-foreground">
        <span class="sr-only">{{ t("tickets.detail.summary.ticketId") }}</span>
        <span class="min-w-0 tabular-nums" data-testid="ticket-id">{{ ticket.ticketId }}</span>
        <button
          type="button"
          class="-my-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10"
          :aria-label="t('tickets.detail.copyId')"
          :title="t('tickets.detail.copyId')"
          data-testid="ticket-id-copy"
          @click="copyTicketId"
        >
          <LucideCheck v-if="idCopied" class="size-3.5 text-primary" aria-hidden="true" />
          <LucideCopy v-else class="size-3.5" aria-hidden="true" />
        </button>
      </p>
    </PageHeader>

    <div v-if="loading" class="flex flex-col gap-4" aria-busy="true">
      <Skeleton class="h-24 w-full rounded-xl" />
      <Skeleton class="h-64 w-full rounded-xl" />
    </div>

    <!-- From 56rem: the conversation with the status and facts in a side column.
         Below that the status comes first and the facts fold away. -->
    <div v-else-if="ticket" class="flex flex-col gap-4 @min-[56rem]:flex-row-reverse @min-[56rem]:items-start">
      <aside
        class="min-w-0 divide-y divide-border/60 rounded-xl border bg-card @min-[56rem]:sticky @min-[56rem]:top-17 @min-[56rem]:w-72 @min-[56rem]:shrink-0"
        data-testid="ticket-summary"
      >
        <div class="flex flex-col gap-2 p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <AdminTicketChip :tone="userTicketStatusTone(ticket.status)" :icon="userTicketStatusIcon(ticket.status)" data-chip="status">
              {{ t(userTicketStatusLabelKey(ticket.status)) }}
            </AdminTicketChip>
            <Button v-if="canClose" variant="outline" size="sm" :disabled="closing" data-testid="ticket-close" @click="closeDialogOpen = true">
              {{ t("tickets.detail.closeButton") }}
            </Button>
          </div>
          <p class="text-sm leading-relaxed" data-testid="ticket-status-hint">{{ statusHint }}</p>
        </div>

        <div>
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 @min-[56rem]:hidden"
            :aria-expanded="infoOpen"
            aria-controls="ticket-info"
            data-testid="ticket-info-toggle"
            @click="infoOpen = !infoOpen"
          >
            <span class="shrink-0 text-sm font-semibold">{{ t("tickets.detail.infoTitle") }}</span>
            <span class="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">{{ categoryLabel }} · {{ t("tickets.list.priorityTag", { priority: priorityLabel }) }}</span>
            <LucideChevronDown
              :class="['size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', infoOpen ? 'rotate-180' : '']"
              aria-hidden="true"
            />
          </button>
          <dl
            id="ticket-info"
            :class="[
              infoOpen ? 'grid' : 'hidden',
              'grid-cols-2 gap-x-4 gap-y-3 px-4 pb-4 @min-[56rem]:grid @min-[56rem]:py-4',
            ]"
          >
            <div class="min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ t("tickets.detail.summary.category") }}</dt>
              <dd class="text-sm font-semibold">{{ categoryLabel }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ t("tickets.detail.summary.priority") }}</dt>
              <dd class="text-sm font-semibold">{{ priorityLabel }}</dd>
            </div>
            <div class="col-span-2 min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ t("tickets.detail.summary.createdAt") }}</dt>
              <dd class="text-sm font-semibold tabular-nums">{{ formatDateTime(ticket.createdAt) }}</dd>
            </div>
            <div class="col-span-2 min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ t("tickets.detail.summary.updatedAt") }}</dt>
              <dd class="text-sm font-semibold tabular-nums">{{ formatDateTime(ticket.updatedAt) }}</dd>
            </div>
            <div v-if="ticket.closedAt" class="col-span-2 min-w-0">
              <dt class="text-[11px] text-muted-foreground">{{ t("tickets.detail.summary.closedAt") }}</dt>
              <dd class="text-sm font-semibold tabular-nums">{{ formatDateTime(ticket.closedAt) }}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section class="min-w-0 rounded-xl border bg-card @min-[56rem]:flex-1" data-testid="ticket-conversation">
        <header class="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 pr-2 pl-4">
          <h2 class="flex min-w-0 items-baseline gap-2 text-sm font-semibold">
            {{ t("tickets.detail.threadTitle") }}
            <span class="text-xs font-normal tabular-nums text-muted-foreground" data-testid="ticket-message-count">
              {{ t("tickets.detail.messageCount", { count: messages.length }, messages.length) }}
            </span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground"
            :disabled="refreshing || sending"
            :aria-label="t('tickets.detail.refresh')"
            :title="t('tickets.detail.refresh')"
            data-testid="ticket-refresh"
            @click="refresh"
          >
            <LucideRefreshCw :class="refreshing ? 'animate-spin motion-reduce:animate-none' : ''" aria-hidden="true" />
          </Button>
        </header>

        <button
          v-if="thread.hidden > 0"
          type="button"
          class="flex w-full items-center justify-center gap-1.5 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:bg-muted/50 pointer-coarse:min-h-10"
          data-testid="ticket-show-earlier"
          @click="threadExpanded = true"
        >
          <LucideHistory class="size-3.5" aria-hidden="true" />
          {{ t("tickets.detail.showEarlier", { count: thread.hidden }, thread.hidden) }}
        </button>

        <TicketThread v-if="threadEntries.length > 0" :entries="threadEntries" :is-own="isMe" :own-name="userStore.name" />
        <EmptyState v-else size="sm" :icon="LucideMessageSquare" :title="t('tickets.detail.noMessages')" />
        <!-- The end of the conversation: a sent reply scrolls here, clear of the pinned reply box. -->
        <div ref="threadEnd" class="scroll-mb-44" aria-hidden="true" />

        <!-- Reply: pinned to the bottom of the screen while the thread scrolls, so it is always in reach on a phone. -->
        <div
          v-if="canReply"
          class="sticky bottom-0 z-10 rounded-b-xl border-t border-border/60 bg-card p-3"
          data-page-bottom-bar
        >
          <TicketReplyBox
            v-model="newMessage"
            :length="replyLength"
            :too-long="replyTooLong"
            :can-send="canSend"
            :sending="sending"
            :just-sent="justSent"
            :note="ticket.status === 'resolved' ? t('tickets.detail.reopenHint') : null"
            @send="sendMessage"
          />
        </div>
        <div v-else class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 px-4 py-3" data-testid="ticket-closed-note">
          <p class="text-sm text-muted-foreground">{{ t("tickets.detail.closedHint") }}</p>
          <Button as-child variant="outline" size="sm">
            <RouterLink :to="{ name: 'tickets.create' }">
              <LucidePlus aria-hidden="true" />
              {{ t("tickets.detail.newTicket") }}
            </RouterLink>
          </Button>
        </div>
      </section>
    </div>

    <!-- A 404 is a different state from a failed load, with a different next step. -->
    <section v-else-if="notFound" class="rounded-xl border bg-card px-4">
      <EmptyState :icon="LucideTicketX" :title="t('tickets.detail.notFound')" :description="t('tickets.detail.notFoundDescription')">
        <template #action>
          <Button as-child variant="outline" size="sm">
            <RouterLink :to="{ name: 'tickets.list' }">
              <LucideArrowLeft aria-hidden="true" />
              {{ t("tickets.detail.backButton") }}
            </RouterLink>
          </Button>
        </template>
      </EmptyState>
    </section>

    <section v-else class="rounded-xl border bg-card px-4">
      <LoadErrorState
        :title="t('tickets.detail.toast.loadFailedTitle')"
        :description="loadError?.message"
        :detail="loadError?.detail"
        :retrying="loading"
        @retry="loadTicket()"
      />
    </section>

    <ConfirmDialog
      v-model:open="closeDialogOpen"
      :title="t('tickets.detail.closeDialog.title')"
      :description="t('tickets.detail.closeDialog.description')"
      :confirm-label="t('tickets.detail.closeDialog.confirm')"
      :cancel-label="t('tickets.detail.closeDialog.cancel')"
      destructive
      :describe-error="describeCloseError"
      :on-confirm="handleClose"
    />
  </div>
</template>
