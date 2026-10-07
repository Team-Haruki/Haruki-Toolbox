import { computed, onMounted, ref } from "vue"
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
  const apiKeysLoadError = ref(false)
  const apiKeys = ref<PublicApiKeys>({})
  const apiKeysJson = ref("")
  const apiKeysSaving = ref(false)

  const runtimeLoading = ref(true)
  const runtimeLoadError = ref(false)
  const runtimeConfig = ref<RuntimeConfig>({})
  const runtimeJson = ref("")
  const runtimeSaving = ref(false)

  const apiKeysDirty = computed(() => apiKeysJson.value !== JSON.stringify(apiKeys.value, null, 2))
  const runtimeDirty = computed(() => runtimeJson.value !== JSON.stringify(runtimeConfig.value, null, 2))

  const deviceFlowEnabled = computed(() => readRuntimeSwitch(runtimeConfig.value, RUNTIME_SWITCH_KEYS.oauth2DeviceFlow))
  const deviceFlowDialogOpen = ref(false)
  // The value the confirm dialog applies; kept after closing so its text does not flip mid-animation.
  const deviceFlowTarget = ref(false)
  const deviceFlowSaving = ref(false)

  async function loadApiKeys() {
    apiKeysLoading.value = true
    apiKeysLoadError.value = false
    try {
      const data = await getPublicApiKeys()
      apiKeys.value = data
      apiKeysJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
      apiKeysLoadError.value = true
      toastErrorWithExtractedMessage(
        t("adminConfig.toast.loadApiKeysFailedTitle"),
        error,
        t("adminConfig.toast.loadFailedFallback")
      )
    } finally {
      apiKeysLoading.value = false
    }
  }

  async function loadRuntimeConfig() {
    runtimeLoading.value = true
    runtimeLoadError.value = false
    try {
      const data = await getRuntimeConfig()
      runtimeConfig.value = data
      runtimeJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
      runtimeLoadError.value = true
      toastErrorWithExtractedMessage(
        t("adminConfig.toast.loadRuntimeFailedTitle"),
        error,
        t("adminConfig.toast.loadFailedFallback")
      )
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

  async function saveApiKeys() {
    apiKeysSaving.value = true
    try {
      const parsed = parseApiKeysJson(apiKeysJson.value)

      await updatePublicApiKeys(parsed)
      await loadApiKeys()
      toast.success(t("adminConfig.toast.apiKeysUpdated"))
    } catch (error: unknown) {
      if (error instanceof SchemaValidationError) {
        toast.error(error.message)
      } else if (error instanceof SyntaxError) {
        toast.error(t("adminConfig.toast.invalidJson"))
      } else {
        toastErrorWithExtractedMessage(
          t("adminConfig.toast.saveFailedTitle"),
          error,
          t("adminConfig.toast.saveFailedFallback")
        )
      }
    } finally {
      apiKeysSaving.value = false
    }
  }

  async function saveRuntimeConfig() {
    runtimeSaving.value = true
    try {
      const parsed = parseRuntimeJson(runtimeJson.value)

      await updateRuntimeConfig(parsed)
      await loadRuntimeConfig()
      toast.success(t("adminConfig.toast.runtimeUpdated"))
    } catch (error: unknown) {
      if (error instanceof SchemaValidationError) {
        toast.error(error.message)
      } else if (error instanceof SyntaxError) {
        toast.error(t("adminConfig.toast.invalidJson"))
      } else {
        toastErrorWithExtractedMessage(
          t("adminConfig.toast.saveFailedTitle"),
          error,
          t("adminConfig.toast.saveFailedFallback")
        )
      }
    } finally {
      runtimeSaving.value = false
    }
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

  /** Applies the confirmed switch with the runtime PUT the editor uses, so it passes the same backend checks. */
  async function confirmDeviceFlowChange() {
    const enabled = deviceFlowTarget.value
    deviceFlowDialogOpen.value = false
    if (deviceFlowSaving.value) return

    deviceFlowSaving.value = true
    try {
      await updateRuntimeConfig(buildRuntimeSwitchPayload(RUNTIME_SWITCH_KEYS.oauth2DeviceFlow, enabled))
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminConfig.toast.saveFailedTitle"),
        error,
        t("adminConfig.toast.saveFailedFallback")
      )
      deviceFlowSaving.value = false
      return
    }
    await loadRuntimeConfig()
    deviceFlowSaving.value = false
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
    runtimeLoading,
    runtimeLoadError,
    runtimeJson,
    runtimeSaving,
    runtimeDirty,
    deviceFlowEnabled,
    deviceFlowDialogOpen,
    deviceFlowTarget,
    deviceFlowSaving,
    loadApiKeys,
    loadRuntimeConfig,
    saveApiKeys,
    saveRuntimeConfig,
    requestDeviceFlowChange,
    setDeviceFlowDialogOpen,
    confirmDeviceFlowChange,
  }
}
