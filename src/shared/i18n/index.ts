import { createI18n } from "vue-i18n"
import { zhCN } from "@/shared/i18n/messages/zh-CN"

export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "zh-CN"

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as AppLocale)
}

const messages = {
  "zh-CN": zhCN,
}

const loadedLocales = new Set<AppLocale>(["zh-CN"])

const localeLoaders: Record<AppLocale, () => Promise<Record<string, unknown>>> = {
  "zh-CN": async () => zhCN,
  "en-US": async () => (await import("@/shared/i18n/messages/en-US")).enUS,
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages,
  globalInjection: true,
})

function syncDocumentLanguage(locale: AppLocale) {
  if (typeof document === "undefined") {
    return
  }

  document.documentElement.lang = locale
}

function readGlobalLocale(): AppLocale {
  const globalLocale = i18n.global.locale
  return (typeof globalLocale === "string" ? globalLocale : globalLocale.value) as AppLocale
}

function writeGlobalLocale(locale: AppLocale) {
  const globalLocale = i18n.global.locale
  if (typeof globalLocale === "string") {
    ;(i18n.global as typeof i18n.global & { locale: AppLocale }).locale = locale
    syncDocumentLanguage(locale)
    return
  }

  globalLocale.value = locale
  syncDocumentLanguage(locale)
}

export async function loadI18nLocale(locale: AppLocale) {
  if (loadedLocales.has(locale)) {
    return
  }

  const message = await localeLoaders[locale]()
  i18n.global.setLocaleMessage(locale, message)
  loadedLocales.add(locale)
}

export async function setI18nLocale(locale: AppLocale) {
  await loadI18nLocale(locale)
  writeGlobalLocale(locale)
}

export function getI18nLocale(): AppLocale {
  return readGlobalLocale()
}

export function translate(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params) as string
}

syncDocumentLanguage(DEFAULT_LOCALE)
