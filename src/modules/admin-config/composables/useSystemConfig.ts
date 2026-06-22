import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getPublicApiKeys, updatePublicApiKeys } from "@/modules/admin-config/api/public-api-keys"
import { getRuntimeConfig, updateRuntimeConfig } from "@/modules/admin-config/api/runtime"
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
    loadApiKeys,
    loadRuntimeConfig,
    saveApiKeys,
    saveRuntimeConfig,
  }
}
