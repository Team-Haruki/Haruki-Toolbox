import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getAdminTickets } from "@/modules/tickets/api/admin"
import type { Ticket } from "@/types/ticket"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  getAdminTicketPriorityFilterOptions,
  getTicketStatusFilterOptions,
  type TicketPriorityFilter,
  type TicketStatusFilter,
} from "@/modules/tickets/lib/meta"

export function useAdminTicketList() {
  const { t } = useI18n()
  const router = useRouter()
  const search = ref("")
  const statusFilter = ref<TicketStatusFilter>("all")
  const priorityFilter = ref<TicketPriorityFilter>("all")
  const statusOptions = computed(() => getTicketStatusFilterOptions(t))
  const priorityOptions = computed(() => getAdminTicketPriorityFilterOptions(t))
  const {
    loading,
    items: tickets,
    page,
    total,
    totalPages,
    resetPage,
    load: loadTickets,
    prevPage,
    nextPage,
  } = usePagedList<Ticket>({
    initialPage: 1,
    initialPageSize: 20,
    fetchPage: async ({ page, pageSize }) => {
      const params = createPageQuery(page, pageSize)
      const keyword = search.value.trim()
      if (keyword) params.q = keyword
      if (statusFilter.value !== "all") params.status = statusFilter.value
      if (priorityFilter.value !== "all") params.priority = priorityFilter.value
      return getAdminTickets(params)
    },
    onError: (error) => {
      toast.error(t("tickets.adminList.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.toast.loadFailedFallback")),
      })
    },
  })

  useDebouncedWatch(
    search,
    () => {
      resetPage()
      void loadTickets()
    },
    400
  )

  watch([statusFilter, priorityFilter], () => {
    resetPage()
    void loadTickets()
  })

  onMounted(loadTickets)

  function openTicket(ticketId: string) {
    void router.push({ name: "admin.ticketDetail", params: { ticketId } })
  }

  return {
    loading,
    tickets,
    page,
    total,
    totalPages,
    search,
    statusFilter,
    priorityFilter,
    statusOptions,
    priorityOptions,
    prevPage,
    nextPage,
    openTicket,
  }
}
