import { ref } from "vue"
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
  const rotateConfirmOpen = ref(false)
  const clientToRotate = ref<string | null>(null)
  const revokeConfirmOpen = ref(false)
  const clientToRevoke = ref<string | null>(null)

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

  function confirmRotateSecret(clientId: string) {
    clientToRotate.value = clientId
    rotateConfirmOpen.value = true
  }

  async function handleRotateSecret() {
    const targetClientId = clientToRotate.value
    if (!targetClientId) return

    await runAsyncAction(actionLoading, () => rotateClientSecret(targetClientId), {
      errorTitle: t("adminOAuthClients.toast.rotateFailedTitle"),
      onSuccess: (rotatedSecret) => {
        options.onSecretGenerated(rotatedSecret)
        rotateConfirmOpen.value = false
        clientToRotate.value = null
      },
    })
  }

  async function handleRestore(clientId: string) {
    await runAsyncAction(actionLoading, () => restoreOAuthClient(clientId), {
      successMessage: t("adminOAuthClients.toast.restored"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.restoreFailedTitle"),
      onSuccess: options.loadClients,
    })
  }

  function confirmRevoke(clientId: string) {
    clientToRevoke.value = clientId
    revokeConfirmOpen.value = true
  }

  async function handleRevoke() {
    const targetClientId = clientToRevoke.value
    if (!targetClientId) return

    await runAsyncAction(actionLoading, () => revokeOAuthClient(targetClientId), {
      successMessage: t("adminOAuthClients.toast.revokedAll"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.revokeFailedTitle"),
      onSuccess: () => {
        revokeConfirmOpen.value = false
        clientToRevoke.value = null
      },
    })
  }

  return {
    actionLoading,
    deleteConfirmOpen,
    clientToDelete,
    rotateConfirmOpen,
    clientToRotate,
    revokeConfirmOpen,
    clientToRevoke,
    confirmDelete,
    executeDelete,
    toggleActive,
    confirmRotateSecret,
    handleRotateSecret,
    handleRestore,
    confirmRevoke,
    handleRevoke,
  }
}
