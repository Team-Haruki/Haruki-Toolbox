export type PaginationWindowItem = number | "ellipsis"

/**
 * Page numbers to render around `page`: always the first and last page,
 * `siblings` pages on each side of the current one, and an ellipsis marker
 * wherever a gap of more than one page is skipped. Small totals render every
 * page (no ellipsis) so short catalogs never look truncated.
 */
export function buildPaginationWindow(
  page: number,
  totalPages: number,
  siblings = 1,
): PaginationWindowItem[] {
  const total = Math.max(1, Math.trunc(totalPages))
  const current = Math.min(Math.max(1, Math.trunc(page)), total)
  const span = Math.max(0, Math.trunc(siblings))

  // Boundary (2) + current + siblings on both sides + the two ellipsis slots
  // form the maximum window; anything smaller lists every page.
  const maxItems = 2 * span + 5
  if (total <= maxItems) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  let start = Math.max(2, current - span)
  let end = Math.min(total - 1, current + span)

  // Keep the window width stable near the edges so the control does not
  // jump around while paging through the first/last few pages.
  const width = 2 * span + 1
  if (current - span <= 2) {
    start = 2
    end = Math.min(total - 1, width + 1)
  } else if (current + span >= total - 1) {
    end = total - 1
    start = Math.max(2, total - width)
  }

  // An ellipsis standing in for exactly one page is longer than the page.
  if (start === 3) {
    start = 2
  }
  if (end === total - 2) {
    end = total - 1
  }

  const items: PaginationWindowItem[] = [1]
  if (start > 2) {
    items.push("ellipsis")
  }
  for (let index = start; index <= end; index += 1) {
    items.push(index)
  }
  if (end < total - 1) {
    items.push("ellipsis")
  }
  items.push(total)
  return items
}

export function countPages(total: number, pageSize: number): number {
  const size = Math.max(1, Math.trunc(pageSize))
  return Math.max(1, Math.ceil(Math.max(0, total) / size))
}

export function clampPage(page: number, totalPages: number): number {
  const total = Math.max(1, Math.trunc(totalPages))
  if (!Number.isFinite(page)) {
    return 1
  }
  return Math.min(Math.max(1, Math.trunc(page)), total)
}

export function sliceItemsForPage<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const size = Math.max(1, Math.trunc(pageSize))
  const current = clampPage(page, countPages(items.length, size))
  const start = (current - 1) * size
  return items.slice(start, start + size)
}
