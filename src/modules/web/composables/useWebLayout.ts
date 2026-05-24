import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { WEB_NAV_ITEMS, type NavItem } from "@/config/navigation"
import { getUserTickets } from "@/modules/tickets/api/user"

const APP_TITLE_KEY = "app.name"
const DEFAULT_PAGE_TITLE_KEY = "route.home"
const COPYRIGHT_START_YEAR = 2024
const HARUKI_LOGO = `${import.meta.env.BASE_URL}assets/haruki.ico`
const TICKET_REMINDER_REFRESH_MS = 60_000

export function useWebLayout() {
  const route = useRoute()
  const userStore = useUserStore()
  const { locale, t } = useI18n()
  const navGroupOpenState = ref<Record<string, boolean>>({})
  const pendingUserTicketCount = ref<number | null>(null)
  let pendingUserTicketCountLoading = false
  let pendingUserTicketCountRefreshQueued = false
  let pendingTicketRefreshTimer: ReturnType<typeof window.setInterval> | null = null

  const pageTitle = computed(() => {
    if (typeof route.meta.titleKey === "string" && route.meta.titleKey) {
      return t(route.meta.titleKey)
    }
    if (typeof route.meta.title === "string" && route.meta.title) {
      return route.meta.title
    }
    return t(DEFAULT_PAGE_TITLE_KEY)
  })
  const showPageTitle = computed(() => String(pageTitle.value || "").length <= 10)
  const copyrightYear = computed(() => {
    const currentYear = new Date().getFullYear()
    return currentYear > COPYRIGHT_START_YEAR
      ? `${COPYRIGHT_START_YEAR}-${currentYear}`
      : String(COPYRIGHT_START_YEAR)
  })
  const buildTime = computed(() => {
    const parsedBuildTime = new Date(__APP_BUILD_TIME__)

    if (Number.isNaN(parsedBuildTime.valueOf())) {
      return __APP_BUILD_TIME__
    }

    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsedBuildTime)
  })

  watchEffect(() => {
    const appTitle = t(APP_TITLE_KEY)
    const currentPageTitle = pageTitle.value
    document.title = currentPageTitle ? `${currentPageTitle} | ${appTitle}` : appTitle
  })

  function isRouteInNavGroup(item: NavItem) {
    return (item.items ?? []).some((subItem) => {
      if (!subItem.url) return false
      return route.path.startsWith(subItem.url)
    })
  }

  watch(
    () => route.path,
    () => {
      const nextState = { ...navGroupOpenState.value }
      WEB_NAV_ITEMS.forEach((item) => {
        if (isRouteInNavGroup(item)) {
          nextState[item.titleKey] = true
        } else if (nextState[item.titleKey] === undefined) {
          nextState[item.titleKey] = false
        }
      })
      navGroupOpenState.value = nextState
    },
    { immediate: true }
  )

  function isNavGroupOpen(item: NavItem) {
    return !!navGroupOpenState.value[item.titleKey]
  }

  function setNavGroupOpen(item: NavItem, open: boolean) {
    navGroupOpenState.value = {
      ...navGroupOpenState.value,
      [item.titleKey]: open,
    }
  }

  async function loadPendingUserTicketCount() {
    if (pendingUserTicketCountLoading) {
      pendingUserTicketCountRefreshQueued = true
      return
    }
    const userId = userStore.userId
    if (!userStore.isLoggedIn || !userId) {
      pendingUserTicketCount.value = null
      return
    }

    pendingUserTicketCountLoading = true
    try {
      const response = await getUserTickets(userId, {
        page: 1,
        page_size: 1,
        status: "pending_user",
      })
      pendingUserTicketCount.value = response.total
    } catch {
      pendingUserTicketCount.value = null
    } finally {
      pendingUserTicketCountLoading = false
      if (pendingUserTicketCountRefreshQueued) {
        pendingUserTicketCountRefreshQueued = false
        void loadPendingUserTicketCount()
      }
    }
  }

  function refreshPendingUserTicketCountIfVisible() {
    if (document.visibilityState !== "visible") return
    void loadPendingUserTicketCount()
  }

  watch(
    [() => route.fullPath, () => userStore.isLoggedIn, () => userStore.userId],
    () => {
      void loadPendingUserTicketCount()
    }
  )

  onMounted(() => {
    void loadPendingUserTicketCount()
    pendingTicketRefreshTimer = window.setInterval(refreshPendingUserTicketCountIfVisible, TICKET_REMINDER_REFRESH_MS)
    document.addEventListener("visibilitychange", refreshPendingUserTicketCountIfVisible)
  })

  onUnmounted(() => {
    if (pendingTicketRefreshTimer) {
      window.clearInterval(pendingTicketRefreshTimer)
    }
    document.removeEventListener("visibilitychange", refreshPendingUserTicketCountIfVisible)
  })

  return {
    harukiLogo: HARUKI_LOGO,
    userStore,
    pageTitle,
    showPageTitle,
    copyrightYear,
    appVersion: __APP_VERSION__,
    gitCommit: __APP_GIT_COMMIT__,
    buildTimeIso: __APP_BUILD_TIME__,
    buildTime,
    pendingUserTicketCount,
    isNavGroupOpen,
    setNavGroupOpen,
  }
}
