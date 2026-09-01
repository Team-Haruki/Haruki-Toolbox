import { describe, expect, it } from "bun:test"

const BUNDLE_NAMES = ["core", "catalog", "deck", "rank", "tools", "user-settings", "admin", "tickets", "public-pages"] as const

async function loadMerged(locale: "zh-CN" | "zh-TW" | "en-US"): Promise<Record<string, unknown>> {
  const merged: Record<string, unknown> = {}
  for (const bundle of BUNDLE_NAMES) {
    const mod = await import(`./${locale}/${locale}-${bundle}.ts`)
    for (const [key, value] of Object.entries(mod.default)) {
      expect(merged[key]).toBeUndefined() // namespaces never overlap between bundles
      merged[key] = value
    }
  }
  return merged
}

function collectKeyPaths(value: unknown, prefix: string, out: Set<string>) {
  if (value == null || typeof value !== "object") {
    out.add(prefix)
    return
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectKeyPaths(child, prefix ? `${prefix}.${key}` : key, out)
  }
}

describe("i18n bundles", () => {
  it("cover the same key set in every locale", async () => {
    const zh = await loadMerged("zh-CN")
    const tw = await loadMerged("zh-TW")
    const en = await loadMerged("en-US")

    const zhKeys = new Set<string>()
    const twKeys = new Set<string>()
    const enKeys = new Set<string>()
    collectKeyPaths(zh, "", zhKeys)
    collectKeyPaths(tw, "", twKeys)
    collectKeyPaths(en, "", enKeys)

    expect([...zhKeys].filter((key) => !enKeys.has(key))).toEqual([])
    expect([...enKeys].filter((key) => !zhKeys.has(key))).toEqual([])
    expect([...zhKeys].filter((key) => !twKeys.has(key))).toEqual([])
    expect([...twKeys].filter((key) => !zhKeys.has(key))).toEqual([])
    expect(zhKeys.size).toBeGreaterThan(3000)
  })

  it("keep well-known keys addressable", async () => {
    const zh = await loadMerged("zh-CN")
    const get = (path: string) => path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key as never], zh)
    expect(get("app.name")).toBeTruthy()
    expect(get("navigation.groups.projectSekai")).toBeTruthy()
    expect(get("deckRecommend.form.account")).toBeTruthy()
    expect(get("admin.nav.dashboard")).toBeTruthy()
    expect(get("userSettings.sekaiData.regionCacheTitle")).toBeTruthy()
    expect(get("tools.uploadData.tabs.ios")).toBeTruthy()
    expect(get("legal.title") ?? get("legal.privacy") ?? Object.keys((zh.legal ?? {}) as object).length).toBeTruthy()
  })
})
