import {
  deleteAuthorizedSocialPlatform,
  updateAuthorizedSocialPlatform,
} from "@/modules/admin-users/api/authorized-social"
import { deleteSocialPlatform, updateSocialPlatform } from "@/modules/admin-users/api/social"
import type { CreateActionsParams, EditableAuthSocial } from "@/modules/admin-users/composables/useAdminUserDetailActionTypes"
import type { EntityId } from "@/types/common"
import { isSocialPlatform } from "@/modules/admin-users/constants"
import { DEFAULT_SOCIAL_PLATFORM } from "@/modules/admin-users/composables/useAdminUserDetailState"
import { translate } from "@/shared/i18n"

export function createAdminUserDetailSocialActions({
  userId,
  state,
  runTask,
  runAction,
  loaders,
}: CreateActionsParams) {
  const { refs } = state

  async function handleDeleteSocial() {
    await runTask(translate("adminUsers.detail.toast.deleteSocialFailedTitle"), () => deleteSocialPlatform(userId), {
      successMessage: translate("adminUsers.detail.toast.deleteSocialSuccess"),
      afterSuccess: () => {
        refs.socialPlatform.value = null
      },
    })
  }

  function openEditSocial() {
    const platform = refs.socialPlatform.value?.platform
    refs.editSocialPlatform.value = isSocialPlatform(platform) ? platform : DEFAULT_SOCIAL_PLATFORM
    refs.editSocialUserId.value = refs.socialPlatform.value?.userId ?? ""
    refs.editSocialVerified.value = refs.socialPlatform.value?.verified ?? false
    refs.socialDialogOpen.value = true
  }

  async function handleSaveSocial() {
    const platform = refs.editSocialPlatform.value
    const socialUserId = refs.editSocialUserId.value.trim()
    if (!socialUserId) return

    await runAction(
      translate("adminUsers.detail.toast.saveSocialFailedTitle"),
      () =>
        updateSocialPlatform(userId, {
          platform,
          userId: socialUserId,
          verified: refs.editSocialVerified.value,
        }),
      {
        successMessage: translate("adminUsers.detail.toast.saveSocialSuccess"),
        afterSuccess: async () => {
          refs.socialDialogOpen.value = false
          refs.socialPlatform.value = {
            platform,
            userId: socialUserId,
            verified: refs.editSocialVerified.value,
          }
          await loaders.loadSocialPlatform()
        },
      }
    )
  }

  async function handleDeleteAuthSocial(platformId: EntityId) {
    await runTask(translate("adminUsers.detail.toast.deleteAuthSocialFailedTitle"), () =>
      deleteAuthorizedSocialPlatform(userId, platformId), {
      successMessage: translate("adminUsers.detail.toast.deleteAuthSocialSuccess"),
      afterSuccess: loaders.loadAuthorizedSocials,
    })
  }

  function openAddAuthSocial() {
    const existingIds = new Set(refs.authorizedSocials.value.map((item) => String(item.id)))
    const baseId = `new-${Date.now()}`
    let nextId = baseId
    let suffix = 1
    while (existingIds.has(nextId)) {
      nextId = `${baseId}-${suffix}`
      suffix += 1
    }

    refs.authSocialCreateMode.value = true
    refs.editAuthSocialId.value = nextId
    refs.editAuthSocialPlatform.value = DEFAULT_SOCIAL_PLATFORM
    refs.editAuthSocialUserId.value = ""
    refs.editAuthSocialComment.value = ""
    refs.authSocialDialogOpen.value = true
  }

  function openEditAuthSocial(item: EditableAuthSocial) {
    refs.authSocialCreateMode.value = false
    refs.editAuthSocialId.value = String(item.id)
    refs.editAuthSocialPlatform.value = isSocialPlatform(item.platform) ? item.platform : DEFAULT_SOCIAL_PLATFORM
    refs.editAuthSocialUserId.value = item.userId || ""
    refs.editAuthSocialComment.value = item.comment || ""
    refs.authSocialDialogOpen.value = true
  }

  async function handleSaveAuthSocial() {
    const userIdValue = refs.editAuthSocialUserId.value.trim()
    if (!userIdValue) return

    await runAction(
      translate("adminUsers.detail.toast.saveAuthSocialFailedTitle"),
      () =>
        updateAuthorizedSocialPlatform(userId, refs.editAuthSocialId.value, {
          platform: refs.editAuthSocialPlatform.value,
          userId: userIdValue,
          comment: refs.editAuthSocialComment.value.trim(),
        }),
      {
        successMessage: translate("adminUsers.detail.toast.saveAuthSocialSuccess"),
        afterSuccess: async () => {
          refs.authSocialDialogOpen.value = false
          await loaders.loadAuthorizedSocials()
        },
      }
    )
  }

  return {
    openEditSocial,
    openAddAuthSocial,
    openEditAuthSocial,
    handleDeleteSocial,
    handleSaveSocial,
    handleDeleteAuthSocial,
    handleSaveAuthSocial,
  }
}
