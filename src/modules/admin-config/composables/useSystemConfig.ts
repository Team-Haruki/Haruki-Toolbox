import { computed, onMounted, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getPublicApiKeys, updatePublicApiKeys } from "@/modules/admin-config/api/public-api-keys"
import { getRuntimeConfig, updateRuntimeConfig } from "@/modules/admin-config/api/runtime"
import {
  RUNTIME_SWITCH_KEYS,
  buildRuntimeSwitchPayload,
  readRuntimeSwitch,
} from "@/modules/admin-config/lib/runtime-switch"
import { isJsonRecord, isStringRecord } from "@/lib/json-utils"
import type { PublicApiKeys, RuntimeConfig } from "@/types/admin"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

class SchemaValidationError extends Error {}

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  wordWrap: "on",
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  scrollBeyondLastLine: false,
} as const

export function useSystemConfig() {
  const { t } = useI18n()
  const apiKeysLoading = ref(true)
  // Load failures render inline (LoadErrorState) instead of toasting.
  const apiKeysLoadError = ref<ErrorDescription | null>(null)
  const apiKeys = ref<PublicApiKeys>({})
  const apiKeysJson = ref("")
  const apiKeysSaving = ref(false)
  // Invalid JSON / schema, shown under the editor; cleared on the next edit.
  const apiKeysValidationError = ref<string | null>(null)

  const runtimeLoading = ref(true)
  const runtimeLoadError = ref<ErrorDescription | null>(null)
  const runtimeConfig = ref<RuntimeConfig>({})
  const runtimeJson = ref("")
  const runtimeSaving = ref(false)
  const runtimeValidationError = ref<string | null>(null)
  const runtimeSaveDialogOpen = ref(false)
  // The parsed config the confirm dialog applies; set when the dialog opens.
  let pendingRuntimeConfig: RuntimeConfig | null = null

  const apiKeysDirty = computed(() => apiKeysJson.value !== JSON.stringify(apiKeys.value, null, 2))
  const runtimeDirty = computed(() => runtimeJson.value !== JSON.stringify(runtimeConfig.value, null, 2))

  const deviceFlowEnabled = computed(() => readRuntimeSwitch(runtimeConfig.value, RUNTIME_SWITCH_KEYS.oauth2DeviceFlow))
  const deviceFlowDialogOpen = ref(false)
  // The value the confirm dialog applies; kept after closing so its text does not flip mid-animation.
  const deviceFlowTarget = ref(false)
  const deviceFlowSaving = ref(false)

  watch(apiKeysJson, () => {
    apiKeysValidationError.value = null
  })
  watch(runtimeJson, () => {
    runtimeValidationError.value = null
  })

  async function loadApiKeys() {
    apiKeysLoading.value = true
    apiKeysLoadError.value = null
    try {
      const data = await getPublicApiKeys()
      apiKeys.value = data
      apiKeysJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
      apiKeysLoadError.value = describeError(error, t("adminConfig.toast.loadApiKeysFailedTitle"))
    } finally {
      apiKeysLoading.value = false
    }
  }

  async function loadRuntimeConfig() {
    runtimeLoading.value = true
    runtimeLoadError.value = null
    try {
      const data = await getRuntimeConfig()
      runtimeConfig.value = data
      runtimeJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
      runtimeLoadError.value = describeError(error, t("adminConfig.toast.loadRuntimeFailedTitle"))
    } finally {
      runtimeLoading.value = false
    }
  }

  function parseApiKeysJson(raw: string): PublicApiKeys {
    const parsed = JSON.parse(raw)
    if (!isStringRecord(parsed)) {
      throw new SchemaValidationError(t("adminConfig.toast.invalidApiKeysSchema"))
    }
    return parsed
  }

  function parseRuntimeJson(raw: string): RuntimeConfig {
    const parsed = JSON.parse(raw)
    if (!isJsonRecord(parsed)) {
      throw new SchemaValidationError(t("adminConfig.toast.invalidRuntimeSchema"))
    }
    return parsed
  }

  /** The inline message for a parse failure, or null when the error is not one. */
  function describeValidationError(error: unknown): string | null {
    if (error instanceof SchemaValidationError) return error.message
    if (error instanceof SyntaxError) return t("adminConfig.toast.invalidJson")
    return null
  }

  async function saveApiKeys() {
    if (apiKeysSaving.value) return
    let parsed: PublicApiKeys
    try {
      parsed = parseApiKeysJson(apiKeysJson.value)
    } catch (error: unknown) {
      apiKeysValidationError.value = describeValidationError(error) ?? t("adminConfig.toast.invalidJson")
      return
    }

    apiKeysSaving.value = true
    try {
      await updatePublicApiKeys(parsed)
      await loadApiKeys()
      toast.success(t("adminConfig.toast.apiKeysUpdated"))
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminConfig.toast.saveFailedTitle"),
        error,
        t("adminConfig.toast.saveFailedFallback")
      )
    } finally {
      apiKeysSaving.value = false
    }
  }

  /** Validates the runtime JSON; a valid document opens the apply confirmation. */
  function requestSaveRuntimeConfig() {
    if (runtimeSaving.value) return
    try {
      pendingRuntimeConfig = parseRuntimeJson(runtimeJson.value)
    } catch (error: unknown) {
      pendingRuntimeConfig = null
      runtimeValidationError.value = describeValidationError(error) ?? t("adminConfig.toast.invalidJson")
      return
    }
    runtimeSaveDialogOpen.value = true
  }

  function setRuntimeSaveDialogOpen(open: boolean) {
    runtimeSaveDialogOpen.value = open
  }

  /** Runs inside the confirm dialog: rejects on failure so the dialog shows it inline. */
  async function confirmSaveRuntimeConfig() {
    const parsed = pendingRuntimeConfig
    if (!parsed) return
    runtimeSaving.value = true
    try {
      await updateRuntimeConfig(parsed)
    } finally {
      runtimeSaving.value = false
    }
    pendingRuntimeConfig = null
    await loadRuntimeConfig()
    toast.success(t("adminConfig.toast.runtimeUpdated"))
  }

  function requestDeviceFlowChange(enabled: boolean) {
    // Reloading after the switch would overwrite unsaved edits in the editor.
    if (runtimeLoading.value || runtimeLoadError.value || runtimeDirty.value || deviceFlowSaving.value) return
    deviceFlowTarget.value = enabled
    deviceFlowDialogOpen.value = true
  }

  function setDeviceFlowDialogOpen(open: boolean) {
    deviceFlowDialogOpen.value = open
  }

  /**
   * Applies the confirmed switch with the runtime PUT the editor uses, so it
   * passes the same backend checks. Runs inside the confirm dialog: a failed
   * PUT rejects and is shown there; the reload afterwards reports inline.
   */
  async function confirmDeviceFlowChange() {
    const enabled = deviceFlowTarget.value
    if (deviceFlowSaving.value) return

    deviceFlowSaving.value = true
    try {
      await updateRuntimeConfig(buildRuntimeSwitchPayload(RUNTIME_SWITCH_KEYS.oauth2DeviceFlow, enabled))
    } finally {
      deviceFlowSaving.value = false
    }
    await loadRuntimeConfig()
    if (runtimeLoadError.value) return
    // A backend that does not know the switch accepts the PUT and ignores it.
    if (deviceFlowEnabled.value !== enabled) {
      toast.warning(t("adminConfig.toast.switchNotApplied"))
      return
    }
    toast.success(enabled ? t("adminConfig.toast.deviceFlowEnabled") : t("adminConfig.toast.deviceFlowDisabled"))
  }

  onMounted(() => {
    void loadApiKeys()
    void loadRuntimeConfig()
  })

  return {
    editorOptions: EDITOR_OPTIONS,
    apiKeysLoading,
    apiKeysLoadError,
    apiKeysJson,
    apiKeysSaving,
    apiKeysDirty,
    apiKeysValidationError,
    runtimeLoading,
    runtimeLoadError,
    runtimeJson,
    runtimeSaving,
    runtimeDirty,
    runtimeValidationError,
    runtimeSaveDialogOpen,
    deviceFlowEnabled,
    deviceFlowDialogOpen,
    deviceFlowTarget,
    deviceFlowSaving,
    loadApiKeys,
    loadRuntimeConfig,
    saveApiKeys,
    requestSaveRuntimeConfig,
    setRuntimeSaveDialogOpen,
    confirmSaveRuntimeConfig,
    requestDeviceFlowChange,
    setDeviceFlowDialogOpen,
    confirmDeviceFlowChange,
  }
}
