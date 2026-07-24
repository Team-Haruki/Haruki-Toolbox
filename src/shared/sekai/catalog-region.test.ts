import { describe, expect, it } from "bun:test"

const storageStub = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
}
Object.defineProperty(globalThis, "localStorage", { value: storageStub, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storageStub, configurable: true })

const { resolveEffectiveCatalogRegion } = await import("./catalog-region")

describe("resolveEffectiveCatalogRegion", () => {
  it("uses the account server in follow mode", () => {
    expect(resolveEffectiveCatalogRegion("follow", "jp", "cn")).toBe("cn")
  })

  it("falls back to the manual region in follow mode without an account", () => {
    expect(resolveEffectiveCatalogRegion("follow", "tw", null)).toBe("tw")
    expect(resolveEffectiveCatalogRegion("follow", "jp", undefined)).toBe("jp")
  })

  it("ignores the account server in manual mode", () => {
    expect(resolveEffectiveCatalogRegion("manual", "en", "cn")).toBe("en")
  })
})
