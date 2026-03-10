import { getAuthorizedSocialPlatforms } from "@/modules/admin-users/api/authorized-social"
import { getGameAccountBindings } from "@/modules/admin-users/api/game-binding"
import { getUserOAuthAuthorizations } from "@/modules/admin-users/api/oauth"
import { getSocialPlatform } from "@/modules/admin-users/api/social"
import { getUserActivity, getUserDetail } from "@/modules/admin-users/api/user"
import { translate } from "@/shared/i18n"
import type { LoadOptions } from "./useAdminUserDetailAsync"
import type { AdminUserDetailState } from "./useAdminUserDetailState"

type RunLoadFn = <T>(
  loadRef: { value: boolean },
  task: () => Promise<T>,
  options?: LoadOptions<T>
) => Promise<void>

interface CreateLoadersParams {
  userId: string
  state: AdminUserDetailState
  runLoad: RunLoadFn
}

export function createAdminUserDetailLoaders({ userId, state, runLoad }: CreateLoadersParams) {
  const { refs, markTabLoaded, shouldLoadTab } = state

  function shouldTriggerTabLoad(tab: "activity" | "oauth" | "game" | "social" | "auth-social") {
    if (!shouldLoadTab(tab)) {
      return false
    }

    switch (tab) {
      case "activity":
        return !refs.activityLoading.value
      case "oauth":
        return !refs.oauthLoading.value
      case "game":
        return !refs.gameBindingLoading.value
      case "social":
        return !refs.socialLoading.value
      case "auth-social":
        return !refs.authSocialLoading.value
    }
  }

  async function loadUser() {
    await runLoad(refs.loading, () => getUserDetail(userId), {
      errorTitle: translate("adminUsers.detail.toast.loadUserFailedTitle"),
      onSuccess: (data) => {
        refs.user.value = data
        refs.iosUploadCode.value = data.userData?.iosUploadCode ?? null
      },
    })
  }

  async function loadActivities() {
    await runLoad(refs.activityLoading, () => getUserActivity(userId), {
      errorTitle: translate("adminUsers.detail.toast.loadActivityFailedTitle"),
      onSuccess: (response) => {
        refs.activities.value = response.systemLogs ?? []
        markTabLoaded("activity")
      },
    })
  }

  async function loadOAuth() {
    await runLoad(refs.oauthLoading, () => getUserOAuthAuthorizations(userId), {
      errorTitle: translate("adminUsers.detail.toast.loadOAuthFailedTitle"),
      onSuccess: (data) => {
        refs.oauthAuths.value = data
        markTabLoaded("oauth")
      },
    })
  }

  async function loadGameBindings() {
    await runLoad(refs.gameBindingLoading, () => getGameAccountBindings(userId), {
      errorTitle: translate("adminUsers.detail.toast.loadGameBindingsFailedTitle"),
      onSuccess: (data) => {
        refs.gameBindings.value = data
        markTabLoaded("game")
      },
    })
  }

  async function loadSocialPlatform() {
    await runLoad(refs.socialLoading, () => getSocialPlatform(userId), {
      silent: true,
      onSuccess: (data) => {
        refs.socialPlatform.value = data
        markTabLoaded("social")
      },
      onError: () => {
        refs.socialPlatform.value = null
      },
    })
  }

  async function loadAuthorizedSocials() {
    await runLoad(refs.authSocialLoading, () => getAuthorizedSocialPlatforms(userId), {
      silent: true,
      onSuccess: (data) => {
        refs.authorizedSocials.value = data
        markTabLoaded("auth-social")
      },
      onError: () => {
        refs.authorizedSocials.value = []
      },
    })
  }

  function onTabChange(tab: string | number) {
    const value = String(tab)
    if (value === "activity" && shouldTriggerTabLoad("activity")) void loadActivities()
    if (value === "oauth" && shouldTriggerTabLoad("oauth")) void loadOAuth()
    if (value === "game" && shouldTriggerTabLoad("game")) void loadGameBindings()
    if (value === "social" && shouldTriggerTabLoad("social")) void loadSocialPlatform()
    if (value === "auth-social" && shouldTriggerTabLoad("auth-social")) void loadAuthorizedSocials()
  }

  return {
    loadUser,
    loadActivities,
    loadOAuth,
    loadGameBindings,
    loadSocialPlatform,
    loadAuthorizedSocials,
    onTabChange,
  }
}
