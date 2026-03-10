import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { getUserTickets } from "@/modules/tickets/api/user"
import type { Ticket } from "@/types/ticket"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  getTicketStatusFilterOptions,
  type TicketStatusFilter,
} from "@/modules/tickets/lib/meta"

export function useTicketList() {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const statusFilter = ref<TicketStatusFilter>("all")
  const statusOptions = computed(() => getTicketStatusFilterOptions(t))
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
    initialPage: 1,
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
      return getUserTickets(userId, params)
    },
    onError: (error) => {
      toast.error(t("tickets.list.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.list.toast.loadFailedFallback")),
      })
    },
  })

  watch(statusFilter, () => {
    resetPage()
    void loadTickets()
  })

  onMounted(() => {
    void loadTickets()
  })

  function openCreateTicket() {
    void router.push("/tickets/new")
  }

  function openTicketDetail(ticketId: string) {
    void router.push(`/tickets/${ticketId}`)
  }

  return {
    loading,
    tickets,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    statusOptions,
    prevPage,
    nextPage,
    openCreateTicket,
    openTicketDetail,
  }
}
