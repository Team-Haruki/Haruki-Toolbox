import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import {
  getAdminTicketNotificationRecipients,
  getAdminTicketNotificationPreference,
  getAdminTickets,
  updateAdminUserTicketNotificationPreference,
  updateAdminTicketNotificationPreference,
} from "@/modules/tickets/api/admin"
import type { Ticket } from "@/types/ticket"
import type { AdminTicketNotificationRecipient } from "@/types/admin"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { extractErrorMessage } from "@/lib/error-utils"
import { useUserStore } from "@/shared/stores/user"
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
  const userStore = useUserStore()
  const search = ref("")
  const quickFilter = ref<AdminTicketQuickFilter>("all")
  const statusFilter = ref<TicketStatusFilter>("all")
  const priorityFilter = ref<TicketPriorityFilter>("all")
  const ticketNotificationsEnabled = ref(false)
  const ticketNotificationsLoading = ref(false)
  const ticketNotificationsSaving = ref(false)
  const ticketNotificationRecipients = ref<AdminTicketNotificationRecipient[]>([])
  const ticketNotificationRecipientsLoading = ref(false)
  const ticketNotificationRecipientsSavingUserId = ref("")
  const ticketNotificationRecipientsDialogOpen = ref(false)
  const ticketNotificationRecipientsLoaded = ref(false)
  const quickFilterOptions = computed(() => getAdminTicketQuickFilterOptions(t))
  const statusOptions = computed(() => getTicketStatusFilterOptions(t))
  const priorityOptions = computed(() => getAdminTicketPriorityFilterOptions(t))
  const isSuperAdmin = computed(() => userStore.isSuperAdmin)
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

  function syncTicketNotificationRecipient(userId: string, enabled: boolean) {
    ticketNotificationRecipients.value = ticketNotificationRecipients.value.map((item) =>
      item.userId === userId
        ? {
            ...item,
            ticketEmailNotificationsEnabled: enabled,
          }
        : item
    )

    if (userStore.userId === userId) {
      ticketNotificationsEnabled.value = enabled
    }
  }

  async function loadTicketNotificationPreference() {
    ticketNotificationsLoading.value = true
    try {
      const preference = await getAdminTicketNotificationPreference()
      ticketNotificationsEnabled.value = preference.ticketEmailNotificationsEnabled
      if (userStore.userId) {
        syncTicketNotificationRecipient(userStore.userId, preference.ticketEmailNotificationsEnabled)
      }
    } catch (error: unknown) {
      toast.error(t("tickets.adminList.notifications.loadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.loadFailedFallback")),
      })
    } finally {
      ticketNotificationsLoading.value = false
    }
  }

  async function loadTicketNotificationRecipients() {
    if (!userStore.isSuperAdmin) return
    ticketNotificationRecipientsLoading.value = true
    try {
      ticketNotificationRecipients.value = await getAdminTicketNotificationRecipients()
      ticketNotificationRecipientsLoaded.value = true
    } catch (error: unknown) {
      toast.error(t("tickets.adminList.notifications.manageLoadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.manageLoadFailedFallback")),
      })
    } finally {
      ticketNotificationRecipientsLoading.value = false
    }
  }

  async function openTicketNotificationRecipientsDialog() {
    if (!userStore.isSuperAdmin) return
    ticketNotificationRecipientsDialogOpen.value = true
    if (!ticketNotificationRecipientsLoaded.value && !ticketNotificationRecipientsLoading.value) {
      await loadTicketNotificationRecipients()
    }
  }

  async function refreshTicketNotificationRecipients() {
    ticketNotificationRecipientsLoaded.value = false
    await loadTicketNotificationRecipients()
  }

  async function setTicketNotificationsEnabled(enabled: boolean) {
    if (ticketNotificationsSaving.value) return
    const previous = ticketNotificationsEnabled.value
    ticketNotificationsEnabled.value = enabled
    ticketNotificationsSaving.value = true
    try {
      const preference = await updateAdminTicketNotificationPreference(enabled)
      ticketNotificationsEnabled.value = preference.ticketEmailNotificationsEnabled
      if (userStore.userId) {
        syncTicketNotificationRecipient(userStore.userId, preference.ticketEmailNotificationsEnabled)
      }
      toast.success(
        preference.ticketEmailNotificationsEnabled
          ? t("tickets.adminList.notifications.enabledToast")
          : t("tickets.adminList.notifications.disabledToast")
      )
    } catch (error: unknown) {
      ticketNotificationsEnabled.value = previous
      if (userStore.userId) {
        syncTicketNotificationRecipient(userStore.userId, previous)
      }
      toast.error(t("tickets.adminList.notifications.saveFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.saveFailedFallback")),
      })
    } finally {
      ticketNotificationsSaving.value = false
    }
  }

  async function setTicketNotificationRecipientEnabled(userId: string, enabled: boolean) {
    if (ticketNotificationRecipientsSavingUserId.value === userId) return
    const previous = ticketNotificationRecipients.value.find((item) => item.userId === userId)
    ticketNotificationRecipientsSavingUserId.value = userId
    if (previous) {
      syncTicketNotificationRecipient(userId, enabled)
    }
    try {
      const updated = await updateAdminUserTicketNotificationPreference(userId, enabled)
      syncTicketNotificationRecipient(updated.userId, updated.ticketEmailNotificationsEnabled)
      const displayName = updated.name || updated.userId
      toast.success(
        updated.ticketEmailNotificationsEnabled
          ? t("tickets.adminList.notifications.manageEnabledToast", { name: displayName })
          : t("tickets.adminList.notifications.manageDisabledToast", { name: displayName })
      )
    } catch (error: unknown) {
      if (previous) {
        syncTicketNotificationRecipient(previous.userId, previous.ticketEmailNotificationsEnabled)
      }
      toast.error(t("tickets.adminList.notifications.manageSaveFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminList.notifications.manageSaveFailedFallback")),
      })
    } finally {
      ticketNotificationRecipientsSavingUserId.value = ""
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
    isSuperAdmin,
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
    ticketNotificationRecipients,
    ticketNotificationRecipientsLoading,
    ticketNotificationRecipientsSavingUserId,
    ticketNotificationRecipientsDialogOpen,
    quickFilterOptions,
    statusOptions,
    priorityOptions,
    setTicketNotificationsEnabled,
    openTicketNotificationRecipientsDialog,
    refreshTicketNotificationRecipients,
    setTicketNotificationRecipientEnabled,
    refreshTickets,
    prevPage,
    nextPage,
    openTicket,
  }
}
