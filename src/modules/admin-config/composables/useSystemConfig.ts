import { onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getPublicApiKeys, updatePublicApiKeys } from "@/modules/admin-config/api/public-api-keys"
import { getRuntimeConfig, updateRuntimeConfig } from "@/modules/admin-config/api/runtime"
import { isJsonRecord, isStringRecord } from "@/lib/json-utils"
import type { PublicApiKeys, RuntimeConfig } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

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
  const apiKeys = ref<PublicApiKeys>({})
  const apiKeysJson = ref("")
  const apiKeysSaving = ref(false)

  const runtimeLoading = ref(true)
  const runtimeConfig = ref<RuntimeConfig>({})
  const runtimeJson = ref("")
  const runtimeSaving = ref(false)

  async function loadApiKeys() {
    apiKeysLoading.value = true
    try {
      const data = await getPublicApiKeys()
      apiKeys.value = data
      apiKeysJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
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
    try {
      const data = await getRuntimeConfig()
      runtimeConfig.value = data
      runtimeJson.value = JSON.stringify(data, null, 2)
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminConfig.toast.loadRuntimeFailedTitle"),
        error,
        t("adminConfig.toast.loadFailedFallback")
      )
    } finally {
      runtimeLoading.value = false
    }
  }

  function parseApiKeysJson(raw: string): PublicApiKeys | null {
    const parsed = JSON.parse(raw)
    return isStringRecord(parsed) ? parsed : null
  }

  function parseRuntimeJson(raw: string): RuntimeConfig | null {
    const parsed = JSON.parse(raw)
    return isJsonRecord(parsed) ? parsed : null
  }

  async function saveApiKeys() {
    apiKeysSaving.value = true
    try {
      const parsed = parseApiKeysJson(apiKeysJson.value)
      if (!parsed) {
        toast.error(t("adminConfig.toast.invalidJson"))
        return
      }

      await updatePublicApiKeys(parsed)
      apiKeys.value = parsed
      apiKeysJson.value = JSON.stringify(parsed, null, 2)
      toast.success(t("adminConfig.toast.apiKeysUpdated"))
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
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
      if (!parsed) {
        toast.error(t("adminConfig.toast.invalidJson"))
        return
      }

      await updateRuntimeConfig(parsed)
      runtimeConfig.value = parsed
      runtimeJson.value = JSON.stringify(parsed, null, 2)
      toast.success(t("adminConfig.toast.runtimeUpdated"))
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
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
    apiKeysJson,
    apiKeysSaving,
    runtimeLoading,
    runtimeJson,
    runtimeSaving,
    saveApiKeys,
    saveRuntimeConfig,
  }
}
