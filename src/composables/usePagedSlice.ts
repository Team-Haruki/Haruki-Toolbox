import { computed, watch, type ComputedRef, type Ref } from "vue"
import { clampPage, countPages, sliceItemsForPage } from "@/lib/pagination-window"

export type PagedSlice<T> = {
  pageItems: ComputedRef<T[]>
  totalPages: ComputedRef<number>
  /** The page actually rendered — `page` clamped into range. */
  currentPage: ComputedRef<number>
}

/**
 * Client-side paging over an already filtered/sorted array. When the item
 * count shrinks below the current page (filter change, region switch) the
 * page ref is clamped back into range so the URL and the view agree.
 */
export function usePagedSlice<T>(
  items: Ref<readonly T[]>,
  page: Ref<number>,
  pageSize: Ref<number>,
): PagedSlice<T> {
  const totalPages = computed(() => countPages(items.value.length, pageSize.value))
  const currentPage = computed(() => clampPage(page.value, totalPages.value))
  const pageItems = computed(() => sliceItemsForPage(items.value, currentPage.value, pageSize.value))

  watch([totalPages, () => page.value], ([total, requested]) => {
    const clamped = clampPage(requested, total)
    if (clamped !== requested) {
      page.value = clamped
    }
  })

  return { pageItems, totalPages, currentPage }
}
