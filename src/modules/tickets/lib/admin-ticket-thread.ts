/**
 * Reading an admin ticket's conversation: what the backend's system lines
 * say, and the handful of figures the detail page shows about the thread.
 * Pure, so the view only formats.
 */
import type { Ticket, TicketMessage, TicketStatus } from "@/types/ticket"

// The backend writes its system lines in English with fixed wording
// (tickets/service.go `BuildStatusEventMessage`, admintickets/ticket_helpers.go
// `buildAdminTicketAssigneeEventMessage`):
//   "Status changed: Pending admin -> Pending user"
//   "Assignee changed: Unassigned -> Mafuyu (1200450078)"
const STATUS_BY_BACKEND_LABEL: Readonly<Record<string, TicketStatus>> = {
  "open": "open",
  "pending admin": "pending_admin",
  "pending user": "pending_user",
  "resolved": "resolved",
  "closed": "closed",
}
const STATUS_CHANGED_PREFIX = "status changed:"
const ASSIGNEE_CHANGED_PREFIX = "assignee changed:"
const UNASSIGNED_LABEL = "unassigned"

export type AdminTicketSystemEvent =
  /** A status the page knows is a `TicketStatus`; anything else stays the backend's text. */
  | { kind: "status"; from: TicketStatus | string; to: TicketStatus | string }
  /** `null` is "nobody". */
  | { kind: "assignee"; from: string | null; to: string | null }
  | { kind: "text"; text: string }

function readStatusLabel(label: string): TicketStatus | string {
  return STATUS_BY_BACKEND_LABEL[label.trim().toLowerCase()] ?? label.trim()
}

function readAssigneeLabel(label: string): string | null {
  const trimmed = label.trim()
  return trimmed.toLowerCase() === UNASSIGNED_LABEL ? null : trimmed
}

/** What a system message records; unrecognised wording comes back as `text`, verbatim. */
/**
 * The two sides of "<prefix> from -> to", or null when the text is not that
 * shape. Plain string work rather than a regular expression: the message is
 * free text, and a lazy pattern around "->" backtracks badly on long input.
 */
function readChange(text: string, prefix: string): [from: string, to: string] | null {
  if (text.slice(0, prefix.length).toLowerCase() !== prefix) {
    return null
  }
  const rest = text.slice(prefix.length)
  const arrow = rest.indexOf("->")
  if (arrow < 0) {
    return null
  }
  const from = rest.slice(0, arrow).trim()
  const to = rest.slice(arrow + 2).trim()
  return from && to ? [from, to] : null
}

export function parseAdminTicketSystemMessage(message: string): AdminTicketSystemEvent {
  const trimmed = message.trim()
  const status = readChange(trimmed, STATUS_CHANGED_PREFIX)
  if (status) {
    return { kind: "status", from: readStatusLabel(status[0]), to: readStatusLabel(status[1]) }
  }
  const assignee = readChange(trimmed, ASSIGNEE_CHANGED_PREFIX)
  if (assignee) {
    return { kind: "assignee", from: readAssigneeLabel(assignee[0]), to: readAssigneeLabel(assignee[1]) }
  }
  return { kind: "text", text: trimmed }
}

export type AdminTicketWaiting =
  /** The user wrote last: they are waiting for an admin. */
  | { on: "admin"; ms: number }
  /** An admin replied last: the ticket waits for the user. */
  | { on: "user"; ms: number }
  /** Closed: how long it took from creation to closing. */
  | { on: "closed"; ms: number }

export type AdminTicketThreadSummary = {
  userMessages: number
  /** Admin replies the user can see. */
  adminReplies: number
  /** Admin messages marked internal. */
  internalNotes: number
  systemEvents: number
  /** Creation to the first admin reply the user can see; `null` while there is none. */
  firstResponseMs: number | null
  waiting: AdminTicketWaiting | null
}

function timeOf(value: string | undefined): number | null {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

function elapsed(from: number | null, to: number | null): number | null {
  return from == null || to == null ? null : Math.max(0, to - from)
}

/**
 * Counts and waiting times of one ticket's thread. `messages` is the whole
 * conversation (the detail endpoint is not paged), `now` the moment the
 * figures are read at.
 */
export function summarizeTicketThread(
  ticket: Pick<Ticket, "status" | "createdAt" | "closedAt">,
  messages: readonly TicketMessage[],
  now: number,
): AdminTicketThreadSummary {
  let userMessages = 0
  let adminReplies = 0
  let internalNotes = 0
  let systemEvents = 0
  let firstReplyAt: number | null = null
  let lastPublic: { role: "user" | "admin"; at: number | null } | null = null

  for (const message of messages) {
    if (message.senderRole === "system") {
      systemEvents += 1
      continue
    }
    if (message.senderRole === "admin" && message.internal) {
      internalNotes += 1
      continue
    }
    const at = timeOf(message.createdAt)
    if (message.senderRole === "admin") {
      adminReplies += 1
      if (at != null && (firstReplyAt == null || at < firstReplyAt)) firstReplyAt = at
    } else {
      userMessages += 1
    }
    if (lastPublic == null || (at != null && (lastPublic.at == null || at >= lastPublic.at))) {
      lastPublic = { role: message.senderRole, at }
    }
  }

  const createdAt = timeOf(ticket.createdAt)
  let waiting: AdminTicketWaiting | null = null
  if (ticket.status === "closed") {
    const ms = elapsed(createdAt, timeOf(ticket.closedAt))
    if (ms != null) waiting = { on: "closed", ms }
  } else if (ticket.status !== "resolved" && lastPublic) {
    const ms = elapsed(lastPublic.at, now)
    if (ms != null) waiting = { on: lastPublic.role === "user" ? "admin" : "user", ms }
  }

  return {
    userMessages,
    adminReplies,
    internalNotes,
    systemEvents,
    firstResponseMs: elapsed(createdAt, firstReplyAt),
    waiting,
  }
}

export type DurationParts =
  | { unit: "days"; days: number; hours: number }
  | { unit: "hours"; hours: number; minutes: number }
  | { unit: "minutes"; minutes: number }
  | { unit: "moment" }

/** A duration in its two largest units ("3 d 4 h", "2 h 13 min", "5 min"); under a minute is a `moment`. */
export function durationParts(ms: number): DurationParts {
  const totalMinutes = Number.isFinite(ms) ? Math.floor(Math.max(0, ms) / 60_000) : 0
  if (totalMinutes < 1) return { unit: "moment" }
  if (totalMinutes < 60) return { unit: "minutes", minutes: totalMinutes }
  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) return { unit: "hours", hours: totalHours, minutes: totalMinutes % 60 }
  return { unit: "days", days: Math.floor(totalHours / 24), hours: totalHours % 24 }
}

/** The first visible character of a name, for the avatar well; "?" when there is none. */
export function nameInitial(name: string | undefined): string {
  const first = Array.from((name ?? "").trim())[0]
  return first ? first.toUpperCase() : "?"
}
