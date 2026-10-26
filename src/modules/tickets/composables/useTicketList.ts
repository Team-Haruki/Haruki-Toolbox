import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { getUserTickets } from "@/modules/tickets/api/user"
import type { Ticket } from "@/types/ticket"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import {
  getTicketStatusFilterOptions,
  type TicketStatusFilter,
} from "@/modules/tickets/lib/meta"
import {
  buildTicketListQuery,
  readPageQuery,
  readStatusQuery,
  ticketListQueryMatches,
} from "@/modules/tickets/lib/list-query"

export function useTicketList() {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const statusFilter = ref<TicketStatusFilter>(readStatusQuery(route.query.status))
  const statusOptions = computed(() => getTicketStatusFilterOptions(t))
  // The last failed load; cleared by the next attempt. The list renders it in
  // place of the rows so a backend failure never looks like "no tickets".
  const loadError = ref<ErrorDescription | null>(null)
  const {
    loading,
    items: tickets,
    total,
    page,
    pageSize,
    totalPages,
    resetPage,
    load: loadTickets,
    prevPage,
    nextPage,
  } = usePagedList<Ticket>({
    initialPage: readPageQuery(route.query.page),
    initialPageSize: 10,
    fetchPage: async ({ page, pageSize }) => {
      const userId = userStore.userId
      if (!userId) {
        return {
          items: [],
          total: 0,
        }
      }

      const params = createPageQuery(page, pageSize)
      if (statusFilter.value !== "all") {
        params.status = statusFilter.value
      }
      return getUserTickets(userId, params, { skipErrorToast: true })
    },
    onBeforeLoad: () => {
      loadError.value = null
    },
    onError: (error) => {
      loadError.value = describeError(error, t("tickets.list.toast.loadFailedFallback"))
    },
  })

  // Filter and page live in the URL so back/forward and reloads keep them.
  // Local -> URL. Needs no guard: when the route watcher below set the local
  // state, the query already matches and this is a no-op.
  watch([statusFilter, page], ([status, currentPage]) => {
    if (ticketListQueryMatches(route.query, status, currentPage)) return
    void router.replace({ query: buildTicketListQuery(route.query, status, currentPage) })
  })

  // URL -> local (back/forward, or a push to /tickets?status=&page= from
  // elsewhere): mirror the query and load that page once.
  let syncingFromRoute = false
  watch(
    () => [route.query.status, route.query.page] as const,
    ([status, pageValue]) => {
      const nextStatus = readStatusQuery(status)
      const nextPage = readPageQuery(pageValue)
      if (nextStatus === statusFilter.value && nextPage === page.value) return
      syncingFromRoute = true
      try {
        statusFilter.value = nextStatus
        page.value = nextPage
      } finally {
        syncingFromRoute = false
      }
      void loadTickets()
    }
  )

  // A filter picked in the UI starts over from page 1. Runs synchronously so
  // it still sees `syncingFromRoute` when the route watcher wrote the filter;
  // a queued (pre-flush) callback would run after the flag is cleared and
  // reset the page the URL asked for, loading the list twice.
  watch(
    statusFilter,
    () => {
      if (syncingFromRoute) return
      resetPage()
      void loadTickets()
    },
    { flush: "sync" }
  )

  onMounted(() => {
    void loadTickets()
  })

  function reload() {
    void loadTickets()
  }

  function openCreateTicket() {
    void router.push({ name: "tickets.create" })
  }

  function openTicketDetail(ticketId: string) {
    void router.push({ name: "tickets.detail", params: { ticketId } })
  }

  return {
    loading,
    loadError,
    tickets,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    statusOptions,
    prevPage,
    nextPage,
    reload,
    openCreateTicket,
    openTicketDetail,
  }
}
