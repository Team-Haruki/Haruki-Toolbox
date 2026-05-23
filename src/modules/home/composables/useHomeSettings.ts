import { computed, onMounted, ref, watch } from "vue"
import type { Component } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { CloudLightning, Gauge, Globe2, Link, Monitor, Moon, Network, Sun } from "lucide-vue-next"
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
const DEFAULT_ASSET_ENDPOINT: SekaiAssetEndpointPreference = "china"
const DEFAULT_THEME: ThemeType = "system"
const DEFAULT_REDUCED_VISUAL_EFFECTS = false
const DEFAULT_HIDE_GAME_USER_ID = false

export function useHomeSettings() {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()

  const selectedEndpoint = ref<EndpointType>(settingsStore.resolvedPreferredEndpoint)
  const selectedAssetEndpoint = ref<SekaiAssetEndpointPreference>(settingsStore.currentAssetEndpoint)
  const selectedTheme = ref<ThemeType>(settingsStore.theme)
  const selectedLocale = ref<AppLocale>(settingsStore.locale)
  const selectedReducedVisualEffects = ref(settingsStore.reducedVisualEffects)
  const selectedHideGameUserId = ref(settingsStore.hideGameUserId)

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
  ])

  const themeOptions = computed<ReadonlyArray<ThemeOption>>(() => [
    { value: "light", label: t("homeSettings.theme.light"), icon: Sun },
    { value: "dark", label: t("homeSettings.theme.dark"), icon: Moon },
    { value: "system", label: t("homeSettings.theme.system"), icon: Monitor },
  ])

  const localeOptions = computed<ReadonlyArray<LocaleOption>>(() =>
    SUPPORTED_LOCALES.map((locale) => ({
      value: locale,
      label: locale === "zh-CN" ? t("homeSettings.locale.zhCN") : t("homeSettings.locale.enUS"),
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

  async function saveSettings() {
    if (endpointUnavailable.value) {
      toast.error(t("homeSettings.endpoint.unavailable"))
      return
    }

    settingsStore.setPreferredEndpoint(selectedEndpoint.value)
    settingsStore.setPreferredAssetEndpoint(selectedAssetEndpoint.value)
    settingsStore.setTheme(selectedTheme.value)
    settingsStore.setLocale(selectedLocale.value)
    settingsStore.setReducedVisualEffects(selectedReducedVisualEffects.value)
    settingsStore.setHideGameUserId(selectedHideGameUserId.value)
    await setI18nLocale(selectedLocale.value)
    toast.success(translate("homeSettings.toast.saved"))
  }

  async function resetSettings() {
    settingsStore.setPreferredEndpoint(DEFAULT_ENDPOINT)
    settingsStore.resetAssetEndpointPreference()
    settingsStore.setTheme(DEFAULT_THEME)
    settingsStore.setLocale(DEFAULT_LOCALE)
    settingsStore.setReducedVisualEffects(DEFAULT_REDUCED_VISUAL_EFFECTS)
    settingsStore.setHideGameUserId(DEFAULT_HIDE_GAME_USER_ID)
    await setI18nLocale(DEFAULT_LOCALE)
    selectedEndpoint.value = settingsStore.resolvedPreferredEndpoint
    selectedAssetEndpoint.value = DEFAULT_ASSET_ENDPOINT
    selectedTheme.value = settingsStore.theme
    selectedLocale.value = settingsStore.locale
    selectedReducedVisualEffects.value = settingsStore.reducedVisualEffects
    selectedHideGameUserId.value = settingsStore.hideGameUserId
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

  watch(
    () => settingsStore.currentAssetEndpoint,
    (value) => {
      selectedAssetEndpoint.value = value
    }
  )

  return {
    selectedEndpoint,
    selectedAssetEndpoint,
    selectedTheme,
    selectedLocale,
    selectedReducedVisualEffects,
    selectedHideGameUserId,
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
    visualEffectsIcon: Gauge,
    latencyTagClass,
    refreshEndpointLatencies,
    saveSettings,
    resetSettings,
  }
}
