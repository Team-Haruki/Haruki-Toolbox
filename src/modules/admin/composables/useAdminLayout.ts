import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { ADMIN_NAV_SECTIONS } from "@/config/navigation"
import { getAdminTickets } from "@/modules/tickets/api/admin"
import { adminTicketRefreshSignal } from "@/modules/tickets/lib/admin-ticket-refresh"

const TICKET_REMINDER_REFRESH_MS = 60_000

export function useAdminLayout() {
  const route = useRoute()
  const userStore = useUserStore()
  const pendingTicketCount = ref<number | null>(null)
  let pendingTicketCountLoading = false
  let pendingTicketCountRefreshQueued = false
  let pendingTicketRefreshTimer: ReturnType<typeof window.setInterval> | null = null

  const visibleSections = computed(() =>
    ADMIN_NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.superOnly || userStore.isSuperAdmin),
      }))
      .filter((section) => section.items.length > 0)
  )

  const visibleNavItems = computed(() => visibleSections.value.flatMap((section) => section.items))

  const activeItem = computed(() => {
    const path = route.path
    return (
      visibleNavItems.value.find((item) => path.startsWith(`/admin/${item.segment}`))
      ?? visibleNavItems.value[0]
      ?? null
    )
  })

  // Detail routes (user detail, ticket detail, …) keep the nav highlight of
  // their list item, but the shell page header would then claim list-page
  // facts over detail content — only show it on the exact list route.
  const showPageHeader = computed(() => route.name === activeItem.value?.routeName)

  async function loadPendingTicketCount() {
    if (pendingTicketCountLoading) {
      pendingTicketCountRefreshQueued = true
      return
    }
    if (!userStore.isAdmin) {
      pendingTicketCount.value = null
      return
    }

    pendingTicketCountLoading = true
    try {
      const response = await getAdminTickets({
        page: 1,
        page_size: 1,
        quick_filter: "pending_admin",
      })
      pendingTicketCount.value = response.total
    } catch {
      pendingTicketCount.value = null
    } finally {
      pendingTicketCountLoading = false
      if (pendingTicketCountRefreshQueued) {
        pendingTicketCountRefreshQueued = false
        void loadPendingTicketCount()
      }
    }
  }

  function refreshPendingTicketCountIfVisible() {
    if (document.visibilityState !== "visible") return
    void loadPendingTicketCount()
  }

  // Refresh on entering the admin area (and on role change), not on every
  // query/param change within /admin — the 60s interval keeps the count fresh.
  watch(
    [() => route.path.startsWith("/admin"), () => userStore.isAdmin],
    ([inAdmin]) => {
      if (!inAdmin) return
      void loadPendingTicketCount()
    }
  )

  // Refresh promptly after an admin mutates a ticket, so the badge does not stay
  // stale while the admin lingers on a ticket detail page.
  watch(adminTicketRefreshSignal, () => {
    if (!route.path.startsWith("/admin")) return
    void loadPendingTicketCount()
  })

  onMounted(() => {
    void loadPendingTicketCount()
    pendingTicketRefreshTimer = window.setInterval(refreshPendingTicketCountIfVisible, TICKET_REMINDER_REFRESH_MS)
    document.addEventListener("visibilitychange", refreshPendingTicketCountIfVisible)
  })

  onUnmounted(() => {
    if (pendingTicketRefreshTimer) {
      window.clearInterval(pendingTicketRefreshTimer)
    }
    document.removeEventListener("visibilitychange", refreshPendingTicketCountIfVisible)
  })

  return {
    userStore,
    visibleSections,
    visibleNavItems,
    activeItem,
    showPageHeader,
    pendingTicketCount,
  }
}
