import type { TicketCategory, TicketMessage, TicketPriority, TicketStatus } from "@/types/ticket"
import { translate } from "@/shared/i18n"

export type TicketStatusFilter = TicketStatus | "all"
export type TicketPriorityFilter = TicketPriority | "all"

export interface TicketOption<T extends string> {
  value: T
  label: string
}

type TicketLocalizer = (key: string) => string

const defaultLocalizer: TicketLocalizer = (key) => translate(key)

const TICKET_STATUS_VALUES: readonly TicketStatus[] = ["open", "in_progress", "resolved", "closed"]
const TICKET_PRIORITY_VALUES: readonly TicketPriority[] = ["low", "normal", "medium", "high", "urgent"]
const TICKET_CATEGORY_VALUES: readonly TicketCategory[] = ["upload", "account", "bug", "feature", "other"]
const TICKET_STATUS_FILTER_VALUES: readonly TicketStatusFilter[] = ["all", ...TICKET_STATUS_VALUES]
const TICKET_PRIORITY_FILTER_VALUES: readonly TicketPriorityFilter[] = ["all", ...TICKET_PRIORITY_VALUES]
const ADMIN_TICKET_PRIORITY_FILTER_VALUES: readonly TicketPriorityFilter[] = ["all", "urgent", "high", "medium", "low"]

export function ticketStatusOptionLabel(status: TicketStatusFilter, localizer: TicketLocalizer = defaultLocalizer): string {
  switch (status) {
    case "all":
      return localizer("tickets.filters.allStatus")
    case "open":
      return localizer("tickets.status.open")
    case "in_progress":
      return localizer("tickets.status.inProgress")
    case "resolved":
      return localizer("tickets.status.resolved")
    case "closed":
      return localizer("tickets.status.closed")
  }
}

export function ticketPriorityOptionLabel(
  priority: TicketPriorityFilter,
  localizer: TicketLocalizer = defaultLocalizer
): string {
  switch (priority) {
    case "all":
      return localizer("tickets.filters.allPriorities")
    case "low":
      return localizer("tickets.priority.low")
    case "normal":
      return localizer("tickets.priority.normal")
    case "medium":
      return localizer("tickets.priority.medium")
    case "high":
      return localizer("tickets.priority.high")
    case "urgent":
      return localizer("tickets.priority.urgent")
  }
}

export function ticketCategoryLabel(category: TicketCategory, localizer: TicketLocalizer = defaultLocalizer): string {
  switch (category) {
    case "upload":
      return localizer("tickets.category.upload")
    case "account":
      return localizer("tickets.category.account")
    case "bug":
      return localizer("tickets.category.bug")
    case "feature":
      return localizer("tickets.category.feature")
    case "other":
      return localizer("tickets.category.other")
  }
}

function toOptions<T extends string>(
  values: readonly T[],
  resolveLabel: (value: T) => string
): ReadonlyArray<TicketOption<T>> {
  return values.map((value) => ({
    value,
    label: resolveLabel(value),
  }))
}

export function getTicketStatusOptions(localizer: TicketLocalizer = defaultLocalizer): ReadonlyArray<TicketOption<TicketStatus>> {
  return toOptions(TICKET_STATUS_VALUES, (value) => ticketStatusOptionLabel(value, localizer))
}

export function getTicketStatusFilterOptions(
  localizer: TicketLocalizer = defaultLocalizer
): ReadonlyArray<TicketOption<TicketStatusFilter>> {
  return toOptions(TICKET_STATUS_FILTER_VALUES, (value) => ticketStatusOptionLabel(value, localizer))
}

export function getTicketPriorityOptions(
  localizer: TicketLocalizer = defaultLocalizer
): ReadonlyArray<TicketOption<TicketPriority>> {
  return toOptions(TICKET_PRIORITY_VALUES, (value) => ticketPriorityOptionLabel(value, localizer))
}

export function getTicketPriorityFilterOptions(
  localizer: TicketLocalizer = defaultLocalizer
): ReadonlyArray<TicketOption<TicketPriorityFilter>> {
  return toOptions(TICKET_PRIORITY_FILTER_VALUES, (value) => ticketPriorityOptionLabel(value, localizer))
}

export function getAdminTicketPriorityFilterOptions(
  localizer: TicketLocalizer = defaultLocalizer
): ReadonlyArray<TicketOption<TicketPriorityFilter>> {
  return toOptions(ADMIN_TICKET_PRIORITY_FILTER_VALUES, (value) => ticketPriorityOptionLabel(value, localizer))
}

export function getTicketCategoryOptions(
  localizer: TicketLocalizer = defaultLocalizer
): ReadonlyArray<TicketOption<TicketCategory>> {
  return toOptions(TICKET_CATEGORY_VALUES, (value) => ticketCategoryLabel(value, localizer))
}

// Backward compatible static exports for non-reactive call sites.
export const TICKET_STATUS_OPTIONS: ReadonlyArray<TicketOption<TicketStatus>> = getTicketStatusOptions()
export const TICKET_STATUS_FILTER_OPTIONS: ReadonlyArray<TicketOption<TicketStatusFilter>> = getTicketStatusFilterOptions()
export const TICKET_PRIORITY_OPTIONS: ReadonlyArray<TicketOption<TicketPriority>> = getTicketPriorityOptions()
export const TICKET_PRIORITY_FILTER_OPTIONS: ReadonlyArray<TicketOption<TicketPriorityFilter>> = getTicketPriorityFilterOptions()
export const ADMIN_TICKET_PRIORITY_FILTER_OPTIONS: ReadonlyArray<TicketOption<TicketPriorityFilter>> =
  getAdminTicketPriorityFilterOptions()
export const TICKET_CATEGORY_OPTIONS: ReadonlyArray<TicketOption<TicketCategory>> = getTicketCategoryOptions()

const TICKET_STATUS_SET = new Set<string>(TICKET_STATUS_VALUES)
const TICKET_PRIORITY_SET = new Set<string>(TICKET_PRIORITY_VALUES)
const TICKET_CATEGORY_SET = new Set<string>(TICKET_CATEGORY_VALUES)
const TICKET_SENDER_ROLE_SET = new Set<string>(["user", "admin"])

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && TICKET_STATUS_SET.has(value)
}

export function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === "string" && TICKET_PRIORITY_SET.has(value)
}

export function isTicketCategory(value: unknown): value is TicketCategory {
  return typeof value === "string" && TICKET_CATEGORY_SET.has(value)
}

export function isTicketSenderRole(value: unknown): value is TicketMessage["senderRole"] {
  return typeof value === "string" && TICKET_SENDER_ROLE_SET.has(value)
}
