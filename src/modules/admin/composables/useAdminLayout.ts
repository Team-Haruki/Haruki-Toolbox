import { computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { ADMIN_NAV_ITEMS } from "@/config/navigation"

export function useAdminLayout() {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const { t } = useI18n()

  watch(
    () => userStore.isAdmin,
    (isAdmin) => {
      if (isAdmin) return
      toast.error(t("core.auth.permissionDeniedTitle"), { description: t("core.auth.requireAdminDescription") })
      void router.push("/")
    },
    { immediate: true }
  )

  const visibleNavItems = computed(() =>
    ADMIN_NAV_ITEMS.filter((item) => !item.superOnly || userStore.isSuperAdmin)
  )

  const activeTab = computed(() => {
    const path = route.path
    const matched = visibleNavItems.value.find((item) => path.startsWith(`/admin/${item.segment}`))
    return matched?.value || "dashboard"
  })

  function onTabChange(value: string | number) {
    const target = visibleNavItems.value.find((item) => item.value === String(value))
    if (!target) return
    void router.push(`/admin/${target.segment}`)
  }

  return {
    userStore,
    visibleNavItems,
    activeTab,
    onTabChange,
  }
}
