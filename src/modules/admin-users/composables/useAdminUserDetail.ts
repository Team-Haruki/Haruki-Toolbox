import { onMounted } from "vue"
import { createAdminUserDetailActions } from "@/modules/admin-users/composables/useAdminUserDetailActions"
import { createAdminUserDetailAsync } from "@/modules/admin-users/composables/useAdminUserDetailAsync"
import { createAdminUserDetailLoaders } from "@/modules/admin-users/composables/useAdminUserDetailLoaders"
import { createAdminUserDetailState } from "@/modules/admin-users/composables/useAdminUserDetailState"

export function useAdminUserDetail(userId: string) {
  const state = createAdminUserDetailState()
  const { refs } = state

  const { runLoad, runTask, runAction } = createAdminUserDetailAsync(refs.actionLoading, refs.taskLoading)
  const loaders = createAdminUserDetailLoaders({ userId, state, runLoad })
  const actions = createAdminUserDetailActions({
    userId,
    state,
    runTask,
    runAction,
    loaders,
  })

  onMounted(loaders.loadUser)

  return {
    ...refs,
    onTabChange: loaders.onTabChange,
    ...actions,
  }
}
