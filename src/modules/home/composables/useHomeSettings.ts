import { computed, onMounted } from "vue"
import type { Component } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { CloudLightning, Globe2, Link, Monitor, Moon, Network, Sun } from "lucide-vue-next"
import {
  useSettingsStore,
  type AssetEndpointLatencyStatus,
  type EndpointLatencyStatus,
  type EndpointType,
  type ThemeType,
} from "@/shared/stores/settings"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { DEFAULT_LOCALE, setI18nLocale, SUPPORTED_LOCALES, translate, type AppLocale } from "@/shared/i18n"

interface EndpointOption {
  value: EndpointType
  label: string
  icon: Component
  latencyLabel: string
  latencyStatus: EndpointLatencyStatus | "unknown"
}

interface AssetEndpointOption {
  value: SekaiAssetEndpointPreference
  label: string
  url: string
  icon: Component
  latencyLabel: string
  latencyStatus: AssetEndpointLatencyStatus | "unknown"
}

interface ThemeOption {
  value: ThemeType
  label: string
  icon: Component
}

interface LocaleOption {
  value: AppLocale
  label: string
}

const DEFAULT_ENDPOINT: EndpointType = "direct"
const DEFAULT_THEME: ThemeType = "system"
const DEFAULT_REDUCED_VISUAL_EFFECTS = false
const DEFAULT_HIDE_GAME_USER_ID = false

// Settings apply immediately: every selection writes straight to the settings
// store, so the dialog has no draft state and no save button.
export function useHomeSettings() {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()

  const selectedEndpoint = computed<EndpointType>({
    get: () => settingsStore.resolvedPreferredEndpoint,
    set: (value) => settingsStore.setPreferredEndpoint(value),
  })

  const selectedAssetEndpoint = computed<SekaiAssetEndpointPreference>({
    get: () => settingsStore.currentAssetEndpoint,
    set: (value) => settingsStore.setPreferredAssetEndpoint(value),
  })

  const selectedTheme = computed<ThemeType>({
    get: () => settingsStore.theme,
    set: (value) => settingsStore.setTheme(value),
  })

  const selectedLocale = computed<AppLocale>({
    get: () => settingsStore.locale,
    set: (value) => {
      settingsStore.setLocale(value)
      void setI18nLocale(value)
    },
  })

  const selectedReducedVisualEffects = computed<boolean>({
    get: () => settingsStore.reducedVisualEffects,
    set: (value) => settingsStore.setReducedVisualEffects(value),
  })

  const selectedHideGameUserId = computed<boolean>({
    get: () => settingsStore.hideGameUserId,
    set: (value) => settingsStore.setHideGameUserId(value),
  })

  const selectedShowUnreleasedContent = computed<boolean>({
    get: () => settingsStore.showUnreleasedContent,
    set: (value) => settingsStore.setShowUnreleasedContent(value),
  })

  const selectedBlurUnreleasedContent = computed<boolean>({
    get: () => settingsStore.blurUnreleasedContent,
    set: (value) => settingsStore.setBlurUnreleasedContent(value),
  })

  const endpointOptions = computed<ReadonlyArray<EndpointOption>>(() => [
    settingsStore.hasDirectEndpoint
      ? createEndpointOption("direct", t("homeSettings.endpoint.direct"), Link)
      : null,
    settingsStore.hasCdnEndpoint
      ? createEndpointOption("cdn", t("homeSettings.endpoint.cdn"), CloudLightning)
      : null,
  ].filter((option): option is EndpointOption => option !== null))

  const endpointSelectionDisabled = computed(() => endpointOptions.value.length <= 1)
  const endpointUnavailable = computed(() => endpointOptions.value.length === 0)

  const assetEndpointOptions = computed<ReadonlyArray<AssetEndpointOption>>(() => [
    createAssetEndpointOption("china", t("homeSettings.assetEndpoint.china"), Network),
    createAssetEndpointOption("global", t("homeSettings.assetEndpoint.global"), Globe2),
    createAssetEndpointOption("china_cdn", t("homeSettings.assetEndpoint.chinaCdn"), CloudLightning),
  ])

  const themeOptions = computed<ReadonlyArray<ThemeOption>>(() => [
    { value: "light", label: t("homeSettings.theme.light"), icon: Sun },
    { value: "dark", label: t("homeSettings.theme.dark"), icon: Moon },
    { value: "system", label: t("homeSettings.theme.system"), icon: Monitor },
  ])

  const LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
    "zh-CN": "homeSettings.locale.zhCN",
    "zh-TW": "homeSettings.locale.zhTW",
    "en-US": "homeSettings.locale.enUS",
  }

  const localeOptions = computed<ReadonlyArray<LocaleOption>>(() =>
    SUPPORTED_LOCALES.map((locale) => ({
      value: locale,
      label: t(LOCALE_LABEL_KEYS[locale]),
    }))
  )

  const selectedEndpointLabel = computed(
    () =>
      endpointOptions.value.find((option) => option.value === selectedEndpoint.value)?.label ??
      t("homeSettings.endpoint.placeholder")
  )

  const selectedAssetEndpointLabel = computed(
    () =>
      assetEndpointOptions.value.find((option) => option.value === selectedAssetEndpoint.value)?.label ??
      t("homeSettings.assetEndpoint.placeholder")
  )

  const selectedThemeLabel = computed(
    () =>
      themeOptions.value.find((option) => option.value === selectedTheme.value)?.label ??
      t("homeSettings.theme.placeholder")
  )

  const selectedLocaleLabel = computed(
    () =>
      localeOptions.value.find((option) => option.value === selectedLocale.value)?.label ??
      t("homeSettings.locale.placeholder")
  )

  const latencyChecking = computed(
    () => settingsStore.endpointLatencyChecking || settingsStore.assetEndpointLatencyChecking
  )

  async function resetSettings() {
    settingsStore.setPreferredEndpoint(DEFAULT_ENDPOINT)
    settingsStore.resetAssetEndpointPreference()
    settingsStore.setTheme(DEFAULT_THEME)
    settingsStore.setLocale(DEFAULT_LOCALE)
    settingsStore.setReducedVisualEffects(DEFAULT_REDUCED_VISUAL_EFFECTS)
    settingsStore.setHideGameUserId(DEFAULT_HIDE_GAME_USER_ID)
    settingsStore.setShowUnreleasedContent(false)
    settingsStore.setBlurUnreleasedContent(true)
    await setI18nLocale(DEFAULT_LOCALE)
    void settingsStore.initAssetEndpointPreference()
    toast.info(translate("homeSettings.toast.reset"))
  }

  onMounted(() => {
    settingsStore.initTheme()
    settingsStore.initVisualEffects()
    void settingsStore.initAssetEndpointPreference()
  })

  async function refreshEndpointLatencies() {
    await Promise.all([
      settingsStore.measureEndpointLatencies(),
      settingsStore.measureAssetEndpointLatencies(false),
    ])
  }

  function createEndpointOption(
    value: EndpointType,
    label: string,
    icon: Component,
  ): EndpointOption {
    const latency = settingsStore.endpointLatencyResults[value]
    return {
      value,
      label,
      icon,
      latencyLabel: formatEndpointLatency(latency?.status, latency?.elapsedMs),
      latencyStatus: latency?.status ?? "unknown",
    }
  }

  function createAssetEndpointOption(
    value: SekaiAssetEndpointPreference,
    label: string,
    icon: Component,
  ): AssetEndpointOption {
    const latency = settingsStore.assetEndpointLatencyResults[value]
    return {
      value,
      label,
      url: settingsStore.getAssetEndpointUrl(value),
      icon,
      latencyLabel: formatAssetEndpointLatency(latency?.status, latency?.elapsedMs),
      latencyStatus: latency?.status ?? "unknown",
    }
  }

  function formatEndpointLatency(status: EndpointLatencyStatus | undefined, elapsedMs: number | null | undefined) {
    if (settingsStore.endpointLatencyChecking && status === "pending") {
      return t("homeSettings.endpoint.checking")
    }
    if (status === "ok" && elapsedMs != null) {
      return t("homeSettings.endpoint.latencyMs", { ms: elapsedMs })
    }
    if (status === "failed") {
      return t("homeSettings.endpoint.failed")
    }

    return t("homeSettings.endpoint.unknown")
  }

  function formatAssetEndpointLatency(status: AssetEndpointLatencyStatus | undefined, elapsedMs: number | null | undefined) {
    if (settingsStore.assetEndpointLatencyChecking && status === "pending") {
      return t("homeSettings.assetEndpoint.checking")
    }
    if (status === "ok" && elapsedMs != null) {
      return t("homeSettings.assetEndpoint.latencyMs", { ms: elapsedMs })
    }
    if (status === "failed") {
      return t("homeSettings.assetEndpoint.failed")
    }

    return t("homeSettings.assetEndpoint.unknown")
  }

  function latencyTagClass(status: EndpointOption["latencyStatus"] | AssetEndpointOption["latencyStatus"]) {
    switch (status) {
      case "ok":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      case "failed":
        return "border-destructive/30 bg-destructive/10 text-destructive"
      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      default:
        return "border-border bg-muted text-muted-foreground"
    }
  }

  return {
    selectedEndpoint,
    selectedAssetEndpoint,
    selectedTheme,
    selectedLocale,
    selectedReducedVisualEffects,
    selectedHideGameUserId,
    selectedShowUnreleasedContent,
    selectedBlurUnreleasedContent,
    endpointOptions,
    assetEndpointOptions,
    endpointSelectionDisabled,
    endpointUnavailable,
    themeOptions,
    localeOptions,
    selectedEndpointLabel,
    selectedAssetEndpointLabel,
    selectedThemeLabel,
    selectedLocaleLabel,
    latencyChecking,
    latencyTagClass,
    refreshEndpointLatencies,
    resetSettings,
  }
}
