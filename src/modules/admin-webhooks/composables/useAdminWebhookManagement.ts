import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { focusInvalidField } from "@/lib/form-focus"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import {
  createAdminWebhookEndpoint,
  deleteAdminWebhookEndpoint,
  getAdminWebhookSettings,
  getAdminWebhookSubscribers,
  listAdminWebhookEndpoints,
  updateAdminWebhookEndpoint,
  updateAdminWebhookSettings,
} from "@/modules/admin-webhooks/api/webhook"
import type {
  AdminWebhookCreatePayload,
  AdminWebhookEndpoint,
  AdminWebhookMutationResponse,
  AdminWebhookSettings,
  AdminWebhookSubscriber,
  AdminWebhookUpdatePayload,
} from "@/types/admin"

type WebhookFormMode = "create" | "edit"

export type WebhookFormField = "id" | "callbackUrl" | "credential"
export type WebhookFormErrors = Partial<Record<WebhookFormField, string>>

export const WEBHOOK_FIELD_IDS: Record<WebhookFormField, string> = {
  id: "webhook-id",
  callbackUrl: "webhook-callback-url",
  credential: "webhook-credential",
}
export const WEBHOOK_JWT_SECRET_FIELD_ID = "admin-webhooks-jwt-secret"

const DEFAULT_TOKEN_HEADER_NAME = "X-Haruki-Suite-Webhook-Token"

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

type FormSnapshot = {
  credential: string
  callbackUrl: string
  bearer: string
  enabled: boolean
  clearBearer: boolean
}

export function useAdminWebhookManagement() {
  const userStore = useUserStore()
  const { t } = useI18n()

  const settingsLoading = ref(true)
  const settingsSaving = ref(false)
  const settings = ref<AdminWebhookSettings>({
    enabled: false,
    jwtSecretConfigured: false,
  })
  const settingsEnabled = ref(false)
  const jwtSecretInput = ref("")
  const jwtSecretError = ref("")
  const disableConfirmOpen = ref(false)

  const endpointsLoading = ref(true)
  const endpoints = ref<AdminWebhookEndpoint[]>([])
  const endpointsGeneratedAt = ref("")
  const endpointsTotal = ref(0)

  const formOpen = ref(false)
  const formMode = ref<WebhookFormMode>("create")
  const editingWebhookId = ref("")
  const formId = ref("")
  const formCredential = ref("")
  const formCallbackUrl = ref("")
  const formBearer = ref("")
  const formEnabled = ref(true)
  const formClearBearer = ref(false)
  const formSaving = ref(false)
  const formErrors = ref<WebhookFormErrors>({})
  // What the edit dialog opened with: an unchanged form has nothing to PUT.
  const formInitial = ref<FormSnapshot | null>(null)

  const deleteOpen = ref(false)
  const deleting = ref(false)
  const deleteTarget = ref<AdminWebhookEndpoint | null>(null)

  const tokenDialogOpen = ref(false)
  const latestToken = ref("")
  const latestTokenHeaderName = ref(DEFAULT_TOKEN_HEADER_NAME)
  const latestTokenWebhook = ref<AdminWebhookEndpoint | null>(null)

  const subscribersOpen = ref(false)
  const subscribersLoading = ref(false)
  const subscribers = ref<AdminWebhookSubscriber[]>([])
  const subscribersGeneratedAt = ref("")
  const subscribersWebhook = ref<AdminWebhookEndpoint | null>(null)

  const canMutate = computed(() => userStore.isSuperAdmin)

  /** Saving with nothing changed would only re-PUT the same values. */
  const settingsDirty = computed(() =>
    settingsEnabled.value !== settings.value.enabled || jwtSecretInput.value.trim() !== ""
  )

  function currentFormSnapshot(): FormSnapshot {
    return {
      credential: formCredential.value.trim(),
      callbackUrl: formCallbackUrl.value.trim(),
      bearer: formBearer.value.trim(),
      enabled: formEnabled.value,
      clearBearer: formClearBearer.value,
    }
  }

  const formDirty = computed(() => {
    if (formMode.value === "create") return true
    const initial = formInitial.value
    if (!initial) return true
    const current = currentFormSnapshot()
    return current.credential !== initial.credential
      || current.callbackUrl !== initial.callbackUrl
      || current.bearer !== initial.bearer
      || current.enabled !== initial.enabled
      || current.clearBearer !== initial.clearBearer
  })

  function resetForm() {
    editingWebhookId.value = ""
    formId.value = ""
    formCredential.value = ""
    formCallbackUrl.value = ""
    formBearer.value = ""
    formEnabled.value = true
    formClearBearer.value = false
    formErrors.value = {}
    formInitial.value = null
  }

  function clearFormError(field: WebhookFormField) {
    if (formErrors.value[field]) {
      formErrors.value = { ...formErrors.value, [field]: undefined }
    }
  }

  function applySettings(next: AdminWebhookSettings) {
    settings.value = next
    settingsEnabled.value = next.enabled
  }

  async function loadSettings() {
    settingsLoading.value = true
    try {
      applySettings(await getAdminWebhookSettings())
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminWebhooks.toast.loadSettingsFailedTitle"),
        error,
        t("adminWebhooks.toast.loadFailedFallback")
      )
    } finally {
      settingsLoading.value = false
    }
  }

  async function loadEndpoints() {
    endpointsLoading.value = true
    try {
      const response = await listAdminWebhookEndpoints()
      endpoints.value = response.items
      endpointsGeneratedAt.value = response.generatedAt
      endpointsTotal.value = response.total
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminWebhooks.toast.loadEndpointsFailedTitle"),
        error,
        t("adminWebhooks.toast.loadFailedFallback")
      )
    } finally {
      endpointsLoading.value = false
    }
  }

  async function refreshAll() {
    await Promise.all([loadSettings(), loadEndpoints()])
  }

  function openCreateDialog() {
    resetForm()
    formMode.value = "create"
    formOpen.value = true
  }

  function openEditDialog(webhook: AdminWebhookEndpoint) {
    resetForm()
    formMode.value = "edit"
    editingWebhookId.value = webhook.id
    formId.value = webhook.id
    formCredential.value = webhook.credential
    formCallbackUrl.value = webhook.callbackUrl
    formBearer.value = webhook.bearer
    formEnabled.value = webhook.enabled
    formInitial.value = currentFormSnapshot()
    formOpen.value = true
  }

  /** Inline field messages; the first invalid field is scrolled to and focused. */
  function validateWebhookForm(): boolean {
    const errors: WebhookFormErrors = {}
    const callbackUrl = formCallbackUrl.value.trim()
    if (!callbackUrl) {
      errors.callbackUrl = t("adminWebhooks.toast.validation.callbackRequired")
    } else if (!isHttpUrl(callbackUrl)) {
      errors.callbackUrl = t("adminWebhooks.toast.validation.callbackInvalid")
    }

    const id = formId.value.trim()
    if (formMode.value === "create" && id.includes("/")) {
      errors.id = t("adminWebhooks.toast.validation.idInvalid")
    }

    const credential = formCredential.value.trim()
    if (credential.includes("/")) {
      errors.credential = t("adminWebhooks.toast.validation.credentialInvalid")
    }

    formErrors.value = errors
    const firstInvalid = (["id", "callbackUrl", "credential"] as const).find((field) => errors[field])
    if (firstInvalid) {
      focusInvalidField(WEBHOOK_FIELD_IDS[firstInvalid])
      return false
    }
    return true
  }

  function validateSettingsForm(): boolean {
    const jwtSecret = jwtSecretInput.value.trim()
    if (jwtSecretInput.value !== "" && jwtSecret === "") {
      jwtSecretError.value = t("adminWebhooks.toast.validation.jwtSecretInvalid")
      focusInvalidField(WEBHOOK_JWT_SECRET_FIELD_ID)
      return false
    }
    jwtSecretError.value = ""
    return true
  }

  function updateJwtSecretInput(value: string) {
    jwtSecretInput.value = value
    jwtSecretError.value = ""
  }

  function showReturnedToken(result: AdminWebhookMutationResponse) {
    if (!result.token) {
      if (!settings.value.jwtSecretConfigured) {
        toast.info(t("adminWebhooks.toast.savedWithoutToken"))
      }
      return
    }

    latestToken.value = result.token
    latestTokenHeaderName.value = result.tokenHeaderName || DEFAULT_TOKEN_HEADER_NAME
    latestTokenWebhook.value = result.webhook
    tokenDialogOpen.value = true
  }

  async function saveWebhook() {
    if (!canMutate.value || formSaving.value) {
      return
    }
    if (!validateWebhookForm()) {
      return
    }
    if (!formDirty.value) {
      return
    }

    formSaving.value = true
    try {
      let result: AdminWebhookMutationResponse
      if (formMode.value === "create") {
        const payload: AdminWebhookCreatePayload = {
          id: formId.value.trim() || undefined,
          credential: formCredential.value.trim() || undefined,
          callbackUrl: formCallbackUrl.value.trim(),
          bearer: formBearer.value.trim() || undefined,
          enabled: formEnabled.value,
        }
        result = await createAdminWebhookEndpoint(payload)
        toast.success(t("adminWebhooks.toast.created"))
      } else {
        const payload: AdminWebhookUpdatePayload = {
          callbackUrl: formCallbackUrl.value.trim(),
          credential: formCredential.value.trim() || undefined,
          enabled: formEnabled.value,
          clearBearer: formClearBearer.value || undefined,
        }

        if (!formClearBearer.value && formBearer.value.trim()) {
          payload.bearer = formBearer.value.trim()
        }

        result = await updateAdminWebhookEndpoint(editingWebhookId.value, payload)
        toast.success(t("adminWebhooks.toast.saved"))
      }

      formOpen.value = false
      resetForm()
      await loadEndpoints()
      showReturnedToken(result)
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        formMode.value === "create"
          ? t("adminWebhooks.toast.createFailedTitle")
          : t("adminWebhooks.toast.saveFailedTitle"),
        error,
        t("adminWebhooks.toast.loadFailedFallback")
      )
    } finally {
      formSaving.value = false
    }
  }

  function confirmDelete(webhook: AdminWebhookEndpoint) {
    deleteTarget.value = webhook
    deleteOpen.value = true
  }

  /**
   * Runs from the delete ConfirmDialog, which closes itself on success and
   * shows a failure inline, so this lets the error propagate instead of toasting.
   */
  async function executeDelete() {
    if (!canMutate.value || deleting.value || !deleteTarget.value) {
      return
    }

    deleting.value = true
    try {
      await deleteAdminWebhookEndpoint(deleteTarget.value.id)
      toast.success(t("adminWebhooks.toast.deleted"))
      await loadEndpoints()
    } finally {
      deleting.value = false
    }
  }

  /** The PUT itself; rethrows so the disable ConfirmDialog can report inline. */
  async function executeSaveSettings() {
    if (!canMutate.value || settingsSaving.value) {
      return
    }

    settingsSaving.value = true
    try {
      const payload: { enabled?: boolean; jwtSecret?: string } = {
        enabled: settingsEnabled.value,
      }
      if (jwtSecretInput.value.trim()) {
        payload.jwtSecret = jwtSecretInput.value.trim()
      }

      await updateAdminWebhookSettings(payload)
      toast.success(t("adminWebhooks.toast.settingsSaved"))
      jwtSecretInput.value = ""
      await loadSettings()
    } finally {
      settingsSaving.value = false
    }
  }

  /** Switching global delivery off is confirmed first; everything else saves directly. */
  async function saveSettings() {
    if (!canMutate.value || settingsSaving.value || !settingsDirty.value) {
      return
    }
    if (!validateSettingsForm()) {
      return
    }
    if (settings.value.enabled && !settingsEnabled.value) {
      disableConfirmOpen.value = true
      return
    }
    try {
      await executeSaveSettings()
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminWebhooks.toast.saveSettingsFailedTitle"),
        error,
        t("adminWebhooks.toast.loadFailedFallback")
      )
    }
  }

  async function openSubscribers(webhook: AdminWebhookEndpoint) {
    subscribersWebhook.value = webhook
    subscribersOpen.value = true
    subscribersLoading.value = true
    subscribers.value = []
    subscribersGeneratedAt.value = ""

    try {
      const response = await getAdminWebhookSubscribers(webhook.id)
      subscribers.value = response.items
      subscribersGeneratedAt.value = response.generatedAt
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminWebhooks.toast.loadSubscribersFailedTitle"),
        error,
        t("adminWebhooks.toast.loadFailedFallback")
      )
    } finally {
      subscribersLoading.value = false
    }
  }

  async function copyLatestToken() {
    if (!latestToken.value) {
      toast.error(t("adminWebhooks.toast.copyFailedTitle"), {
        description: t("adminWebhooks.toast.copyFailedEmpty"),
      })
      return
    }

    if (!isClipboardSupported()) {
      toast.error(t("adminWebhooks.toast.copyFailedTitle"), {
        description: t("adminWebhooks.toast.copyFailedClipboardUnsupported"),
      })
      return
    }

    const copied = await copyTextToClipboard(latestToken.value)
    if (!copied) {
      toast.error(t("adminWebhooks.toast.copyFailedTitle"), {
        description: t("adminWebhooks.toast.copyFailedClipboardUnsupported"),
      })
      return
    }

    toast.success(t("adminWebhooks.toast.copied"))
  }

  function formatDate(value?: string) {
    return formatLocalizedDateTime(value, undefined, t("adminWebhooks.common.fallback"))
  }

  function serverLabel(value: string) {
    const normalized = value.trim().toLowerCase()
    const key = ["jp", "en", "tw", "kr", "cn"].includes(normalized)
      ? `userSettings.gameBinding.region.${normalized}`
      : ""
    return key ? t(key) : value || t("adminWebhooks.common.fallback")
  }

  function dataTypeLabel(value: string) {
    const normalized = value.trim().toLowerCase()
    if (normalized === "suite" || normalized === "mysekai") {
      return t(`adminStatistics.uploadLogs.dataType.${normalized}`)
    }
    return value || t("adminWebhooks.common.fallback")
  }

  onMounted(() => {
    void refreshAll()
  })

  return {
    userStore,
    canMutate,
    settingsLoading,
    settingsSaving,
    settings,
    settingsEnabled,
    settingsDirty,
    jwtSecretInput,
    jwtSecretError,
    disableConfirmOpen,
    endpointsLoading,
    endpoints,
    endpointsGeneratedAt,
    endpointsTotal,
    formOpen,
    formMode,
    formId,
    formCredential,
    formCallbackUrl,
    formBearer,
    formEnabled,
    formClearBearer,
    formSaving,
    formErrors,
    formDirty,
    deleteOpen,
    deleting,
    deleteTarget,
    tokenDialogOpen,
    latestToken,
    latestTokenHeaderName,
    latestTokenWebhook,
    subscribersOpen,
    subscribersLoading,
    subscribers,
    subscribersGeneratedAt,
    subscribersWebhook,
    refreshAll,
    openCreateDialog,
    openEditDialog,
    clearFormError,
    saveWebhook,
    confirmDelete,
    executeDelete,
    saveSettings,
    executeSaveSettings,
    updateJwtSecretInput,
    openSubscribers,
    copyLatestToken,
    formatDate,
    serverLabel,
    dataTypeLabel,
  }
}
