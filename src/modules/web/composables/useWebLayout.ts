import { computed, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"

const APP_TITLE_KEY = "app.name"
const DEFAULT_PAGE_TITLE_KEY = "route.home"
const COPYRIGHT_START_YEAR = 2024
const HARUKI_LOGO = "/assets/haruki.ico"

interface WebNavItem {
  items?: Array<{ url?: string }>
}

export function useWebLayout() {
  const route = useRoute()
  const userStore = useUserStore()
  const { t } = useI18n()

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

  function isNavGroupOpen(item: WebNavItem) {
    return (item.items ?? []).some((subItem) => {
      if (!subItem.url) return false
      return route.path.startsWith(subItem.url)
    })
  }

  return {
    harukiLogo: HARUKI_LOGO,
    userStore,
    pageTitle,
    showPageTitle,
    copyrightYear,
    isNavGroupOpen,
  }
}
