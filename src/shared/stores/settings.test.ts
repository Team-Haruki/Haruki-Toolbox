import { describe, expect, it } from "bun:test"
import { createPinia, setActivePinia } from "pinia"
import {
  buildAssetEndpointProbeUrl,
  normalizeAssetEndpointLatencyResults,
  normalizeAssetEndpointPreference,
  useSettingsStore,
} from "./settings"

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
        global: { status: "ok", elapsedMs: 20, checkedAt: 123 },
        china_cdn: { status: "ok", elapsedMs: 30, checkedAt: 123 },
      }

      await store.initAssetEndpointPreference()
      await store.initAssetEndpointPreference()

      expect(requests).toHaveLength(2)
      expect(requests.every((url) => url.includes("/asset-probe.png?_latency="))).toBe(true)
      // A persisted manual choice survives the boot-time re-test; the
      // fastest endpoint is only auto-applied for users who never chose.
      expect(store.assetEndpointManuallySelected).toBe(true)
      expect(store.preferredAssetEndpoint).toBe("global")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("defaults to the China CDN", () => {
    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.preferredAssetEndpoint).toBe("china_cdn")
    expect(store.currentAssetEndpoint).toBe("china_cdn")
    expect(Object.keys(store.assetEndpointLatencyResults).sort()).toEqual(["china_cdn", "global"])
  })
})

describe("asset endpoint migration", () => {
  it("keeps global and moves everything else to the China CDN", () => {
    expect(normalizeAssetEndpointPreference("global")).toBe("global")
    expect(normalizeAssetEndpointPreference("china_cdn")).toBe("china_cdn")
    expect(normalizeAssetEndpointPreference("china")).toBe("china_cdn")
    expect(normalizeAssetEndpointPreference(undefined)).toBe("china_cdn")
    expect(normalizeAssetEndpointPreference("something-else")).toBe("china_cdn")
  })

  it("rebuilds saved latency results without the retired route", () => {
    expect(normalizeAssetEndpointLatencyResults({
      china: { status: "ok", elapsedMs: 10, checkedAt: 1 },
      global: { status: "ok", elapsedMs: 20, checkedAt: 2 },
      china_cdn: { status: "failed", elapsedMs: null, checkedAt: 3 },
    })).toEqual({
      china_cdn: { status: "failed", elapsedMs: null, checkedAt: 3 },
      global: { status: "ok", elapsedMs: 20, checkedAt: 2 },
    })
    expect(normalizeAssetEndpointLatencyResults({ global: { status: "weird" } })).toEqual({
      china_cdn: { status: "pending", elapsedMs: null, checkedAt: null },
      global: { status: "pending", elapsedMs: null, checkedAt: null },
    })
    expect(normalizeAssetEndpointLatencyResults(null).global.status).toBe("pending")
  })

  it("migrates a saved 'china' choice on boot and keeps the manual flag", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    let releaseProbes: () => void = () => {}
    const probesHeld = new Promise<void>((resolve) => (releaseProbes = resolve))
    globalThis.fetch = (async (input: string | URL | Request) => {
      requests.push(String(input))
      await probesHeld
      return new Response(null, { status: 200 })
    }) as typeof fetch

    try {
      setActivePinia(createPinia())
      const store = useSettingsStore()
      // what pinia-plugin-persistedstate restores from a pre-migration save
      store.$patch((state) => {
        Object.assign(state, {
          preferredAssetEndpoint: "china",
          assetEndpointManuallySelected: true,
          assetEndpointLatencyMeasuredAt: 123,
          assetEndpointLatencyResults: {
            china: { status: "ok", elapsedMs: 10, checkedAt: 123 },
            global: { status: "ok", elapsedMs: 200, checkedAt: 123 },
            china_cdn: { status: "ok", elapsedMs: 30, checkedAt: 123 },
          },
        })
      })
      expect(store.currentAssetEndpoint).toBe("china_cdn")

      const init = store.initAssetEndpointPreference()
      // migrated before the re-test starts
      expect(store.preferredAssetEndpoint).toBe("china_cdn")
      expect(store.assetEndpointManuallySelected).toBe(true)
      releaseProbes()
      await init

      expect(Object.keys(store.assetEndpointLatencyResults).sort()).toEqual(["china_cdn", "global"])
      expect(requests).toHaveLength(2)
      expect(requests.some((url) => url.startsWith("https://sekai-assets.haruki.seiunx.com"))).toBe(false)
      expect(store.preferredAssetEndpoint).toBe("china_cdn")
      expect(store.assetEndpointManuallySelected).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("keeps a saved global choice", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = ((input: string | URL | Request) => {
      requests.push(String(input))
      return Promise.resolve(new Response(null, { status: 200 }))
    }) as typeof fetch
    try {
      setActivePinia(createPinia())
      const store = useSettingsStore()
      store.$patch((state) => {
        Object.assign(state, { preferredAssetEndpoint: "global", assetEndpointManuallySelected: true })
      })
      await store.initAssetEndpointPreference()
      expect(requests).toHaveLength(2)
      expect(store.preferredAssetEndpoint).toBe("global")
      expect(store.assetEndpointManuallySelected).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
