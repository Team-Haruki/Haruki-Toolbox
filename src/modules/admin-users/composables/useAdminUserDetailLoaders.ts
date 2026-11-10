import type { Ref } from "vue"
import { getAuthorizedSocialPlatforms } from "@/modules/admin-users/api/authorized-social"
import { getGameAccountBindings } from "@/modules/admin-users/api/game-binding"
import { getUserOAuthAuthorizations } from "@/modules/admin-users/api/oauth"
import { getSocialPlatform } from "@/modules/admin-users/api/social"
import { getUserActivity, getUserDetail } from "@/modules/admin-users/api/user"
import { describeError, isNotFoundError, type ErrorDescription } from "@/lib/error-utils"
import { assertUserDetailPayload } from "@/modules/admin-users/lib/user-detail-payload"
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
  const { refs, markSectionLoaded } = state

  /**
   * Options for a section's load. Without explicit options it is the page
   * loading the section: a failure is shown inside the section (with a
   * retry), not as a toast. A strict refresh after an action keeps the
   * caller's handling and leaves the list on screen as it was.
   */
  function sectionLoadOptions(errorRef: Ref<ErrorDescription | null>, errorTitle: string, options?: LoaderRunOptions) {
    const inline = options?.notifyOnError === undefined
    if (inline) {
      errorRef.value = null
    }
    return {
      errorTitle,
      throwOnError: options?.throwOnError,
      notifyOnError: inline ? false : options?.notifyOnError,
      onError: (error: unknown) => {
        if (!inline) return
        errorRef.value = describeError(error, translate("adminUsers.detail.toast.actionFailedFallback"))
      },
    }
  }

  async function loadUser(options?: LoaderRunOptions) {
    // The initial load reports inline (not found vs. retryable failure) in
    // place of the page; a strict refresh after an action keeps its own handling.
    const inline = options?.notifyOnError === undefined
    if (inline) {
      refs.userNotFound.value = false
      refs.userLoadError.value = null
    }
    // A 200 with another shape is an error like any other (inline, retryable).
    await runLoad(refs.loading, async () => assertUserDetailPayload(await getUserDetail(userId())), {
      errorTitle: translate("adminUsers.detail.toast.loadUserFailedTitle"),
      throwOnError: options?.throwOnError,
      notifyOnError: inline ? false : options?.notifyOnError,
      onSuccess: (data) => {
        refs.user.value = data
        refs.userNotFound.value = false
        refs.userLoadError.value = null
        refs.iosUploadCode.value = data.userData?.iosUploadCode ?? null
      },
      onError: (error) => {
        if (!inline) return
        refs.user.value = null
        if (isNotFoundError(error)) {
          refs.userNotFound.value = true
        } else {
          refs.userLoadError.value = describeError(error, translate("adminUsers.detail.toast.actionFailedFallback"))
        }
      },
    })
  }

  async function loadActivities(options?: LoaderRunOptions) {
    await runLoad(refs.activityLoading, () => getUserActivity(userId()), {
      ...sectionLoadOptions(refs.activityError, translate("adminUsers.detail.toast.loadActivityFailedTitle"), options),
      onSuccess: (response) => {
        refs.activities.value = response.systemLogs ?? []
        refs.uploadLogs.value = response.uploadLogs ?? []
        refs.activityScope.value = response.from && response.to && response.summary
          ? {
              from: response.from,
              to: response.to,
              systemLogTotal: response.summary.systemLogTotal,
              uploadLogTotal: response.summary.uploadLogTotal,
            }
          : null
        refs.activityError.value = null
        markSectionLoaded("activity")
      },
    })
  }

  async function loadOAuth(options?: LoaderRunOptions) {
    await runLoad(refs.oauthLoading, () => getUserOAuthAuthorizations(userId()), {
      ...sectionLoadOptions(refs.oauthError, translate("adminUsers.detail.toast.loadOAuthFailedTitle"), options),
      onSuccess: (data) => {
        refs.oauthAuths.value = data
        refs.oauthError.value = null
        markSectionLoaded("oauth")
      },
    })
  }

  async function loadGameBindings(options?: LoaderRunOptions) {
    await runLoad(refs.gameBindingLoading, () => getGameAccountBindings(userId()), {
      ...sectionLoadOptions(refs.gameBindingError, translate("adminUsers.detail.toast.loadGameBindingsFailedTitle"), options),
      onSuccess: (data) => {
        refs.gameBindings.value = data
        refs.gameBindingError.value = null
        markSectionLoaded("game")
      },
    })
  }

  async function loadSocialPlatform(options?: LoaderRunOptions) {
    await runLoad(refs.socialLoading, () => getSocialPlatform(userId()), {
      ...sectionLoadOptions(refs.socialError, translate("adminUsers.detail.toast.loadSocialFailedTitle"), options),
      onSuccess: (data) => {
        refs.socialPlatform.value = data
        refs.socialError.value = null
        markSectionLoaded("social")
      },
    })
  }

  async function loadAuthorizedSocials(options?: LoaderRunOptions) {
    await runLoad(refs.authSocialLoading, () => getAuthorizedSocialPlatforms(userId()), {
      ...sectionLoadOptions(refs.authSocialError, translate("adminUsers.detail.toast.loadAuthSocialFailedTitle"), options),
      onSuccess: (data) => {
        refs.authorizedSocials.value = data
        refs.authSocialError.value = null
        markSectionLoaded("auth-social")
      },
    })
  }

  /** The page shows every section at once, so they all load with the user. */
  function loadSections() {
    void loadActivities()
    void loadOAuth()
    void loadGameBindings()
    void loadSocialPlatform()
    void loadAuthorizedSocials()
  }

  return {
    loadUser,
    loadActivities,
    loadOAuth,
    loadGameBindings,
    loadSocialPlatform,
    loadAuthorizedSocials,
    loadSections,
  }
}
