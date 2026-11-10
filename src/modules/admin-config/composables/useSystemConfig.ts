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
import {
  EMPTY_ALLOWED_KEYS_DRAFT,
  addAllowedKeys,
  applyAllowedKeysDraft,
  isAllowedKeysDraftDirty,
  removeAllowedKey,
  restoreAllowedKey,
  splitKeyInput,
  type AllowedKeysDraft,
} from "@/modules/admin-config/lib/allowed-keys"
import { isJsonRecord } from "@/lib/json-utils"
import type { RuntimeConfig } from "@/types/admin"
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
  // The allowlist as loaded, and the edits on top of it: keys struck out and
  // keys added. Nothing is sent until the admin saves.
  const apiKeys = ref<string[]>([])
  const apiKeysDraft = ref<AllowedKeysDraft>(EMPTY_ALLOWED_KEYS_DRAFT)
  const apiKeyInput = ref("")
  // Shown under the add field; cleared on the next edit.
  const apiKeyInputError = ref<string | null>(null)
  const apiKeysSaving = ref(false)

  const runtimeLoading = ref(true)
  // A reload that keeps the loaded configuration on screen (after a switch or
  // an allowlist save) instead of falling back to the skeleton.
  const runtimeRefreshing = ref(false)
  const runtimeLoadError = ref<ErrorDescription | null>(null)
  const runtimeConfig = ref<RuntimeConfig>({})
  const runtimeJson = ref("")
  const runtimeSaving = ref(false)
  const runtimeValidationError = ref<string | null>(null)
  const runtimeSaveDialogOpen = ref(false)
  // The parsed config the confirm dialog applies; set when the dialog opens.
  let pendingRuntimeConfig: RuntimeConfig | null = null

  // Nothing is dirty without a loaded baseline: while loading or after a
  // failed load the editor holds no server state to differ from.
  const apiKeysDirty = computed(() =>
    !apiKeysLoading.value && !apiKeysLoadError.value && isAllowedKeysDraftDirty(apiKeysDraft.value)
  )
  const runtimeDirty = computed(() =>
    !runtimeLoading.value && !runtimeLoadError.value && runtimeJson.value !== JSON.stringify(runtimeConfig.value, null, 2)
  )

  const deviceFlowEnabled = computed(() => readRuntimeSwitch(runtimeConfig.value, RUNTIME_SWITCH_KEYS.oauth2DeviceFlow))
  const deviceFlowDialogOpen = ref(false)
  // The value the confirm dialog applies; kept after closing so its text does not flip mid-animation.
  const deviceFlowTarget = ref(false)
  const deviceFlowSaving = ref(false)

  watch(runtimeJson, () => {
    runtimeValidationError.value = null
  })

  async function loadApiKeys() {
    apiKeysLoading.value = true
    apiKeysLoadError.value = null
    try {
      apiKeys.value = await getPublicApiKeys()
      apiKeysDraft.value = EMPTY_ALLOWED_KEYS_DRAFT
    } catch (error: unknown) {
      apiKeysLoadError.value = describeError(error, t("adminConfig.allowedKeys.loadFailed"))
    } finally {
      apiKeysLoading.value = false
    }
  }

  async function loadRuntimeConfig(options: { silent?: boolean } = {}) {
    const busy = options.silent ? runtimeRefreshing : runtimeLoading
    busy.value = true
    if (!options.silent) {
      runtimeLoadError.value = null
    }
    try {
      const data = await getRuntimeConfig()
      runtimeConfig.value = data
      runtimeJson.value = JSON.stringify(data, null, 2)
      runtimeLoadError.value = null
    } catch (error: unknown) {
      runtimeLoadError.value = describeError(error, t("adminConfig.toast.loadRuntimeFailedTitle"))
    } finally {
      busy.value = false
    }
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

  /** Typing in the add field; a corrected entry drops its message right away. */
  function setApiKeyInput(value: string) {
    apiKeyInput.value = value
    apiKeyInputError.value = null
  }

  /** Adds the keys typed or pasted into the add field (several at once, separated by commas or spaces). */
  function addApiKeys() {
    if (apiKeysSaving.value) return
    const incoming = splitKeyInput(apiKeyInput.value)
    if (incoming.length === 0) {
      apiKeyInputError.value = t("adminConfig.allowedKeys.validation.empty")
      return
    }
    const result = addAllowedKeys(apiKeys.value, apiKeysDraft.value, incoming)
    apiKeysDraft.value = result.draft
    // Keys that went in leave the field; the ones already listed stay to be corrected.
    apiKeyInput.value = result.duplicates.join(", ")
    apiKeyInputError.value = result.duplicates.length > 0
      ? t("adminConfig.allowedKeys.validation.duplicate", { keys: result.duplicates.join(", ") })
      : null
  }

  function removeApiKey(key: string) {
    if (apiKeysSaving.value) return
    apiKeysDraft.value = removeAllowedKey(apiKeys.value, apiKeysDraft.value, key)
  }

  function restoreApiKey(key: string) {
    if (apiKeysSaving.value) return
    apiKeysDraft.value = restoreAllowedKey(apiKeysDraft.value, key)
  }

  function resetApiKeys() {
    if (apiKeysSaving.value) return
    apiKeysDraft.value = EMPTY_ALLOWED_KEYS_DRAFT
    setApiKeyInput("")
  }

  async function saveApiKeys() {
    if (apiKeysSaving.value || !apiKeysDirty.value) return

    apiKeysSaving.value = true
    try {
      // The backend answers with the list it stored (trimmed, without duplicates).
      apiKeys.value = await updatePublicApiKeys(applyAllowedKeysDraft(apiKeys.value, apiKeysDraft.value))
      apiKeysDraft.value = EMPTY_ALLOWED_KEYS_DRAFT
      setApiKeyInput("")
      // The runtime configuration carries the same list; refresh it unless
      // that would drop unsaved edits in the JSON editor.
      if (!runtimeDirty.value && !runtimeLoading.value && !runtimeLoadError.value) {
        void loadRuntimeConfig({ silent: true })
      }
      toast.success(t("adminConfig.allowedKeys.saved"))
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
    await loadRuntimeConfig({ silent: true })
    // The runtime PUT can carry the allowlist too; show what the backend holds
    // now, unless the list has unsaved edits of its own.
    if (!apiKeysDirty.value && !apiKeysLoading.value && !apiKeysLoadError.value) {
      void loadApiKeys()
    }
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
    await loadRuntimeConfig({ silent: true })
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
    apiKeys,
    apiKeysDraft,
    apiKeyInput,
    apiKeyInputError,
    apiKeysSaving,
    apiKeysDirty,
    runtimeLoading,
    runtimeRefreshing,
    runtimeConfig,
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
    setApiKeyInput,
    addApiKeys,
    removeApiKey,
    restoreApiKey,
    resetApiKeys,
    saveApiKeys,
    requestSaveRuntimeConfig,
    setRuntimeSaveDialogOpen,
    confirmSaveRuntimeConfig,
    requestDeviceFlowChange,
    setDeviceFlowDialogOpen,
    confirmDeviceFlowChange,
  }
}
