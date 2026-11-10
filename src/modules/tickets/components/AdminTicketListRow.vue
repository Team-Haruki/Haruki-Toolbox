<script setup lang="ts">
/**
 * One ticket of the admin list, the whole line a link to the ticket.
 *
 * The list around it is the `@container` and draws the border, the dividers
 * and the column captions (`ADMIN_TICKET_ROW_GRID` keeps both on the same
 * columns). From 52rem of list width it is a table line: subject (with the
 * ticket id and the latest message under it), creator over assignee,
 * category, priority, status, updated. Below that the same cells fold into
 * two lines: subject and time, then the chips and "creator → assignee".
 * Every value is in the DOM once (the date apart: short when folded, full in
 * the table); only its place changes.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowRight } from "lucide-vue-next"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import {
  ADMIN_TICKET_ROW_GRID,
  adminTicketPriorityTone,
  adminTicketStatusTone,
  describeAdminTicketSystemMessage,
} from "@/modules/tickets/lib/admin-ticket-display"
import {
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
} from "@/modules/tickets/lib/display"
import { ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import type { Ticket } from "@/types/ticket"

const props = defineProps<{ ticket: Ticket }>()

const { t } = useI18n()

const creator = computed(() => props.ticket.creatorUserName || props.ticket.creatorUserId)
const creatorTitle = computed(() =>
  props.ticket.creatorUserName && props.ticket.creatorUserId
    ? `${props.ticket.creatorUserName} (${props.ticket.creatorUserId})`
    : creator.value,
)
const assignee = computed(() => props.ticket.assigneeAdminName || props.ticket.assigneeAdminId || "")

const lastMessageRole = computed(() => {
  switch (props.ticket.lastMessageSenderRole) {
    case "admin":
      return t("tickets.adminList.lastMessage.admin")
    case "user":
      return t("tickets.adminList.lastMessage.user")
    case "system":
      return t("tickets.adminList.lastMessage.system")
    default:
      return ""
  }
})

const lastMessageText = computed(() => {
  const preview = props.ticket.lastMessagePreview
  if (!preview) return ""
  return props.ticket.lastMessageSenderRole === "system" ? describeAdminTicketSystemMessage(preview, t) : preview
})

const fallback = computed(() => t("tickets.common.dateFallback"))
const updatedDate = computed(() => formatLocalizedDate(props.ticket.updatedAt, "date", fallback.value))
const updatedMonthDay = computed(() => formatLocalizedDate(props.ticket.updatedAt, "monthDay", fallback.value))
const updatedTime = computed(() =>
  formatLocalizedDateTime(props.ticket.updatedAt, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, ""),
)
</script>

<template>
  <RouterLink
    :to="{ name: 'admin.ticketDetail', params: { ticketId: ticket.ticketId } }"
    :class="[
      'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset @min-[52rem]:py-2',
      ADMIN_TICKET_ROW_GRID,
    ]"
    data-slot="admin-ticket-row"
    :data-ticket-id="ticket.ticketId"
  >
    <div class="min-w-0">
      <p class="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere] @min-[52rem]:line-clamp-1" :title="ticket.subject">
        {{ ticket.subject }}
      </p>
      <p class="mt-0.5 hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground @min-[52rem]:flex">
        <span class="shrink-0 tabular-nums">{{ ticket.ticketId }}</span>
        <template v-if="lastMessageText">
          <span class="shrink-0" aria-hidden="true">·</span>
          <span
            v-if="ticket.lastMessageInternal && ticket.lastMessageSenderRole !== 'system'"
            class="shrink-0 rounded bg-amber-500/15 px-1 text-[11px] text-amber-800 dark:text-amber-300"
          >
            {{ t("tickets.adminList.lastMessage.internal") }}
          </span>
          <span class="min-w-0 truncate" :title="lastMessageText">
            <template v-if="lastMessageRole && ticket.lastMessageSenderRole !== 'system'">{{ lastMessageRole }}：</template>{{ lastMessageText }}
          </span>
        </template>
      </p>
    </div>

    <!-- Folded: "11/10 14:23" beside the subject. Table: the full date over the time. -->
    <time
      :datetime="ticket.updatedAt"
      :title="formatLocalizedDateTime(ticket.updatedAt, 'dateTime', fallback)"
      class="shrink-0 self-start pt-0.5 text-right text-xs tabular-nums text-muted-foreground @min-[52rem]:order-5 @min-[52rem]:self-center @min-[52rem]:pt-0"
    >
      <span class="sr-only">{{ t("tickets.adminList.table.updatedAt") }}</span>
      <span class="@min-[52rem]:hidden">{{ updatedMonthDay }}</span>
      <span class="hidden text-foreground @min-[52rem]:block">{{ updatedDate }}</span>
      {{ " " }}
      <span class="@min-[52rem]:block">{{ updatedTime }}</span>
    </time>

    <div class="col-span-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 @min-[52rem]:contents">
      <span class="flex min-w-0 @min-[52rem]:order-4">
        <AdminTicketChip :tone="adminTicketStatusTone(ticket.status)" :icon="ticketStatusIcon(ticket.status)">
          {{ ticketStatusLabel(ticket.status) }}
        </AdminTicketChip>
      </span>
      <span class="flex min-w-0 @min-[52rem]:order-3">
        <AdminTicketChip :tone="adminTicketPriorityTone(ticket.priority)" :icon="ticketPriorityIcon(ticket.priority)">
          <span class="sr-only">{{ t("tickets.adminList.table.priority") }}</span>
          {{ ticketPriorityLabel(ticket.priority) }}
        </AdminTicketChip>
      </span>
      <span class="flex min-w-0 @min-[52rem]:order-2">
        <AdminTicketChip>{{ ticketCategoryLabel(ticket.category, t) }}</AdminTicketChip>
      </span>
      <!-- Folded: "creator → assignee" on the chips' line. Table: creator over assignee. -->
      <div
        class="ml-1 flex min-w-0 flex-1 basis-20 items-center gap-x-1 text-xs text-muted-foreground @min-[52rem]:order-1 @min-[52rem]:ml-0 @min-[52rem]:block"
      >
        <p class="min-w-0 truncate @min-[52rem]:text-sm @min-[52rem]:text-foreground" :title="creatorTitle">
          <span class="sr-only">{{ t("tickets.adminList.table.creator") }}</span>
          {{ creator }}
        </p>
        <LucideArrowRight class="size-3 shrink-0 @min-[52rem]:hidden" aria-hidden="true" />
        <p class="min-w-0 truncate" :title="assignee || undefined">
          <span class="sr-only">{{ t("tickets.adminList.table.assignee") }}</span>
          {{ assignee || t("tickets.adminList.unassigned") }}
        </p>
      </div>
    </div>
  </RouterLink>
</template>
