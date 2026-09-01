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

export function isCatalogStatus(value: unknown): value is CatalogStatus {
  return typeof value === "string" && (CATALOG_STATUSES as readonly string[]).includes(value)
}

export function isCatalogSortDirection(value: unknown): value is CatalogSortDirection {
  return value === "asc" || value === "desc"
}
