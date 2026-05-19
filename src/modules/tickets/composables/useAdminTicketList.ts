import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import {
  getAdminTicketNotificationPreference,
  getAdminTickets,
  updateAdminTicketNotificationPreference,
} from "@/modules/tickets/api/admin"
import type { Ticket } from "@/types/ticket"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  getAdminTicketQuickFilterOptions,
  getAdminTicketPriorityFilterOptions,
  getTicketStatusFilterOptions,
  type AdminTicketQuickFilter,
  type TicketPriorityFilter,
  type TicketStatusFilter,
} from "@/modules/tickets/lib/meta"

export function useAdminTicketList() {
  const { t } = useI18n()
  const router = useRouter()
  const search = ref("")
  const quickFilter = ref<AdminTicketQuickFilter>("all")
  const statusFilter = ref<TicketStatusFilter>("all")
  const priorityFilter = ref<TicketPriorityFilter>("all")
  const ticketNotificationsEnabled = ref(false)
  const ticketNotificationsLoading = ref(false)
  const ticketNotificationsSaving = ref(false)
  const quickFilterOptions = computed(() => getAdminTicketQuickFilterOptions(t))
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
      if (quickFilter.value !== "all") params.quick_filter = quickFilter.value
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

  watch([quickFilter, statusFilter, priorityFilter], () => {
    resetPage()
    void loadTickets()
  })

  async function loadTicketNotificationPreference() {
    ticketNotificationsLoading.value = true
    try {
      const preference = await getAdminTicketNotificationPreference()
      ticketNotificationsEnabled.value = preference.ticketEmailNotificationsEnabled
    } catch (error: unknown) {
      toast.error(t("tickets.adminList.notifications.loadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.loadFailedFallback")),
      })
    } finally {
      ticketNotificationsLoading.value = false
    }
  }

  async function setTicketNotificationsEnabled(enabled: boolean) {
    if (ticketNotificationsSaving.value) return
    const previous = ticketNotificationsEnabled.value
    ticketNotificationsEnabled.value = enabled
    ticketNotificationsSaving.value = true
    try {
      const preference = await updateAdminTicketNotificationPreference(enabled)
      ticketNotificationsEnabled.value = preference.ticketEmailNotificationsEnabled
      toast.success(
        preference.ticketEmailNotificationsEnabled
          ? t("tickets.adminList.notifications.enabledToast")
          : t("tickets.adminList.notifications.disabledToast")
      )
    } catch (error: unknown) {
      ticketNotificationsEnabled.value = previous
      toast.error(t("tickets.adminList.notifications.saveFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.saveFailedFallback")),
      })
    } finally {
      ticketNotificationsSaving.value = false
    }
  }

  onMounted(() => {
    void loadTickets()
    void loadTicketNotificationPreference()
  })

  function openTicket(ticketId: string) {
    void router.push({ name: "admin.ticketDetail", params: { ticketId } })
  }

  function refreshTickets() {
    void loadTickets()
  }

  return {
    loading,
    tickets,
    page,
    total,
    totalPages,
    search,
    quickFilter,
    statusFilter,
    priorityFilter,
    ticketNotificationsEnabled,
    ticketNotificationsLoading,
    ticketNotificationsSaving,
    quickFilterOptions,
    statusOptions,
    priorityOptions,
    setTicketNotificationsEnabled,
    refreshTickets,
    prevPage,
    nextPage,
    openTicket,
  }
}
