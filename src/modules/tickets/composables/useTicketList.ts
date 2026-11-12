import { onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { getUserTickets } from "@/modules/tickets/api/user"
import type { Ticket } from "@/types/ticket"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import type { TicketStatusFilter } from "@/modules/tickets/lib/meta"
import { isUserTicketStatusFilter } from "@/modules/tickets/lib/user-ticket"
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
  // The last failed load; cleared by the next attempt. The list renders it in
  // place of the rows so a backend failure never looks like "no tickets".
  const loadError = ref<ErrorDescription | null>(null)
  /**
   * How many tickets wait for the user's reply, whatever the filter shows:
   * the `total` of a one-row request, like the sidebar badge. `null` until it
   * is known (or when that request failed; the list itself is unaffected).
   */
  const waitingCount = ref<number | null>(null)
  let waitingCountRequestId = 0

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
    onSuccess: (response) => {
      // The filtered list already carries the figure.
      if (statusFilter.value === "pending_user" && typeof response.total === "number") {
        waitingCountRequestId += 1
        waitingCount.value = response.total
      }
    },
    onError: (error) => {
      loadError.value = describeError(error, t("tickets.list.toast.loadFailedFallback"))
    },
  })

  async function loadWaitingCount() {
    const userId = userStore.userId
    if (!userId || statusFilter.value === "pending_user") return
    const requestId = ++waitingCountRequestId
    try {
      const response = await getUserTickets(userId, { page: 1, page_size: 1, status: "pending_user" }, { skipErrorToast: true })
      if (requestId === waitingCountRequestId) waitingCount.value = response.total
    } catch {
      // A missing badge is not worth an error: the list reports its own failures.
      if (requestId === waitingCountRequestId) waitingCount.value = null
    }
  }

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
    void loadWaitingCount()
  })

  function reload() {
    void loadTickets()
    void loadWaitingCount()
  }

  /** Picks a filter chip; anything that is not a filter (a chip toggled off) is ignored. */
  function setStatusFilter(value: unknown) {
    if (isUserTicketStatusFilter(value)) statusFilter.value = value
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
    waitingCount,
    prevPage,
    nextPage,
    reload,
    setStatusFilter,
  }
}
