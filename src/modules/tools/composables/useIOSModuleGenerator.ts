import { computed, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { extractErrorMessage } from "@/lib/error-utils"
import { generateIOSUploadCode } from "@/modules/user-settings/api/ios-upload-code"
import {
  CHUNK_SIZE_MIN,
  IOS_MODULE_EXTENSION_MAP,
  IOS_URI_SCHEMES,
  IOS_DATA_TYPE_OPTIONS,
  REGION_OPTIONS,
  SOFTWARE_OPTIONS,
  UPLOAD_MODE_OPTIONS,
  isIOSUploadDataType,
  isMySekaiUploadType,
  isRegionType,
  normalizeChunkSize,
  type ClientSoftware,
  type EndpointType,
  type IOSUploadDataType,
  type RegionType,
  type UploadMode,
} from "@/modules/tools/lib/ios-module-meta"

export function useIOSModuleGenerator() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()

  const selectedSoftware = ref<ClientSoftware>("surge")
  const selectedEndpoint = ref<EndpointType>(settingsStore.resolvedPreferredEndpoint)
  const selectedMode = ref<UploadMode>("script")
  const selectedRegions = ref<RegionType[]>(["jp"])
  const selectedDataTypes = ref<IOSUploadDataType[]>(["suite"])
  const chunkSize = ref<number>(CHUNK_SIZE_MIN)
  const isGeneratingCode = ref(false)

  const softwareOptions = computed(() =>
    SOFTWARE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`tools.iosModules.software.${option.value}`),
    }))
  )
  const endpointOptions = computed(() =>
    [
      settingsStore.hasDirectEndpoint ? { value: "direct" as const, key: "direct" } : null,
      settingsStore.hasCdnEndpoint ? { value: "cdn" as const, key: "cdn" } : null,
    ]
      .filter((option): option is { value: EndpointType; key: EndpointType } => option !== null)
      .map((option) => ({
        value: option.value,
        label: t(`tools.iosModules.endpointOptions.${option.key}`),
      }))
  )
  const modeOptions = computed(() =>
    UPLOAD_MODE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`tools.iosModules.modeOptions.${option.value}`),
    }))
  )
  const regionOptions = computed(() =>
    REGION_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`tools.iosModules.region.${option.value}`),
    }))
  )
  const dataTypeOptionsWithDesc = computed(() =>
    IOS_DATA_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`tools.iosModules.dataTypes.${option.value}.label`),
      desc: t(`tools.iosModules.dataTypes.${option.value}.description`),
    }))
  )

  const hasUploadCode = computed(() => !!userStore.iosUploadCode)

  const isCnRestricted = computed(() => {
    const hasMysekaiType = selectedDataTypes.value.some((item) => isMySekaiUploadType(item))
    const hasCn = selectedRegions.value.includes("cn")
    return hasMysekaiType && hasCn && userStore.allowCNMysekai !== true
  })

  const isQxScriptWarning = computed(() => selectedSoftware.value === "qx" && selectedMode.value === "script")

  const finalDataTypes = computed(() => selectedDataTypes.value)

  const moduleUrl = computed(() => {
    if (!hasUploadCode.value || selectedRegions.value.length === 0 || finalDataTypes.value.length === 0 || isCnRestricted.value) {
      return null
    }

    const baseUrl = settingsStore.getEndpointUrl(selectedEndpoint.value)
    if (!baseUrl) {
      return null
    }
    const regions = selectedRegions.value.join("-")
    const dataTypes = finalDataTypes.value.join("-")
    const ext = IOS_MODULE_EXTENSION_MAP[selectedSoftware.value]

    let url = `${baseUrl}/ios/module/${userStore.iosUploadCode}/${regions}-haruki-toolbox-${dataTypes}.${ext}`
    url += `?mode=${selectedMode.value}&endpoint=${selectedEndpoint.value}`

    if (selectedMode.value === "script") {
      url += `&chunk=${chunkSize.value}`
    }

    return url
  })

  const scriptUrl = computed(() => {
    if (!hasUploadCode.value || isCnRestricted.value) return null

    const baseUrl = settingsStore.getEndpointUrl(selectedEndpoint.value)
    if (!baseUrl) return null
    return `${baseUrl}/ios/script/${userStore.iosUploadCode}/haruki-toolbox.js?chunk=${chunkSize.value}&endpoint=${selectedEndpoint.value}`
  })

  const canInstall = computed(() => {
    return hasUploadCode.value &&
      selectedRegions.value.length > 0 &&
      finalDataTypes.value.length > 0 &&
      !isCnRestricted.value &&
      !isQxScriptWarning.value
  })

  async function generateCode() {
    if (!userStore.userId) {
      toast.warning(t("tools.iosModules.toast.loginRequired"))
      return
    }

    isGeneratingCode.value = true
    try {
      const code = await generateIOSUploadCode(userStore.userId)
      userStore.setIOSUploadCode(code)
      toast.success(t("tools.iosModules.toast.generateCodeSuccess"))
    } catch (error: unknown) {
      toast.error(t("tools.iosModules.toast.generateCodeFailedTitle"), {
        description: extractErrorMessage(error, t("tools.iosModules.toast.generateCodeFailedFallback")),
      })
    } finally {
      isGeneratingCode.value = false
    }
  }

  async function copyToClipboard(text: string, label: string) {
    if (!text) {
      toast.error(t("tools.iosModules.toast.copyEmpty"))
      return
    }

    if (!isClipboardSupported()) {
      toast.error(t("tools.iosModules.toast.clipboardUnsupported"))
      return
    }

    if (await copyTextToClipboard(text)) {
      toast.success(t("tools.iosModules.toast.copySuccess", { label }))
      return
    }

    toast.error(t("tools.iosModules.toast.copyFailed"))
  }

  function toggleRegion(region: string) {
    if (!isRegionType(region)) return

    if (selectedRegions.value.includes(region)) {
      selectedRegions.value = selectedRegions.value.filter((item) => item !== region)
      return
    }

    selectedRegions.value = [...selectedRegions.value, region]
  }

  function toggleDataType(dataType: string) {
    if (!isIOSUploadDataType(dataType)) return

    if (selectedDataTypes.value.includes(dataType)) {
      selectedDataTypes.value = selectedDataTypes.value.filter((item) => item !== dataType)
      return
    }

    let nextTypes = [...selectedDataTypes.value]
    if (dataType === "mysekai") {
      nextTypes = nextTypes.filter((item) => item !== "mysekai_force")
    } else if (dataType === "mysekai_force") {
      nextTypes = nextTypes.filter((item) => item !== "mysekai")
    }

    nextTypes.push(dataType)
    selectedDataTypes.value = nextTypes
  }

  function forceQxToProxyMode() {
    if (selectedSoftware.value === "qx" && selectedMode.value === "script") {
      selectedMode.value = "proxy"
      toast.info(t("tools.iosModules.toast.qxScriptFallback"))
    }
  }

  async function installModule() {
    if (!canInstall.value || !moduleUrl.value) return

    const schemeFn = IOS_URI_SCHEMES[selectedSoftware.value]
    if (!schemeFn) {
      toast.warning(t("tools.iosModules.toast.unsupportedClient"))
      return
    }

    if (typeof window === "undefined") {
      toast.error(t("tools.iosModules.toast.installUnsupported"))
      return
    }

    window.location.href = schemeFn(moduleUrl.value)
  }

  watch(chunkSize, (value) => {
    const normalized = normalizeChunkSize(value)
    if (normalized !== value) {
      chunkSize.value = normalized
    }
  })

  watch(selectedSoftware, () => {
    forceQxToProxyMode()
  })

  watch(selectedMode, () => {
    forceQxToProxyMode()
  })

  watch(
    endpointOptions,
    (options) => {
      if (options.some((option) => option.value === selectedEndpoint.value)) {
        return
      }

      const fallback = options[0]?.value ?? settingsStore.resolvedPreferredEndpoint
      if (fallback) {
        selectedEndpoint.value = fallback
      }
    },
    { immediate: true }
  )

  return {
    userStore,
    selectedSoftware,
    selectedEndpoint,
    selectedMode,
    selectedRegions,
    selectedDataTypes,
    chunkSize,
    isGeneratingCode,
    softwareOptions,
    endpointOptions,
    modeOptions,
    regionOptions,
    dataTypeOptionsWithDesc,
    hasUploadCode,
    isCnRestricted,
    moduleUrl,
    scriptUrl,
    canInstall,
    generateCode,
    copyToClipboard,
    toggleRegion,
    toggleDataType,
    installModule,
  }
}
