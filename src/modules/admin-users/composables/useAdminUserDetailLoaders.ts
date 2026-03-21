import { getAuthorizedSocialPlatforms } from "@/modules/admin-users/api/authorized-social"
import { getGameAccountBindings } from "@/modules/admin-users/api/game-binding"
import { getUserOAuthAuthorizations } from "@/modules/admin-users/api/oauth"
import { getSocialPlatform } from "@/modules/admin-users/api/social"
import { getUserActivity, getUserDetail } from "@/modules/admin-users/api/user"
import { translate } from "@/shared/i18n"
import type { LoaderRunOptions } from "./useAdminUserDetailActionTypes"
import type { LoadOptions } from "./useAdminUserDetailAsync"
import type { AdminUserDetailState } from "./useAdminUserDetailState"

type RunLoadFn = <T>(
  loadRef: { value: boolean },
  task: () => Promise<T>,
  options?: LoadOptions<T>
) => Promise<void>

interface CreateLoadersParams {
  userId: () => string
  state: AdminUserDetailState
  runLoad: RunLoadFn
}

export function createAdminUserDetailLoaders({ userId, state, runLoad }: CreateLoadersParams) {
  const { refs, markTabLoaded, shouldLoadTab } = state

  function toLoadOptions(options?: LoaderRunOptions) {
    return {
      throwOnError: options?.throwOnError,
      notifyOnError: options?.notifyOnError,
    }
  }

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

  async function loadUser(options?: LoaderRunOptions) {
    await runLoad(refs.loading, () => getUserDetail(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadUserFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (data) => {
        refs.user.value = data
        refs.iosUploadCode.value = data.userData?.iosUploadCode ?? null
      },
    })
  }

  async function loadActivities(options?: LoaderRunOptions) {
    await runLoad(refs.activityLoading, () => getUserActivity(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadActivityFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (response) => {
        refs.activities.value = response.systemLogs ?? []
        markTabLoaded("activity")
      },
    })
  }

  async function loadOAuth(options?: LoaderRunOptions) {
    await runLoad(refs.oauthLoading, () => getUserOAuthAuthorizations(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadOAuthFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (data) => {
        refs.oauthAuths.value = data
        markTabLoaded("oauth")
      },
    })
  }

  async function loadGameBindings(options?: LoaderRunOptions) {
    await runLoad(refs.gameBindingLoading, () => getGameAccountBindings(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadGameBindingsFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (data) => {
        refs.gameBindings.value = data
        markTabLoaded("game")
      },
    })
  }

  async function loadSocialPlatform(options?: LoaderRunOptions) {
    await runLoad(refs.socialLoading, () => getSocialPlatform(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadSocialFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (data) => {
        refs.socialPlatform.value = data
        markTabLoaded("social")
      },
    })
  }

  async function loadAuthorizedSocials(options?: LoaderRunOptions) {
    await runLoad(refs.authSocialLoading, () => getAuthorizedSocialPlatforms(userId()), {
      errorTitle: translate("adminUsers.detail.toast.loadAuthSocialFailedTitle"),
      ...toLoadOptions(options),
      onSuccess: (data) => {
        refs.authorizedSocials.value = data
        markTabLoaded("auth-social")
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
