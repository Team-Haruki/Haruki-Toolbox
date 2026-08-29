import { describe, expect, it } from "bun:test"
import { createPinia, setActivePinia } from "pinia"
import { buildAssetEndpointProbeUrl, useSettingsStore } from "./settings"

describe("settings endpoint helpers", () => {
  it("builds a cache-busting game asset probe URL", () => {
    expect(buildAssetEndpointProbeUrl("https://assets.example.com/", 123)).toBe(
      "https://assets.example.com/asset-probe.png?_latency=123",
    )
    expect(buildAssetEndpointProbeUrl("https://assets.example.com///", 123)).toBe(
      "https://assets.example.com/asset-probe.png?_latency=123",
    )
  })

  it("uses a different URL for a different measurement", () => {
    expect(buildAssetEndpointProbeUrl("https://assets.example.com", 456)).not.toBe(
      buildAssetEndpointProbeUrl("https://assets.example.com", 789),
    )
  })

  it("re-tests every endpoint once per page session despite persisted results", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = ((input: string | URL | Request) => {
      requests.push(String(input))
      return Promise.resolve(new Response(null, { status: 200 }))
    }) as typeof fetch

    try {
      setActivePinia(createPinia())
      const store = useSettingsStore()
      store.preferredAssetEndpoint = "global"
      store.assetEndpointManuallySelected = true
      store.assetEndpointLatencyMeasuredAt = 123
      store.assetEndpointLatencyResults = {
        china: { status: "ok", elapsedMs: 10, checkedAt: 123 },
        global: { status: "ok", elapsedMs: 20, checkedAt: 123 },
        china_cdn: { status: "ok", elapsedMs: 30, checkedAt: 123 },
      }

      await store.initAssetEndpointPreference()
      await store.initAssetEndpointPreference()

      expect(requests).toHaveLength(3)
      expect(requests.every((url) => url.includes("/asset-probe.png?_latency="))).toBe(true)
      // A persisted manual choice survives the boot-time re-test; the
      // fastest endpoint is only auto-applied for users who never chose.
      expect(store.assetEndpointManuallySelected).toBe(true)
      expect(store.preferredAssetEndpoint).toBe("global")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
