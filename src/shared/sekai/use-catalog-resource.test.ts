import { describe, expect, test } from "bun:test"
import { resolveCatalogResourceWarning } from "./use-catalog-resource"

describe("resolveCatalogResourceWarning", () => {
  test("prefers the resource's own load warning", () => {
    expect(resolveCatalogResourceWarning({
      hasData: true,
      loadWarning: "Failed to fetch manifest",
      regionError: "other",
    })).toBe("Failed to fetch manifest")
  })

  test("surfaces the region's failed background refresh while cached data is on screen", () => {
    expect(resolveCatalogResourceWarning({
      hasData: true,
      loadWarning: null,
      regionError: "Timed out fetching version",
    })).toBe("Timed out fetching version")
  })

  test("is silent without data (the error state owns that case) or without a failure", () => {
    expect(resolveCatalogResourceWarning({ hasData: false, loadWarning: null, regionError: "down" })).toBeNull()
    expect(resolveCatalogResourceWarning({ hasData: true, loadWarning: null, regionError: null })).toBeNull()
    expect(resolveCatalogResourceWarning({ hasData: true, loadWarning: "", regionError: "" })).toBeNull()
  })
})
