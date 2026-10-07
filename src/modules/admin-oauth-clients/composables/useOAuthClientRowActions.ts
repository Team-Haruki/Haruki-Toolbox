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
import {
  PUBLIC_CLIENT_HAS_NO_SECRET,
  type RevocationOutcome,
  describeIncompleteRevocation,
  describeOAuthClientActionError,
  readApiErrorCode,
} from "@/modules/admin-oauth-clients/lib/client-actions"

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

  /**
   * Shows a warning, in place of the success toast, when grants were left behind.
   * It stays until the admin closes it: the leftover grants need a retry, and
   * nothing else on the page shows that they exist.
   */
  function warnIfRevocationIncomplete(outcome: RevocationOutcome, title: string) {
    const description = describeIncompleteRevocation(outcome, t)
    if (description) {
      toast.warning(title, {
        description,
        duration: Number.POSITIVE_INFINITY,
        cancel: { label: t("common.close"), onClick: () => undefined },
      })
    }
  }

  async function toggleActive(client: OAuthClient) {
    const successMessage = client.active
      ? t("adminOAuthClients.toast.disabled")
      : t("adminOAuthClients.toast.enabled")
    await runAsyncAction(actionLoading, () => setOAuthClientActive(client.clientId, !client.active), {
      successMessage: (outcome) => (outcome.complete ? successMessage : null),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.actionFailedTitle"),
      onSuccess: async (outcome) => {
        // The client is disabled either way; the warning must not depend on the refresh.
        warnIfRevocationIncomplete(outcome, t("adminOAuthClients.toast.disabledRevocationIncompleteTitle"))
        await options.loadClients()
      },
    })
  }

  function confirmRotateSecret(clientId: string) {
    clientToRotate.value = clientId
    rotateConfirmOpen.value = true
  }

  async function handleRotateSecret() {
    const targetClientId = clientToRotate.value
    if (!targetClientId) return

    const errorTitle = t("adminOAuthClients.toast.rotateFailedTitle")
    await runAsyncAction(actionLoading, () => rotateClientSecret(targetClientId), {
      errorTitle,
      onError: async (error) => {
        toast.error(errorTitle, { description: describeOAuthClientActionError(error, t, errorTitle) })
        if (readApiErrorCode(error) === PUBLIC_CLIENT_HAS_NO_SECRET) {
          // The list still showed this client as confidential: refresh it so the
          // rotate action disappears for the public client.
          rotateConfirmOpen.value = false
          clientToRotate.value = null
          await options.loadClients().catch(() => undefined)
        }
      },
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
      successMessage: (outcome) => (outcome.complete ? t("adminOAuthClients.toast.revokedAll") : null),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.revokeFailedTitle"),
      onSuccess: (outcome) => {
        revokeConfirmOpen.value = false
        clientToRevoke.value = null
        warnIfRevocationIncomplete(outcome, t("adminOAuthClients.toast.revokedPartiallyTitle"))
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
