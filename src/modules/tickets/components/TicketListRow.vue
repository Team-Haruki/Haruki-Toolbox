<script setup lang="ts">
/**
 * One of the user's own tickets, the whole line a link to it.
 *
 * The list around it is the `@container` and draws the border, the dividers
 * and the column captions (`USER_TICKET_ROW_GRID` keeps both on the same
 * columns). From 40rem of list width it is a table line: subject over a
 * quiet facts line, the status, the last update. Below that the same cells
 * fold: subject and time, then the status chip with the facts beside it.
 * A ticket that waits for the user is set in semibold; a closed one is muted.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import { ticketPriorityLabel, userTicketStatusIcon } from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import {
  formatRelativeTicketAge,
  showsTicketPriority,
  ticketAge,
  USER_TICKET_ROW_GRID,
  userTicketStage,
  userTicketStatusLabelKey,
  userTicketStatusTone,
} from "@/modules/tickets/lib/user-ticket"
import type { Ticket } from "@/types/ticket"

const props = defineProps<{
  ticket: Ticket
  /** The moment ages are measured at (a shared ticking `Date.now()`). */
  now: number
}>()

const { t, locale } = useI18n()

const stage = computed(() => userTicketStage(props.ticket.status))
const fallback = computed(() => t("tickets.common.dateFallback"))

/** A day, without the year while it is this year's. */
function shortDate(value: string | undefined): string {
  const sameYear = value ? new Date(value).getFullYear() === new Date(props.now).getFullYear() : false
  return formatLocalizedDate(value, sameYear ? "monthDay" : "date", fallback.value)
}

const updatedText = computed(() => {
  const age = ticketAge(props.ticket.updatedAt, props.now)
  if (!age) return fallback.value
  if (age.unit === "moment") return t("tickets.time.justNow")
  if (age.unit === "date") return shortDate(props.ticket.updatedAt)
  return formatRelativeTicketAge(age, locale.value) ?? fallback.value
})

/** Category, a non-default priority, whether an admin has it, and when it was opened or closed. */
const facts = computed(() => {
  const ticket = props.ticket
  const parts = [isTicketCategory(ticket.category) ? ticketCategoryLabel(ticket.category, t) : t("tickets.common.unknownValue")]
  if (showsTicketPriority(ticket.priority)) {
    parts.push(t("tickets.list.priorityTag", { priority: ticketPriorityLabel(ticket.priority) }))
  }
  if (stage.value === "waitingSupport" && ticket.assigneeAdminId) {
    parts.push(t("tickets.list.assigned"))
  }
  parts.push(
    stage.value === "closed" && ticket.closedAt
      ? t("tickets.list.closedOn", { date: shortDate(ticket.closedAt) })
      : t("tickets.list.createdOn", { date: shortDate(ticket.createdAt) }),
  )
  return parts.join(" · ")
})
</script>

<template>
  <RouterLink
    :to="{ name: 'tickets.detail', params: { ticketId: ticket.ticketId } }"
    :class="[
      'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset @min-[40rem]:gap-y-0.5 @min-[40rem]:py-2.5',
      USER_TICKET_ROW_GRID,
    ]"
    data-slot="ticket-row"
    :data-ticket-id="ticket.ticketId"
    :data-stage="stage"
  >
    <p
      :class="[
        'line-clamp-2 min-w-0 text-sm [overflow-wrap:anywhere] @min-[40rem]:col-start-1 @min-[40rem]:row-start-1 @min-[40rem]:line-clamp-1 @min-[40rem]:break-all',
        stage === 'waitingUser' ? 'font-semibold' : stage === 'closed' ? 'text-muted-foreground' : 'font-medium',
      ]"
      :title="ticket.subject"
    >
      {{ ticket.subject }}
    </p>

    <time
      :datetime="ticket.updatedAt"
      :title="formatLocalizedDateTime(ticket.updatedAt, 'dateTime', fallback)"
      class="shrink-0 pt-0.5 text-right text-xs whitespace-nowrap tabular-nums text-muted-foreground @min-[40rem]:col-start-3 @min-[40rem]:row-span-2 @min-[40rem]:row-start-1 @min-[40rem]:self-center @min-[40rem]:pt-0"
    >
      <span class="sr-only">{{ t("tickets.list.updatedAt") }}</span>
      {{ updatedText }}
    </time>

    <div class="col-span-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 @min-[40rem]:contents">
      <span class="flex min-w-0 @min-[40rem]:col-start-2 @min-[40rem]:row-span-2 @min-[40rem]:row-start-1 @min-[40rem]:self-center">
        <AdminTicketChip :tone="userTicketStatusTone(ticket.status)" :icon="userTicketStatusIcon(ticket.status)" data-chip="status">
          {{ t(userTicketStatusLabelKey(ticket.status)) }}
        </AdminTicketChip>
      </span>
      <p class="min-w-0 text-xs text-muted-foreground [overflow-wrap:anywhere] @min-[40rem]:col-start-1 @min-[40rem]:row-start-2 @min-[40rem]:truncate">
        {{ facts }}
      </p>
    </div>
  </RouterLink>
</template>
