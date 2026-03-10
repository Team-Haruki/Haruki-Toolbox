import { createI18n } from "vue-i18n"
import { zhCN } from "@/shared/i18n/messages/zh-CN"
import { enUS } from "@/shared/i18n/messages/en-US"

export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "zh-CN"

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as AppLocale)
}

const messages = {
  "zh-CN": zhCN,
  "en-US": enUS,
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages,
  globalInjection: true,
})

export function setI18nLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
}

export function translate(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params) as string
}
