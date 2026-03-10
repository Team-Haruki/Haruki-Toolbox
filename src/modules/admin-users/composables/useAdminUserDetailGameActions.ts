import {
  deleteGameAccountBinding,
  updateAllowCNMysekai,
  updateGameAccountBinding,
} from "@/modules/admin-users/api/game-binding"
import { deleteIOSUploadCode, regenerateIOSUploadCode } from "@/modules/admin-users/api/ios-upload-code"
import type { AdminGameAccountBinding } from "@/types/admin"
import { normalizeMysekaiPermissions, normalizeSuitePermissions } from "@/lib/game-binding-permissions"
import type { CreateActionsParams } from "@/modules/admin-users/composables/useAdminUserDetailActionTypes"
import { translate } from "@/shared/i18n"

export function createAdminUserDetailGameActions({
  userId,
  state,
  runTask,
  runAction,
  loaders,
}: CreateActionsParams) {
  const { refs, resetGameBindingEditor } = state
  const strictRefreshOptions = { throwOnError: true, notifyOnError: false } as const

  async function handleDeleteGameBinding(server: AdminGameAccountBinding["server"], gameUserId: string) {
    await runTask(
      translate("adminUsers.detail.toast.deleteGameBindingFailedTitle"),
      () => deleteGameAccountBinding(userId(), server, gameUserId),
      {
      successMessage: translate("adminUsers.detail.toast.deleteGameBindingSuccess"),
      afterSuccess: () => loaders.loadGameBindings(strictRefreshOptions),
      }
    )
  }

  async function handleToggleCNMysekai(value: boolean | "indeterminate") {
    if (!refs.user.value || value === "indeterminate") return
    await runTask(translate("adminUsers.detail.toast.toggleCNFailedTitle"), () => updateAllowCNMysekai(userId(), value), {
      successMessage: value
        ? translate("adminUsers.detail.toast.cnEnabled")
        : translate("adminUsers.detail.toast.cnDisabled"),
      afterSuccess: () => {
        if (refs.user.value) {
          refs.user.value.userData.allowCNMysekai = value
        }
      },
    })
  }

  function openAddGameBinding() {
    resetGameBindingEditor()
    refs.gameBindingDialogOpen.value = true
  }

  function openEditGameBinding(
    binding: Pick<AdminGameAccountBinding, "server" | "gameUserId" | "suite" | "mysekai">
  ) {
    refs.editGameServer.value = binding.server
    refs.editGameUserId.value = binding.gameUserId
    refs.editGameSuite.value = normalizeSuitePermissions(binding.suite)
    refs.editGameMysekai.value = normalizeMysekaiPermissions(binding.mysekai)
    refs.gameBindingDialogOpen.value = true
  }

  async function handleSaveGameBinding() {
    const gameUserId = refs.editGameUserId.value.trim()
    if (!gameUserId) return

    await runAction(
      translate("adminUsers.detail.toast.saveGameBindingFailedTitle"),
      () =>
        updateGameAccountBinding(userId(), refs.editGameServer.value, gameUserId, {
          suite: refs.editGameSuite.value,
          mysekai: refs.editGameMysekai.value,
        }),
      {
        successMessage: translate("adminUsers.detail.toast.saveGameBindingSuccess"),
        afterSuccess: async () => {
          refs.gameBindingDialogOpen.value = false
          await loaders.loadGameBindings(strictRefreshOptions)
        },
      }
    )
  }

  async function handleRegenerateIOS() {
    await runTask(
      translate("adminUsers.detail.toast.regenerateIOSFailedTitle"),
      async () => {
        const response = await regenerateIOSUploadCode(userId())
        const uploadCode = response?.uploadCode?.trim()
        if (!uploadCode) {
          throw new Error(translate("adminUsers.detail.toast.missingIOSCode"))
        }
        return uploadCode
      },
      {
        successMessage: translate("adminUsers.detail.toast.regenerateIOSSuccess"),
        afterSuccess: (uploadCode) => {
          refs.iosUploadCode.value = uploadCode
        },
      }
    )
  }

  async function handleDeleteIOS() {
    await runTask(translate("adminUsers.detail.toast.deleteIOSFailedTitle"), () => deleteIOSUploadCode(userId()), {
      successMessage: translate("adminUsers.detail.toast.deleteIOSSuccess"),
      afterSuccess: () => {
        refs.iosUploadCode.value = null
      },
    })
  }

  return {
    openAddGameBinding,
    openEditGameBinding,
    handleDeleteGameBinding,
    handleToggleCNMysekai,
    handleSaveGameBinding,
    handleRegenerateIOS,
    handleDeleteIOS,
  }
}
