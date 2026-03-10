import { computed, onMounted, ref } from "vue"
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

  const selectedEndpoint = ref<EndpointType>(settingsStore.preferredEndpoint)
  const selectedTheme = ref<ThemeType>(settingsStore.theme)
  const selectedLocale = ref<AppLocale>(settingsStore.locale)

  const endpointOptions = computed<ReadonlyArray<EndpointOption>>(() => [
    { value: "direct", label: t("homeSettings.endpoint.direct"), icon: Link },
    { value: "cdn", label: t("homeSettings.endpoint.cdn"), icon: CloudLightning },
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
    settingsStore.setPreferredEndpoint(selectedEndpoint.value)
    settingsStore.setTheme(selectedTheme.value)
    settingsStore.setLocale(selectedLocale.value)
    toast.success(t("homeSettings.toast.saved"))
  }

  function resetSettings() {
    selectedEndpoint.value = DEFAULT_ENDPOINT
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

  return {
    selectedEndpoint,
    selectedTheme,
    selectedLocale,
    endpointOptions,
    themeOptions,
    localeOptions,
    selectedEndpointLabel,
    selectedThemeLabel,
    selectedLocaleLabel,
    saveSettings,
    resetSettings,
  }
}
