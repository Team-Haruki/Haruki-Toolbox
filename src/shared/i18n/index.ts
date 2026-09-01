import { createI18n } from "vue-i18n"

export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "zh-CN"

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as AppLocale)
}

/**
 * Locale messages ship as per-feature bundles: `core` (always loaded before
 * mount) plus lazily merged route bundles, so a typical visit downloads only
 * the strings its pages render. The router resolves needed bundles per
 * navigation (see ./bundles); dialogs reachable from anywhere ensure their
 * bundle on open.
 */
export const I18N_BUNDLES = [
  "core",
  "catalog",
  "deck",
  "rank",
  "tools",
  "user-settings",
  "admin",
  "tickets",
  "public-pages",
] as const
export type I18nBundle = (typeof I18N_BUNDLES)[number]

type BundleLoader = () => Promise<{ default: Record<string, unknown> }>

const bundleLoaders: Record<AppLocale, Record<I18nBundle, BundleLoader>> = {
  "zh-CN": {
    "core": () => import("@/shared/i18n/messages/zh-CN/zh-CN-core"),
    "catalog": () => import("@/shared/i18n/messages/zh-CN/zh-CN-catalog"),
    "deck": () => import("@/shared/i18n/messages/zh-CN/zh-CN-deck"),
    "rank": () => import("@/shared/i18n/messages/zh-CN/zh-CN-rank"),
    "tools": () => import("@/shared/i18n/messages/zh-CN/zh-CN-tools"),
    "user-settings": () => import("@/shared/i18n/messages/zh-CN/zh-CN-user-settings"),
    "admin": () => import("@/shared/i18n/messages/zh-CN/zh-CN-admin"),
    "tickets": () => import("@/shared/i18n/messages/zh-CN/zh-CN-tickets"),
    "public-pages": () => import("@/shared/i18n/messages/zh-CN/zh-CN-public-pages"),
  },
  "zh-TW": {
    "core": () => import("@/shared/i18n/messages/zh-TW/zh-TW-core"),
    "catalog": () => import("@/shared/i18n/messages/zh-TW/zh-TW-catalog"),
    "deck": () => import("@/shared/i18n/messages/zh-TW/zh-TW-deck"),
    "rank": () => import("@/shared/i18n/messages/zh-TW/zh-TW-rank"),
    "tools": () => import("@/shared/i18n/messages/zh-TW/zh-TW-tools"),
    "user-settings": () => import("@/shared/i18n/messages/zh-TW/zh-TW-user-settings"),
    "admin": () => import("@/shared/i18n/messages/zh-TW/zh-TW-admin"),
    "tickets": () => import("@/shared/i18n/messages/zh-TW/zh-TW-tickets"),
    "public-pages": () => import("@/shared/i18n/messages/zh-TW/zh-TW-public-pages"),
  },
  "en-US": {
    "core": () => import("@/shared/i18n/messages/en-US/en-US-core"),
    "catalog": () => import("@/shared/i18n/messages/en-US/en-US-catalog"),
    "deck": () => import("@/shared/i18n/messages/en-US/en-US-deck"),
    "rank": () => import("@/shared/i18n/messages/en-US/en-US-rank"),
    "tools": () => import("@/shared/i18n/messages/en-US/en-US-tools"),
    "user-settings": () => import("@/shared/i18n/messages/en-US/en-US-user-settings"),
    "admin": () => import("@/shared/i18n/messages/en-US/en-US-admin"),
    "tickets": () => import("@/shared/i18n/messages/en-US/en-US-tickets"),
    "public-pages": () => import("@/shared/i18n/messages/en-US/en-US-public-pages"),
  },
}

const loadedBundles: Record<AppLocale, Set<I18nBundle>> = {
  "zh-CN": new Set(),
  "zh-TW": new Set(),
  "en-US": new Set(),
}
const pendingBundles = new Map<string, Promise<void>>()

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
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

async function loadBundle(locale: AppLocale, bundle: I18nBundle): Promise<void> {
  if (loadedBundles[locale].has(bundle)) {
    return
  }

  const key = `${locale}:${bundle}`
  const pending = pendingBundles.get(key)
  if (pending) {
    return pending
  }

  const promise = bundleLoaders[locale][bundle]()
    .then((mod) => {
      i18n.global.mergeLocaleMessage(locale, mod.default)
      loadedBundles[locale].add(bundle)
    })
    .finally(() => {
      pendingBundles.delete(key)
    })
  pendingBundles.set(key, promise)
  return promise
}

/**
 * Loads the given bundles for the active locale (and, in the background, for
 * the fallback locale so missing-key lookups can resolve).
 */
export async function ensureI18nBundles(bundles: readonly I18nBundle[]): Promise<void> {
  const locale = readGlobalLocale()
  await Promise.all(bundles.map((bundle) => loadBundle(locale, bundle)))

  if (locale !== DEFAULT_LOCALE) {
    void Promise.all(bundles.map((bundle) => loadBundle(DEFAULT_LOCALE, bundle)))
  }
}

export async function setI18nLocale(locale: AppLocale) {
  // Carry over every bundle any locale has loaded so the switched-to locale
  // renders all currently visible strings.
  const needed = new Set<I18nBundle>(["core"])
  for (const supported of SUPPORTED_LOCALES) {
    for (const bundle of loadedBundles[supported]) {
      needed.add(bundle)
    }
  }

  await Promise.all([...needed].map((bundle) => loadBundle(locale, bundle)))
  writeGlobalLocale(locale)

  if (locale !== DEFAULT_LOCALE) {
    void Promise.all([...needed].map((bundle) => loadBundle(DEFAULT_LOCALE, bundle)))
  }
}

export function getI18nLocale(): AppLocale {
  return readGlobalLocale()
}

export function translate(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params) as string
}

syncDocumentLanguage(DEFAULT_LOCALE)
