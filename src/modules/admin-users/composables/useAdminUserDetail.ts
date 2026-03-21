import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { createAdminUserDetailActions } from "@/modules/admin-users/composables/useAdminUserDetailActions"
import { createAdminUserDetailAsync } from "@/modules/admin-users/composables/useAdminUserDetailAsync"
import { createAdminUserDetailLoaders } from "@/modules/admin-users/composables/useAdminUserDetailLoaders"
import { createAdminUserDetailState } from "@/modules/admin-users/composables/useAdminUserDetailState"

type UserDetailTab = "info" | "activity" | "oauth" | "game" | "social" | "auth-social" | "ios"
type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

function isUserDetailTab(tab: string): tab is UserDetailTab {
  return tab === "info"
    || tab === "activity"
    || tab === "oauth"
    || tab === "game"
    || tab === "social"
    || tab === "auth-social"
    || tab === "ios"
}

export function useAdminUserDetail(userId: ValueOrGetter<string>) {
  const state = createAdminUserDetailState()
  const { refs } = state
  const activeTab = ref<UserDetailTab>("info")
  const resolvedUserId = () => resolveValue(userId)
  let latestUserRouteRequestId = 0

  const { runLoad, runTask, runAction, invalidateLoads, invalidateActions } = createAdminUserDetailAsync(refs.actionLoading, refs.taskLoading)
  const loaders = createAdminUserDetailLoaders({ userId: resolvedUserId, state, runLoad })
  const actions = createAdminUserDetailActions({
    userId: resolvedUserId,
    state,
    runTask,
    runAction,
    loaders,
  })

  function onTabChange(tab: string | number) {
    const value = String(tab)
    if (isUserDetailTab(value)) {
      activeTab.value = value
    }
    loaders.onTabChange(tab)
  }

  async function loadUserForCurrentRoute() {
    const requestId = ++latestUserRouteRequestId
    invalidateLoads()
    invalidateActions()
    state.resetForUserChange()
    await loaders.loadUser()
    if (requestId !== latestUserRouteRequestId) return
    if (activeTab.value !== "info") {
      loaders.onTabChange(activeTab.value)
    }
  }

  watch(
    () => resolvedUserId(),
    (nextUserId, previousUserId) => {
      if (nextUserId === previousUserId) return
      void loadUserForCurrentRoute()
    }
  )

  onMounted(() => {
    void loadUserForCurrentRoute()
  })

  onBeforeUnmount(() => {
    latestUserRouteRequestId += 1
    invalidateLoads()
    invalidateActions()
  })

  return {
    ...refs,
    onTabChange,
    ...actions,
  }
}
