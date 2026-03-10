import { computed, ref, watch, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { WEB_NAV_ITEMS, type NavItem } from "@/config/navigation"

const APP_TITLE_KEY = "app.name"
const DEFAULT_PAGE_TITLE_KEY = "route.home"
const COPYRIGHT_START_YEAR = 2024
const HARUKI_LOGO = "/assets/haruki.ico"

export function useWebLayout() {
  const route = useRoute()
  const userStore = useUserStore()
  const { t } = useI18n()
  const navGroupOpenState = ref<Record<string, boolean>>({})

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

  return {
    harukiLogo: HARUKI_LOGO,
    userStore,
    pageTitle,
    showPageTitle,
    copyrightYear,
    isNavGroupOpen,
    setNavGroupOpen,
  }
}
