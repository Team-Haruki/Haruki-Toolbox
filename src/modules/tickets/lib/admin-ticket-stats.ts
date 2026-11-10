/**
 * The figures of the admin ticket list's stat panel.
 *
 * The backend has no ticket statistics endpoint; what it does have is the
 * `total` of `GET /api/admin/tickets`, which counts every ticket matching the
 * request's filters whatever the page size (the admin nav's pending badge
 * reads it the same way). So each whole-set figure is one list request for a
 * single row with one filter, planned here. Tickets cannot be filtered by
 * category, so that breakdown only ever covers the rows it is given.
 */
import type { QueryParams } from "@/core/http/query"
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/types/ticket"

export const ADMIN_TICKET_STAT_STATUSES: readonly TicketStatus[] = ["pending_admin", "open", "pending_user", "resolved", "closed"]
export const ADMIN_TICKET_STAT_PRIORITIES: readonly TicketPriority[] = ["urgent", "high", "normal", "low"]
export const ADMIN_TICKET_STAT_CATEGORIES: readonly TicketCategory[] = ["upload", "account", "bug", "feature", "other"]

export type AdminTicketCountKey =
  | `status:${TicketStatus}`
  | `priority:${TicketPriority}`
  | "unassigned"
  | "mine"

export type AdminTicketCountQuery = {
  key: AdminTicketCountKey
  params: QueryParams
}

/** A count that is unknown (still loading, or its request failed) is `null`. */
export type AdminTicketCounts = Partial<Record<AdminTicketCountKey, number | null>>

/** One single-row list request per figure; the answer is the response's `total`. */
export function buildAdminTicketCountQueries(): AdminTicketCountQuery[] {
  const one = { page: 1, page_size: 1 }
  return [
    ...ADMIN_TICKET_STAT_STATUSES.map((status): AdminTicketCountQuery => ({ key: `status:${status}`, params: { ...one, status } })),
    ...ADMIN_TICKET_STAT_PRIORITIES.map((priority): AdminTicketCountQuery => ({ key: `priority:${priority}`, params: { ...one, priority } })),
    { key: "unassigned", params: { ...one, quick_filter: "unassigned" } },
    { key: "mine", params: { ...one, quick_filter: "mine" } },
  ]
}

export type AdminTicketBreakdownEntry<T extends string> = {
  key: T
  count: number
}

export type AdminTicketStatSummary = {
  /** Every ticket the admin can see: the five statuses added up. `null` until all five are known. */
  total: number | null
  /** Tickets still in play: open, pending admin and pending user. */
  active: number | null
  status: Record<TicketStatus, number | null>
  priority: Record<TicketPriority, number | null>
  unassigned: number | null
  mine: number | null
  /** Known statuses only, in display order; empty when none is known. */
  byStatus: AdminTicketBreakdownEntry<TicketStatus>[]
  byPriority: AdminTicketBreakdownEntry<TicketPriority>[]
}

function known(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

function sumKnown(values: readonly (number | null)[]): number | null {
  let sum = 0
  for (const value of values) {
    if (value == null) return null
    sum += value
  }
  return sum
}

export function summarizeAdminTicketCounts(counts: AdminTicketCounts): AdminTicketStatSummary {
  const status = Object.fromEntries(
    ADMIN_TICKET_STAT_STATUSES.map((value) => [value, known(counts[`status:${value}`])]),
  ) as Record<TicketStatus, number | null>
  const priority = Object.fromEntries(
    ADMIN_TICKET_STAT_PRIORITIES.map((value) => [value, known(counts[`priority:${value}`])]),
  ) as Record<TicketPriority, number | null>

  const entries = <T extends string>(order: readonly T[], source: Record<T, number | null>) =>
    order.flatMap((key): AdminTicketBreakdownEntry<T>[] => {
      const count = source[key]
      return count == null ? [] : [{ key, count }]
    })

  return {
    total: sumKnown(ADMIN_TICKET_STAT_STATUSES.map((value) => status[value])),
    active: sumKnown([status.open, status.pending_admin, status.pending_user]),
    status,
    priority,
    unassigned: known(counts.unassigned),
    mine: known(counts.mine),
    byStatus: entries(ADMIN_TICKET_STAT_STATUSES, status),
    byPriority: entries(ADMIN_TICKET_STAT_PRIORITIES, priority),
  }
}

/**
 * How the given rows split by category, in the fixed category order, empty
 * categories left out. It describes these rows only (the page on screen).
 */
export function countTicketCategories(rows: readonly Pick<Ticket, "category">[]): AdminTicketBreakdownEntry<TicketCategory>[] {
  const tally = new Map<TicketCategory, number>()
  for (const row of rows) {
    tally.set(row.category, (tally.get(row.category) ?? 0) + 1)
  }
  return ADMIN_TICKET_STAT_CATEGORIES.flatMap((key) => {
    const count = tally.get(key) ?? 0
    return count > 0 ? [{ key, count }] : []
  })
}

/** `part` of `total` as a whole percentage; `null` when there is no total to divide by. */
export function wholePercent(part: number, total: number | null | undefined): number | null {
  if (total == null || !Number.isFinite(total) || total <= 0 || !Number.isFinite(part)) {
    return null
  }
  return Math.round(Math.min(1, Math.max(0, part / total)) * 100)
}
