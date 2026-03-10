import {
  banUser,
  deleteUser,
  forceLogout,
  resetPassword,
  restoreUser,
  unbanUser,
  updateUserEmail,
  updateUserRole,
} from "@/modules/admin-users/api/user"
import { revokeUserOAuth } from "@/modules/admin-users/api/oauth"
import type { UserRole } from "@/types/common"
import type { CreateActionsParams } from "@/modules/admin-users/composables/useAdminUserDetailActionTypes"
import { roleLabel } from "@/modules/admin-users/constants"
import { translate } from "@/shared/i18n"

export function createAdminUserDetailPrimaryActions({
  userId,
  state,
  runTask,
  runAction,
  loaders,
}: CreateActionsParams) {
  const { refs } = state

  async function handleBan() {
    await runAction(translate("adminUsers.detail.toast.banFailedTitle"), () => banUser(userId), {
      successMessage: translate("adminUsers.detail.toast.banSuccess"),
      afterSuccess: loaders.loadUser,
    })
  }

  async function handleUnban() {
    await runAction(translate("adminUsers.detail.toast.unbanFailedTitle"), () => unbanUser(userId), {
      successMessage: translate("adminUsers.detail.toast.unbanSuccess"),
      afterSuccess: loaders.loadUser,
    })
  }

  async function handleForceLogout() {
    await runAction(translate("adminUsers.detail.toast.forceLogoutFailedTitle"), () => forceLogout(userId), {
      successMessage: translate("adminUsers.detail.toast.forceLogoutSuccess"),
    })
  }

  async function handleDelete() {
    await runAction(translate("adminUsers.detail.toast.deleteFailedTitle"), () => deleteUser(userId), {
      successMessage: translate("adminUsers.detail.toast.deleteSuccess"),
      afterSuccess: loaders.loadUser,
    })
  }

  async function handleRestore() {
    await runAction(translate("adminUsers.detail.toast.restoreFailedTitle"), () => restoreUser(userId), {
      successMessage: translate("adminUsers.detail.toast.restoreSuccess"),
      afterSuccess: loaders.loadUser,
    })
  }

  async function handleResetPassword() {
    await runAction(translate("adminUsers.detail.toast.resetPasswordFailedTitle"), () => resetPassword(userId), {
      successMessage: translate("adminUsers.detail.toast.resetPasswordSuccess"),
    })
  }

  async function handleRoleChange(role: UserRole) {
    await runAction(translate("adminUsers.detail.toast.updateRoleFailedTitle"), () => updateUserRole(userId, role), {
      successMessage: translate("adminUsers.detail.toast.updateRoleSuccess", {
        role: roleLabel(role, translate),
      }),
      afterSuccess: loaders.loadUser,
    })
  }

  function openEmailEdit() {
    if (!refs.user.value) return
    refs.editEmail.value = refs.user.value.userData.emailInfo?.email ?? ""
    refs.emailDialogOpen.value = true
  }

  async function handleEmailUpdate() {
    const email = refs.editEmail.value.trim()
    if (!email) return
    await runAction(translate("adminUsers.detail.toast.updateEmailFailedTitle"), () => updateUserEmail(userId, email), {
      successMessage: translate("adminUsers.detail.toast.updateEmailSuccess"),
      afterSuccess: async () => {
        refs.emailDialogOpen.value = false
        await loaders.loadUser()
      },
    })
  }

  async function handleRevokeOAuth() {
    await runTask(translate("adminUsers.detail.toast.revokeOAuthFailedTitle"), () => revokeUserOAuth(userId), {
      successMessage: translate("adminUsers.detail.toast.revokeOAuthSuccess"),
      afterSuccess: loaders.loadOAuth,
    })
  }

  return {
    handleBan,
    handleUnban,
    handleForceLogout,
    handleDelete,
    handleRestore,
    handleResetPassword,
    handleRoleChange,
    openEmailEdit,
    handleEmailUpdate,
    handleRevokeOAuth,
  }
}
