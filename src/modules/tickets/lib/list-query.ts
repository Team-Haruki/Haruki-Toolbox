// The ticket list's filter and page as they live in the URL (`?status=&page=`).
import type { LocationQuery, LocationQueryRaw } from "vue-router"
import type { TicketStatusFilter } from "@/modules/tickets/lib/meta"

const STATUS_FILTER_VALUES: ReadonlySet<string> = new Set(["all", "open", "pending_admin", "pending_user", "resolved", "closed"])

export function readStatusQuery(value: unknown): TicketStatusFilter {
  return typeof value === "string" && STATUS_FILTER_VALUES.has(value) ? (value as TicketStatusFilter) : "all"
}

export function readPageQuery(value: unknown): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1
}

/** Whether the query already describes this filter and page (defaults stay absent). */
export function ticketListQueryMatches(query: LocationQuery, status: TicketStatusFilter, page: number): boolean {
  return readStatusQuery(query.status) === status && readPageQuery(query.page) === page
}

/** The query with `status` and `page` replaced; other parameters are kept. */
export function buildTicketListQuery(query: LocationQuery, status: TicketStatusFilter, page: number): LocationQueryRaw {
  const next: LocationQueryRaw = { ...query }
  delete next.status
  delete next.page
  if (status !== "all") next.status = status
  if (page > 1) next.page = String(page)
  return next
}
