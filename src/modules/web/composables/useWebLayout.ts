import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { WEB_NAV_SECTIONS, type NavItem } from "@/config/navigation"
import { documentTitleOverride } from "@/composables/useDocumentTitle"
import { getUserTickets } from "@/modules/tickets/api/user"
import { collectNavUrls, navGroupContainsUrl, resolveActiveNavUrl } from "@/modules/web/lib/nav-active"

const APP_TITLE_KEY = "app.name"
const DEFAULT_PAGE_TITLE_KEY = "route.home"
const COPYRIGHT_START_YEAR = 2024
const HARUKI_LOGO = `${import.meta.env.BASE_URL}assets/haruki.ico`
const TICKET_REMINDER_REFRESH_MS = 60_000
// Links rendered outside WEB_NAV_SECTIONS (header, account group).
const STATIC_NAV_URLS = ["/", "/about", "/admin", "/tickets"] as const
const NAV_URLS = collectNavUrls(WEB_NAV_SECTIONS, STATIC_NAV_URLS)

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
    // Detail pages publish their entity name through the override; the
    // topbar keeps showing the route title.
    const currentPageTitle = documentTitleOverride.value ?? pageTitle.value
    document.title = currentPageTitle ? `${currentPageTitle} | ${appTitle}` : appTitle
  })

  // The active link is the longest nav url covering the current path, so
  // `/cards/box` lights the card-box entry and not the catalog `/cards` one.
  const activeNavUrl = computed(() => resolveActiveNavUrl(route.path, NAV_URLS))

  function isNavLinkActive(url: string) {
    return activeNavUrl.value === url
  }

  function isNavGroupActive(item: NavItem) {
    return navGroupContainsUrl(item, activeNavUrl.value)
  }

  watch(
    activeNavUrl,
    () => {
      const nextState = { ...navGroupOpenState.value }
      WEB_NAV_SECTIONS.forEach((section) => {
        section.items.forEach((item) => {
          if (!item.items) return
          if (isNavGroupActive(item)) {
            nextState[item.titleKey] = true
          } else if (nextState[item.titleKey] === undefined) {
            nextState[item.titleKey] = false
          }
        })
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
      // Background badge count: a failure must stay silent (the tickets page
      // reports its own load failure inline; two toasts for one outage is noise).
      const response = await getUserTickets(userId, {
        page: 1,
        page_size: 1,
        status: "pending_user",
      }, { skipErrorToast: true })
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

  // Login-state changes trigger a load; steady-state freshness comes from the
  // 60s visible-only interval (navigations no longer fire extra requests).
  watch(
    [() => userStore.isLoggedIn, () => userStore.userId],
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
    copyrightYear,
    appVersion: __APP_VERSION__,
    gitCommit: __APP_GIT_COMMIT__,
    buildTimeIso: __APP_BUILD_TIME__,
    buildTime,
    pendingUserTicketCount,
    isNavGroupOpen,
    setNavGroupOpen,
    isNavLinkActive,
    isNavGroupActive,
  }
}
