import { afterEach, describe, expect, it } from "bun:test"
import { resolvePreMountDark, resolvePreMountLocale } from "@/lib/pre-mount-preferences"

const store = new Map<string, string>()
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
const originalMatchMedia = Object.getOwnPropertyDescriptor(globalThis, "matchMedia")

function install({ settings, language, prefersDark }: { settings?: unknown; language?: string; prefersDark?: boolean }) {
  store.clear()
  if (settings !== undefined) store.set("settings", typeof settings === "string" ? settings : JSON.stringify(settings))
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => store.get(key) ?? null } })
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { language: language ?? "zh-CN" } })
  Object.defineProperty(globalThis, "matchMedia", { configurable: true, value: () => ({ matches: prefersDark ?? false }) })
}

function restore(name: string, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor)
  else delete (globalThis as Record<string, unknown>)[name]
}

afterEach(() => {
  restore("localStorage", originalLocalStorage)
  restore("navigator", originalNavigator)
  restore("matchMedia", originalMatchMedia)
})

describe("pre-mount preferences", () => {
  it("prefers the persisted locale over the device language", () => {
    install({ settings: { locale: "en-US" }, language: "zh-CN" })
    expect(resolvePreMountLocale()).toBe("en-US")
  })

  it("falls back to the device language, then the default", () => {
    install({ language: "en-GB" })
    expect(resolvePreMountLocale()).toBe("en-US")
    install({ language: "zh-Hant-TW" })
    expect(resolvePreMountLocale()).toBe("zh-TW")
    install({ language: "ja-JP" })
    expect(resolvePreMountLocale()).toBe("zh-CN")
  })

  it("ignores corrupt or unknown persisted values", () => {
    install({ settings: "{not json", language: "en-US" })
    expect(resolvePreMountLocale()).toBe("en-US")
    install({ settings: { locale: "fr-FR" }, language: "zh-TW" })
    expect(resolvePreMountLocale()).toBe("zh-TW")
  })

  it("resolves dark mode from the saved theme, else the system", () => {
    install({ settings: { theme: "dark" }, prefersDark: false })
    expect(resolvePreMountDark()).toBe(true)
    install({ settings: { theme: "light" }, prefersDark: true })
    expect(resolvePreMountDark()).toBe(false)
    install({ settings: { theme: "system" }, prefersDark: true })
    expect(resolvePreMountDark()).toBe(true)
    install({ prefersDark: false })
    expect(resolvePreMountDark()).toBe(false)
  })
})
