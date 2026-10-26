import type { Component } from "vue"

/** One selectable option in a catalog filter field. */
export type CatalogFieldOption = {
  value: string
  label: string
  /** Small round icon (character avatar, unit logo…). */
  iconUrl?: string | null
  /** Fallback color dot when there is no icon (difficulty, unit color…). */
  color?: string | null
}

export type CatalogSortOption = {
  value: string
  label: string
}

export type CatalogViewOption = {
  value: string
  label: string
  icon?: Component
}

export type CatalogSortDirection = "asc" | "desc"

export type CatalogStatus = "upcoming" | "ongoing" | "ended"

export const CATALOG_SORT_DIRECTIONS: readonly CatalogSortDirection[] = ["asc", "desc"]

export const CATALOG_STATUSES: readonly CatalogStatus[] = ["upcoming", "ongoing", "ended"]

export const CATALOG_PAGE_SIZES: readonly number[] = [30, 60, 120]

export const CATALOG_DEFAULT_PAGE_SIZE = 60

/**
 * Year chips a filter panel draws as placeholders until master data resolves
 * (the dumps span about this many release years), so the row keeps its
 * height and the grid below does not shift when the real chips render.
 */
export const CATALOG_YEAR_PLACEHOLDER_COUNT = 6

/**
 * Status of a time-boxed entity (event, gacha) at `nowMs`. Missing start
 * counts as already started; missing end counts as never ending, so an
 * entity with no dates at all reads as ongoing rather than vanishing.
 */
export function resolveCatalogStatus(
  startAt: number | null | undefined,
  endAt: number | null | undefined,
  nowMs: number,
): CatalogStatus {
  if (startAt != null && startAt > nowMs) {
    return "upcoming"
  }
  if (endAt != null && endAt <= nowMs) {
    return "ended"
  }
  return "ongoing"
}

/**
 * An end further out than this reads as "no end": permanent gacha pools are
 * dumped with an end date in 2099, and a "26734 days left" countdown is
 * noise. Ten years is far beyond any real event or banner window.
 */
export const CATALOG_PERMANENT_END_THRESHOLD_MS = 10 * 365 * 24 * 3_600_000

export function isCatalogPermanentEnd(endAt: number | null | undefined, nowMs: number): boolean {
  return endAt != null && Number.isFinite(endAt) && endAt - nowMs > CATALOG_PERMANENT_END_THRESHOLD_MS
}

export function isCatalogStatus(value: unknown): value is CatalogStatus {
  return typeof value === "string" && (CATALOG_STATUSES as readonly string[]).includes(value)
}

export function isCatalogSortDirection(value: unknown): value is CatalogSortDirection {
  return value === "asc" || value === "desc"
}
