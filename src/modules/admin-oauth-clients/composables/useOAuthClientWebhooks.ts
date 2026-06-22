import { ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  buildOAuthClientWebhookCreatePayload,
  buildOAuthClientWebhookUpdatePayload,
} from "@/modules/admin-oauth-clients/lib/webhook"
import {
  createOAuthClientWebhook,
  deleteOAuthClientWebhook,
  getOAuthClientWebhooks,
  updateOAuthClientWebhook,
} from "@/modules/admin-oauth-clients/api/client"
import type { OAuthClientWebhook } from "@/types/admin"

export function useOAuthClientWebhooks() {
  const { t } = useI18n()

  const webhookOpen = ref(false)
  const webhookClientId = ref("")
  const webhooks = ref<OAuthClientWebhook[]>([])
  const webhookLoading = ref(false)
  const webhookSaving = ref(false)
  const webhookDeleting = ref(false)
  const editingWebhook = ref<OAuthClientWebhook | null>(null)
  const webhookFormOpen = ref(false)
  const callbackUrl = ref("")
  const bearer = ref("")
  const enabled = ref(true)
  const clearBearer = ref(false)
  const webhookDeleteConfirmOpen = ref(false)
  const webhookToDelete = ref<OAuthClientWebhook | null>(null)

  const hasActiveClient = () => webhookClientId.value.trim() !== ""

  async function loadWebhooks() {
    if (!hasActiveClient()) return
    const response = await runAsyncAction(
      webhookLoading,
      () => getOAuthClientWebhooks(webhookClientId.value),
      {
        errorTitle: t("adminOAuthClients.toast.loadWebhooksFailedTitle"),
        fallbackError: t("adminOAuthClients.toast.loadWebhooksFailedTitle"),
      }
    )
    if (response) {
      webhooks.value = response.items
    }
  }

  function openWebhookManager(clientId: string) {
    webhookClientId.value = clientId
    webhookOpen.value = true
    void loadWebhooks()
  }

  function resetForm() {
    editingWebhook.value = null
    callbackUrl.value = ""
    bearer.value = ""
    enabled.value = true
    clearBearer.value = false
  }

  function openCreateWebhook() {
    resetForm()
    webhookFormOpen.value = true
  }

  function openEditWebhook(webhook: OAuthClientWebhook) {
    editingWebhook.value = webhook
    callbackUrl.value = webhook.callbackUrl
    bearer.value = ""
    enabled.value = webhook.enabled
    clearBearer.value = false
    webhookFormOpen.value = true
  }

  watch(webhookFormOpen, (open) => {
    if (!open) {
      resetForm()
    }
  })

  function validateWebhookForm() {
    if (!callbackUrl.value.trim()) {
      toast.error(t("adminOAuthClients.toast.saveWebhookFailedTitle"), {
        description: t("adminOAuthClients.webhooks.validation.callbackUrlRequired"),
      })
      return false
    }
    return true
  }

  async function saveWebhook() {
    if (!hasActiveClient() || !validateWebhookForm()) return

    const current = editingWebhook.value
    const response = await runAsyncAction(
      webhookSaving,
      async () => {
        if (current) {
          return await updateOAuthClientWebhook(
            webhookClientId.value,
            current.id,
            buildOAuthClientWebhookUpdatePayload({
              callbackUrl: callbackUrl.value,
              bearer: bearer.value,
              enabled: enabled.value,
              clearBearer: clearBearer.value,
            })
          )
        }
        return await createOAuthClientWebhook(
          webhookClientId.value,
          buildOAuthClientWebhookCreatePayload({
            callbackUrl: callbackUrl.value,
            bearer: bearer.value,
            enabled: enabled.value,
          })
        )
      },
      {
        errorTitle: t("adminOAuthClients.toast.saveWebhookFailedTitle"),
        fallbackError: t("adminOAuthClients.toast.saveWebhookFailedTitle"),
        onError(error) {
          toast.error(t("adminOAuthClients.toast.saveWebhookFailedTitle"), {
            description: extractErrorMessage(error, t("adminOAuthClients.toast.saveWebhookFailedTitle")),
          })
        },
      }
    )
    if (!response) return

    await loadWebhooks()
    webhookFormOpen.value = false
    resetForm()
    toast.success(t("adminOAuthClients.toast.webhookSaved"))
  }

  function confirmDeleteWebhook(webhook: OAuthClientWebhook) {
    webhookToDelete.value = webhook
    webhookDeleteConfirmOpen.value = true
  }

  async function deleteWebhook() {
    const webhook = webhookToDelete.value
    if (!webhook || !hasActiveClient() || webhookDeleting.value) return
    const response = await runAsyncAction(
      webhookDeleting,
      () => deleteOAuthClientWebhook(webhookClientId.value, webhook.id),
      {
        errorTitle: t("adminOAuthClients.toast.deleteWebhookFailedTitle"),
        fallbackError: t("adminOAuthClients.toast.deleteWebhookFailedTitle"),
      }
    )
    if (!response) return

    webhooks.value = webhooks.value.filter((item) => item.id !== webhook.id)
    webhookDeleteConfirmOpen.value = false
    webhookToDelete.value = null
    toast.success(t("adminOAuthClients.toast.webhookDeleted"))
  }

  return {
    webhookOpen,
    webhookClientId,
    webhooks,
    webhookLoading,
    webhookSaving,
    webhookDeleting,
    editingWebhook,
    webhookFormOpen,
    callbackUrl,
    bearer,
    enabled,
    clearBearer,
    webhookDeleteConfirmOpen,
    webhookToDelete,
    loadWebhooks,
    openWebhookManager,
    openCreateWebhook,
    openEditWebhook,
    saveWebhook,
    confirmDeleteWebhook,
    deleteWebhook,
  }
}
