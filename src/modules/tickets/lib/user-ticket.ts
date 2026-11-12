/**
 * How a ticket reads to the person who opened it: whose turn it is, how the
 * status is worded and toned on their pages, and how old a timestamp is.
 * Pure, so the views only format. The admin pages keep their own wording
 * (`./display`, `./admin-ticket-display`).
 */
import type { AdminTicketTone } from "@/modules/tickets/lib/admin-ticket-display"
import type { TicketStatusFilter } from "@/modules/tickets/lib/meta"
import type { TicketCategory, TicketPriority, TicketStatus } from "@/types/ticket"

/** Whose move a ticket is, from its creator's side. */
export type UserTicketStage = "waitingUser" | "waitingSupport" | "resolved" | "closed"

// The backend moves a ticket to `pending_user` on a public admin reply and to
// `pending_admin` on a user reply (tickets/service.go); `open` is a new ticket
// nobody has answered yet.
export function userTicketStage(status: TicketStatus): UserTicketStage {
  switch (status) {
    case "pending_user":
      return "waitingUser"
    case "resolved":
      return "resolved"
    case "closed":
      return "closed"
    case "open":
    case "pending_admin":
    default:
      return "waitingSupport"
  }
}

/** The list's filter chips, most pressing first. */
export const USER_TICKET_STATUS_FILTERS: readonly TicketStatusFilter[] = [
  "all",
  "pending_user",
  "pending_admin",
  "open",
  "resolved",
  "closed",
]

const STATUS_FILTER_SET: ReadonlySet<string> = new Set(USER_TICKET_STATUS_FILTERS)

export function isUserTicketStatusFilter(value: unknown): value is TicketStatusFilter {
  return typeof value === "string" && STATUS_FILTER_SET.has(value)
}

/** The i18n key of a status (or the "all" filter) in the creator's wording. */
export function userTicketStatusLabelKey(status: TicketStatusFilter): string {
  switch (status) {
    case "all":
      return "tickets.userStatus.all"
    case "open":
      return "tickets.userStatus.open"
    case "pending_admin":
      return "tickets.userStatus.pendingAdmin"
    case "pending_user":
      return "tickets.userStatus.pendingUser"
    case "resolved":
      return "tickets.userStatus.resolved"
    case "closed":
      return "tickets.userStatus.closed"
  }
}

/**
 * The i18n key of the sentence under the status: what happens next. A ticket
 * that waits for an admin says so differently once one has picked it up.
 */
export function userTicketStatusHintKey(status: TicketStatus, hasAssignee: boolean): string {
  switch (userTicketStage(status)) {
    case "waitingUser":
      return "tickets.userStatusHint.waitingUser"
    case "resolved":
      return "tickets.userStatusHint.resolved"
    case "closed":
      return "tickets.userStatusHint.closed"
    case "waitingSupport":
      return hasAssignee ? "tickets.userStatusHint.waitingAdminAssigned" : "tickets.userStatusHint.waitingAdmin"
  }
}

/**
 * Amber only where the user has something to do; the primary tint for a
 * ticket that is still being worked on; finished tickets stay quiet.
 */
export function userTicketStatusTone(status: TicketStatus): AdminTicketTone {
  switch (userTicketStage(status)) {
    case "waitingUser":
      return "warning"
    case "waitingSupport":
      return "primary"
    default:
      return "neutral"
  }
}

/** The backend refuses a message on a closed ticket; a reply to a resolved one reopens it. */
export function canReplyToTicket(status: TicketStatus): boolean {
  return status !== "closed"
}

export function canCloseTicket(status: TicketStatus): boolean {
  return status !== "closed"
}

/** A list line names the priority only when it is not the default. */
export function showsTicketPriority(priority: TicketPriority | string): boolean {
  return priority !== "normal"
}

/** The i18n key of what a description should contain for a category. */
export function ticketCategoryGuideKey(category: TicketCategory): string {
  switch (category) {
    case "upload":
      return "tickets.create.guide.upload"
    case "account":
      return "tickets.create.guide.account"
    case "bug":
      return "tickets.create.guide.bug"
    case "feature":
      return "tickets.create.guide.feature"
    case "other":
    default:
      return "tickets.create.guide.other"
  }
}

export type TicketAge =
  /** Under a minute ago (or a clock a little ahead of the server's). */
  | { unit: "moment" }
  | { unit: "minute" | "hour" | "day"; value: number }
  /** A week or more: shown as a date, without the year when it is this year's. */
  | { unit: "date"; sameYear: boolean }

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const RELATIVE_DAYS = 7

/** How long ago `value` was at `nowMs`, in the unit a list line shows; `null` for a missing or broken timestamp. */
export function ticketAge(value: string | undefined, nowMs: number): TicketAge | null {
  if (!value) return null
  const time = Date.parse(value)
  if (Number.isNaN(time)) return null
  const elapsed = nowMs - time
  if (elapsed < MINUTE_MS) return { unit: "moment" }
  if (elapsed < HOUR_MS) return { unit: "minute", value: Math.floor(elapsed / MINUTE_MS) }
  if (elapsed < DAY_MS) return { unit: "hour", value: Math.floor(elapsed / HOUR_MS) }
  if (elapsed < RELATIVE_DAYS * DAY_MS) return { unit: "day", value: Math.floor(elapsed / DAY_MS) }
  return { unit: "date", sameYear: new Date(time).getFullYear() === new Date(nowMs).getFullYear() }
}

const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>()

/**
 * "42 minutes ago" / "42分钟前" for an age counted in minutes, hours or days;
 * `null` for the ages the caller words itself (just now, a date).
 */
export function formatRelativeTicketAge(age: TicketAge, locale: string): string | null {
  if (age.unit === "moment" || age.unit === "date") return null
  let formatter = relativeFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" })
    relativeFormatters.set(locale, formatter)
  }
  return formatter.format(-age.value, age.unit)
}

/**
 * The columns of the list's table layout (from 40rem of list width), shared
 * by `TicketListRow` and the caption row above the rows: ticket, status,
 * last update. A literal class string, so Tailwind sees it.
 */
export const USER_TICKET_ROW_GRID = "@min-[40rem]:grid-cols-[minmax(0,1fr)_10rem_6.5rem]"
