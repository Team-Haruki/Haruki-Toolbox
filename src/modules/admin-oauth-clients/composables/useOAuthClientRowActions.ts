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

/**
 * Row actions of the client list. Delete, disable, rotate and revoke are
 * confirmed in a `ConfirmDialog` that runs the `execute*` / `handle*` function
 * itself: those rethrow (`throwOnError`) so the dialog shows the failure
 * inline and stays open, and the dialog closes itself on success through its
 * `open` model. Enable and restore run directly and toast.
 */
export function useOAuthClientRowActions(options: UseOAuthClientRowActionsOptions) {
  const { t } = useI18n()
  const actionLoading = ref(false)
  const deleteConfirmOpen = ref(false)
  const clientToDelete = ref<string | null>(null)
  const disableConfirmOpen = ref(false)
  const clientToDisable = ref<string | null>(null)
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
      throwOnError: true,
      onSuccess: options.loadClients,
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

  /** Enabling is harmless and runs at once; disabling revokes grants, so it is confirmed first. */
  async function toggleActive(client: OAuthClient) {
    if (client.active) {
      clientToDisable.value = client.clientId
      disableConfirmOpen.value = true
      return
    }
    await runAsyncAction(actionLoading, () => setOAuthClientActive(client.clientId, true), {
      successMessage: t("adminOAuthClients.toast.enabled"),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.actionFailedTitle"),
      onSuccess: options.loadClients,
    })
  }

  async function executeDisable() {
    const targetClientId = clientToDisable.value
    if (!targetClientId) return

    await runAsyncAction(actionLoading, () => setOAuthClientActive(targetClientId, false), {
      successMessage: (outcome) => (outcome.complete ? t("adminOAuthClients.toast.disabled") : null),
      successAfterOnSuccess: true,
      errorTitle: t("adminOAuthClients.toast.actionFailedTitle"),
      throwOnError: true,
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

  /** The confirm dialog's inline error text for a failed rotate / revoke / delete. */
  function describeActionError(error: unknown): string {
    return describeOAuthClientActionError(error, t, t("adminOAuthClients.toast.actionFailedTitle"))
  }

  async function handleRotateSecret() {
    const targetClientId = clientToRotate.value
    if (!targetClientId) return

    await runAsyncAction(actionLoading, () => rotateClientSecret(targetClientId), {
      errorTitle: t("adminOAuthClients.toast.rotateFailedTitle"),
      throwOnError: true,
      onError: async (error) => {
        if (readApiErrorCode(error) === PUBLIC_CLIENT_HAS_NO_SECRET) {
          // The list still showed this client as confidential: close the
          // dialog and refresh so the rotate action disappears for the public
          // client; the toast carries the explanation instead.
          rotateConfirmOpen.value = false
          toast.error(t("adminOAuthClients.toast.rotateFailedTitle"), { description: describeActionError(error) })
          await options.loadClients().catch(() => undefined)
        }
      },
      onSuccess: options.onSecretGenerated,
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
      throwOnError: true,
      onSuccess: (outcome) => {
        warnIfRevocationIncomplete(outcome, t("adminOAuthClients.toast.revokedPartiallyTitle"))
      },
    })
  }

  return {
    actionLoading,
    deleteConfirmOpen,
    clientToDelete,
    disableConfirmOpen,
    clientToDisable,
    rotateConfirmOpen,
    clientToRotate,
    revokeConfirmOpen,
    clientToRevoke,
    confirmDelete,
    executeDelete,
    toggleActive,
    executeDisable,
    confirmRotateSecret,
    handleRotateSecret,
    describeActionError,
    handleRestore,
    confirmRevoke,
    handleRevoke,
  }
}
