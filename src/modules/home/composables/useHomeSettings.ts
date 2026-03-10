import { computed, onMounted, ref, watch } from "vue"
import type { Component } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { CloudLightning, Link, Monitor, Moon, Sun } from "lucide-vue-next"
import { useSettingsStore, type EndpointType, type ThemeType } from "@/shared/stores/settings"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "@/shared/i18n"

interface EndpointOption {
  value: EndpointType
  label: string
  icon: Component
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

export function useHomeSettings() {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()

  const selectedEndpoint = ref<EndpointType>(settingsStore.resolvedPreferredEndpoint)
  const selectedTheme = ref<ThemeType>(settingsStore.theme)
  const selectedLocale = ref<AppLocale>(settingsStore.locale)

  const endpointOptions = computed<ReadonlyArray<EndpointOption>>(() => [
    settingsStore.hasDirectEndpoint
      ? { value: "direct" as const, label: t("homeSettings.endpoint.direct"), icon: Link }
      : null,
    settingsStore.hasCdnEndpoint
      ? { value: "cdn" as const, label: t("homeSettings.endpoint.cdn"), icon: CloudLightning }
      : null,
  ].filter((option): option is EndpointOption => option !== null))

  const endpointSelectionDisabled = computed(() => endpointOptions.value.length <= 1)
  const endpointUnavailable = computed(() => endpointOptions.value.length === 0)

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

  function saveSettings() {
    if (endpointUnavailable.value) {
      toast.error(t("homeSettings.endpoint.unavailable"))
      return
    }

    settingsStore.setPreferredEndpoint(selectedEndpoint.value)
    settingsStore.setTheme(selectedTheme.value)
    settingsStore.setLocale(selectedLocale.value)
    toast.success(t("homeSettings.toast.saved"))
  }

  function resetSettings() {
    selectedEndpoint.value = settingsStore.resolvedPreferredEndpoint || DEFAULT_ENDPOINT
    selectedTheme.value = DEFAULT_THEME
    selectedLocale.value = DEFAULT_LOCALE
    settingsStore.setPreferredEndpoint(DEFAULT_ENDPOINT)
    settingsStore.setTheme(DEFAULT_THEME)
    settingsStore.setLocale(DEFAULT_LOCALE)
    toast.info(t("homeSettings.toast.reset"))
  }

  onMounted(() => {
    settingsStore.initTheme()
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
    selectedEndpoint,
    selectedTheme,
    selectedLocale,
    endpointOptions,
    endpointSelectionDisabled,
    endpointUnavailable,
    themeOptions,
    localeOptions,
    selectedEndpointLabel,
    selectedThemeLabel,
    selectedLocaleLabel,
    saveSettings,
    resetSettings,
  }
}
