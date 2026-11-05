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

const { readCatalogRegionQuery, resolveEffectiveCatalogRegion } = await import("./catalog-region")

describe("readCatalogRegionQuery", () => {
  it("reads a known server from a shared catalog link", () => {
    expect(readCatalogRegionQuery({ region: "tw" })).toBe("tw")
    expect(readCatalogRegionQuery({ region: ["cn", "jp"], chars: "1" })).toBe("cn")
  })

  it("ignores a missing or unknown region", () => {
    expect(readCatalogRegionQuery({})).toBeNull()
    expect(readCatalogRegionQuery({ region: "mars" })).toBeNull()
    expect(readCatalogRegionQuery({ region: null })).toBeNull()
  })
})

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
