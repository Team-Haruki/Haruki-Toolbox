import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import type { OAuthClient } from "@/types/admin"
import {
  deleteOAuthClient,
  restoreOAuthClient,
  revokeOAuthClient,
  rotateClientSecret,
  setOAuthClientActive,
} from "@/modules/admin-oauth-clients/api/client"

type UseOAuthClientRowActionsOptions = {
  loadClients: () => Promise<void>
  onSecretGenerated: (secret: string) => void
}

export function useOAuthClientRowActions(options: UseOAuthClientRowActionsOptions) {
  const { t } = useI18n()
  const actionLoading = ref(false)
  const deleteConfirmOpen = ref(false)
  const clientToDelete = ref<string | null>(null)

  function confirmDelete(clientId: string) {
    clientToDelete.value = clientId
    deleteConfirmOpen.value = true
  }

  async function executeDelete() {
    const targetClientId = clientToDelete.value
    if (!targetClientId) return

    await runAsyncAction(actionLoading, () => deleteOAuthClient(targetClientId), {
      successMessage: t("adminOAuthClients.toast.deleted"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.deleteFailedTitle"),
      onSuccess: async () => {
        await options.loadClients()
        deleteConfirmOpen.value = false
        clientToDelete.value = null
      },
    })
  }

  async function toggleActive(client: OAuthClient) {
    await runAsyncAction(actionLoading, () => setOAuthClientActive(client.clientId, !client.active), {
      successMessage: client.active
        ? t("adminOAuthClients.toast.disabled")
        : t("adminOAuthClients.toast.enabled"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.actionFailedTitle"),
      onSuccess: options.loadClients,
    })
  }

  async function handleRotateSecret(clientId: string) {
    await runAsyncAction(
      actionLoading,
      async () => {
        const response = await rotateClientSecret(clientId)
        return response?.clientSecret ?? ""
      },
      {
        errorTitle: t("adminOAuthClients.toast.rotateFailedTitle"),
        onSuccess: (rotatedSecret) => {
          if (rotatedSecret) {
            options.onSecretGenerated(rotatedSecret)
            return
          }
          toast.success(t("adminOAuthClients.toast.secretRotated"))
        },
      }
    )
  }

  async function handleRestore(clientId: string) {
    await runAsyncAction(actionLoading, () => restoreOAuthClient(clientId), {
      successMessage: t("adminOAuthClients.toast.restored"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.restoreFailedTitle"),
      onSuccess: options.loadClients,
    })
  }

  async function handleRevoke(clientId: string) {
    await runAsyncAction(actionLoading, () => revokeOAuthClient(clientId), {
      successMessage: t("adminOAuthClients.toast.revokedAll"),
      errorTitle: t("adminOAuthClients.toast.revokeFailedTitle"),
    })
  }

  return {
    actionLoading,
    deleteConfirmOpen,
    clientToDelete,
    confirmDelete,
    executeDelete,
    toggleActive,
    handleRotateSecret,
    handleRestore,
    handleRevoke,
  }
}
