import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/shared/i18n"

/**
 * Preferences for pages that mount before the Pinia settings store exists
 * (the in-app browser block page). They read the store's persisted JSON
 * directly, with the device's own settings as the fallback.
 */
const SETTINGS_STORAGE_KEY = "settings"

type PersistedSettings = { locale?: unknown; theme?: unknown }

function readPersistedSettings(): PersistedSettings {
  try {
    const raw = globalThis.localStorage?.getItem(SETTINGS_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object" ? (parsed as PersistedSettings) : {}
  } catch {
    // Storage blocked or corrupt: behave like a first visit.
    return {}
  }
}

export function resolvePreMountLocale(): AppLocale {
  const { locale } = readPersistedSettings()
  if (isAppLocale(locale)) {
    return locale
  }

  const language = (globalThis.navigator?.language ?? "").toLowerCase()
  if (language.startsWith("en")) return "en-US"
  if (/^zh-(tw|hk|mo|hant)/.test(language)) return "zh-TW"
  return DEFAULT_LOCALE
}

/** Whether the page should render dark: the saved theme, else the system one. */
export function resolvePreMountDark(): boolean {
  const { theme } = readPersistedSettings()
  if (theme === "dark") return true
  if (theme === "light") return false
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
}
