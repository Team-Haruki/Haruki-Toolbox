import { computed, ref, watch, type Ref } from "vue"
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/modules/admin/lib/pagination"
import {
  filterSponsors,
  pageCount,
  pageSlice,
  summarizeSponsors,
} from "@/modules/admin-sponsors/lib/sponsor-stats"
import type { AdminSponsorCategory, AdminSponsorProfile } from "@/types/admin"

export type SponsorCategoryFilter = AdminSponsorCategory | "all"

/**
 * How the sponsor list is looked at: a search box, a category filter and
 * paging, all in the browser (the backend sends the whole list at once).
 * The filters never change what the stat panel counts.
 */
export function useSponsorListView(sponsors: Ref<AdminSponsorProfile[]>) {
  const query = ref("")
  const category = ref<SponsorCategoryFilter>("all")
  const page = ref(1)
  const pageSize = ref(ADMIN_DEFAULT_PAGE_SIZE)

  const overview = computed(() => summarizeSponsors(sponsors.value))
  const filtered = computed(() => filterSponsors(sponsors.value, { query: query.value, category: category.value }))
  const totalPages = computed(() => pageCount(filtered.value.length, pageSize.value))
  const rows = computed(() => pageSlice(filtered.value, page.value, pageSize.value))
  const filtering = computed(() => query.value.trim() !== "" || category.value !== "all")

  // A new search starts on the first page; a list that shrank (a refresh, a
  // smaller page count) pulls the page back into range.
  watch([query, category, pageSize], () => {
    page.value = 1
  })
  watch(totalPages, (pages) => {
    if (page.value > pages) page.value = pages
  })

  function goToPage(next: number) {
    page.value = Math.min(Math.max(1, Math.trunc(next) || 1), totalPages.value)
  }

  function clearFilters() {
    query.value = ""
    category.value = "all"
  }

  return {
    query,
    category,
    page,
    pageSize,
    overview,
    filtered,
    totalPages,
    rows,
    filtering,
    goToPage,
    clearFilters,
  }
}
