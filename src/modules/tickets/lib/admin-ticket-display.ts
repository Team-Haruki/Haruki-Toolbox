/**
 * How the admin ticket pages colour a status, a priority and a sender: the
 * tone of the small tinted chip and the colour of the matching share bar.
 * The labels and icons stay the shared ones in `./display`.
 */
import type { TicketPriority, TicketSenderRole, TicketStatus } from "@/types/ticket"
import { parseAdminTicketSystemMessage } from "@/modules/tickets/lib/admin-ticket-thread"
import { ticketStatusLabel } from "@/modules/tickets/lib/display"
import { describeSystemMessage } from "@/modules/tickets/lib/messages"
import { isTicketStatus } from "@/modules/tickets/lib/meta"

export type AdminTicketTone = "neutral" | "info" | "warning" | "violet" | "success" | "orange" | "danger" | "primary"

/** Literal class strings, so Tailwind sees them. Same tints as `SettingsRow`'s icon wells. */
export const ADMIN_TICKET_TONE_CLASS: Readonly<Record<AdminTicketTone, string>> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  danger: "bg-destructive/15 text-destructive-tint-foreground",
}

/**
 * The columns of the list's table layout (from 52rem of list width), shared
 * by `AdminTicketListRow` and the caption row above the rows: subject,
 * creator / assignee, category, priority, status, updated.
 */
export const ADMIN_TICKET_ROW_GRID =
  "@min-[52rem]:grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_4.75rem_7.75rem_5.25rem]"

const STATUS_TONE: Readonly<Record<TicketStatus, AdminTicketTone>> = {
  open: "info",
  pending_admin: "warning",
  pending_user: "violet",
  resolved: "success",
  closed: "neutral",
}

// Only what needs attention is coloured: a column of "normal" stays quiet.
const PRIORITY_TONE: Readonly<Record<TicketPriority, AdminTicketTone>> = {
  urgent: "danger",
  high: "orange",
  normal: "neutral",
  low: "neutral",
}

export function adminTicketStatusTone(status: TicketStatus): AdminTicketTone {
  return STATUS_TONE[status] ?? "neutral"
}

export function adminTicketPriorityTone(priority: TicketPriority | string): AdminTicketTone {
  return PRIORITY_TONE[priority as TicketPriority] ?? "neutral"
}

export function adminTicketSenderTone(role: TicketSenderRole | undefined): AdminTicketTone {
  return role === "admin" ? "primary" : "neutral"
}

// Share bars of the status breakdown. The colours are CSS variables set (per
// theme) by the element that hosts the bars, see `AdminTicketListStats.vue`:
// each theme has its own validated steps of the chips' hues. Every bar is
// labelled, so the colour only echoes the chip.
const STATUS_BAR_COLOR: Readonly<Record<TicketStatus, string>> = {
  pending_admin: "var(--ticket-bar-pending-admin)",
  open: "var(--ticket-bar-open)",
  pending_user: "var(--ticket-bar-pending-user)",
  resolved: "var(--ticket-bar-resolved)",
  closed: "var(--ticket-bar-closed)",
}

export function adminTicketStatusBarColor(status: TicketStatus): string | undefined {
  return STATUS_BAR_COLOR[status]
}

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

function statusText(status: TicketStatus | string): string {
  return isTicketStatus(status) ? ticketStatusLabel(status) : status
}

/**
 * A backend system line ("Status changed: Open -> Closed", "Assignee
 * changed: Unassigned -> Mafuyu (1200450078)") in the admin's language;
 * wording the page does not recognise is shown as the backend wrote it.
 */
export function describeAdminTicketSystemMessage(message: string, t: TranslateFn): string {
  const event = parseAdminTicketSystemMessage(message)
  switch (event.kind) {
    case "status":
      return t("tickets.adminDetail.system.statusChanged", { from: statusText(event.from), to: statusText(event.to) })
    case "assignee":
      if (event.from == null && event.to == null) return message.trim()
      if (event.from == null) return t("tickets.adminDetail.system.assigned", { to: event.to })
      if (event.to == null) return t("tickets.adminDetail.system.assigneeCleared", { from: event.from })
      return t("tickets.adminDetail.system.assigneeChanged", { from: event.from, to: event.to })
    case "text":
      // Older wording ("Status changed to pending_admin") is handled by the shared helper.
      return describeSystemMessage(event.text)
  }
}
