import { describe, expect, it } from "bun:test"

const storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
}

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: storage,
})
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: storage,
})

const { normalizeKratosFlowUrl } = await import("./kratos")

const kratosPublicUrl = "https://toolbox-auth.haruki.seiunx.com"

describe("kratos URL helpers", () => {
  it("upgrades same-host flow URLs to the configured public https origin", () => {
    expect(normalizeKratosFlowUrl(
      "http://toolbox-auth.haruki.seiunx.com/self-service/settings?flow=abc",
      { publicUrl: kratosPublicUrl }
    )).toBe("https://toolbox-auth.haruki.seiunx.com/self-service/settings?flow=abc")
  })

  it("upgrades nested Kratos return_to flow URLs", () => {
    const nestedSettingsUrl = "http://toolbox-auth.haruki.seiunx.com/self-service/settings/browser?return_to=https%3A%2F%2Fharuki.seiunx.com%2Fuser%2Fsettings"
    const loginUrl = `http://toolbox-auth.haruki.seiunx.com/self-service/login/browser?return_to=${encodeURIComponent(nestedSettingsUrl)}`
    const normalized = normalizeKratosFlowUrl(loginUrl, { publicUrl: kratosPublicUrl })
    const parsed = new URL(normalized)
    const nested = new URL(parsed.searchParams.get("return_to") ?? "")

    expect(parsed.origin).toBe(kratosPublicUrl)
    expect(nested.origin).toBe(kratosPublicUrl)
    expect(nested.searchParams.get("return_to")).toBe("https://haruki.seiunx.com/user/settings")
  })

  it("leaves other hosts unchanged", () => {
    expect(normalizeKratosFlowUrl(
      "http://example.com/self-service/settings?flow=abc",
      { publicUrl: kratosPublicUrl }
    )).toBe("http://example.com/self-service/settings?flow=abc")
  })
})
