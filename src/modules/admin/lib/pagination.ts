import { readQueryInt } from "@/lib/query-codec"
import type { LocationQueryValue } from "vue-router"

/** Page sizes every admin list offers; the default keeps list pages light. */
export const ADMIN_PAGE_SIZE_OPTIONS: readonly number[] = [20, 50, 100]
export const ADMIN_DEFAULT_PAGE_SIZE = 20

/** The page size from a `size` query value, or the default when absent or not an offered size. */
export function readAdminPageSize(value: LocationQueryValue | LocationQueryValue[] | undefined): number {
  const size = readQueryInt(value, { min: 1 })
  return size != null && ADMIN_PAGE_SIZE_OPTIONS.includes(size) ? size : ADMIN_DEFAULT_PAGE_SIZE
}

/** The page from a `page` query value, or 1 when absent or invalid. */
export function readAdminPage(value: LocationQueryValue | LocationQueryValue[] | undefined): number {
  return readQueryInt(value, { min: 1 }) ?? 1
}
