import { onBeforeUnmount, onMounted, watch } from "vue"
import { createAdminUserDetailActions } from "@/modules/admin-users/composables/useAdminUserDetailActions"
import { createAdminUserDetailAsync } from "@/modules/admin-users/composables/useAdminUserDetailAsync"
import { createAdminUserDetailLoaders } from "@/modules/admin-users/composables/useAdminUserDetailLoaders"
import { createAdminUserDetailState } from "@/modules/admin-users/composables/useAdminUserDetailState"

type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

export function useAdminUserDetail(userId: ValueOrGetter<string>) {
  const state = createAdminUserDetailState()
  const { refs } = state
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

  async function loadUserForCurrentRoute() {
    const requestId = ++latestUserRouteRequestId
    invalidateLoads()
    invalidateActions()
    state.resetForUserChange()
    await loaders.loadUser()
    if (requestId !== latestUserRouteRequestId) return
    // Nothing to show the sections under when the user itself did not load.
    if (refs.user.value) {
      loaders.loadSections()
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
    sectionLoaded: state.sectionLoaded,
    reloadUser: () => {
      void loadUserForCurrentRoute()
    },
    // A section's inline retry.
    reloadActivity: () => {
      void loaders.loadActivities()
    },
    reloadOAuth: () => {
      void loaders.loadOAuth()
    },
    reloadGameBindings: () => {
      void loaders.loadGameBindings()
    },
    reloadSocial: () => {
      void loaders.loadSocialPlatform()
    },
    reloadAuthorizedSocials: () => {
      void loaders.loadAuthorizedSocials()
    },
    ...actions,
  }
}
