import { describe, expect, it } from "bun:test"
import {
  isKratosSettingsSection,
  normalizeKratosSettingsSection,
  resolveKnownKratosSettingsSection,
} from "./kratos-settings-section"

describe("normalizeKratosSettingsSection", () => {
  it("folds aliases onto the canonical sections", () => {
    expect(normalizeKratosSettingsSection("email")).toBe("profile")
    expect(normalizeKratosSettingsSection(" Security ")).toBe("mfa")
    expect(normalizeKratosSettingsSection("social")).toBe("oidc")
    expect(normalizeKratosSettingsSection("PASSWORD")).toBe("password")
  })

  it("passes unknown group names through and drops non-strings", () => {
    expect(normalizeKratosSettingsSection("totp")).toBe("totp")
    expect(normalizeKratosSettingsSection(undefined)).toBe("")
    expect(normalizeKratosSettingsSection(["mfa"])).toBe("")
  })
})

describe("resolveKnownKratosSettingsSection", () => {
  it("falls back to profile for unknown or empty values", () => {
    expect(resolveKnownKratosSettingsSection("")).toBe("profile")
    expect(resolveKnownKratosSettingsSection("totp")).toBe("profile")
    expect(resolveKnownKratosSettingsSection("security")).toBe("mfa")
    expect(isKratosSettingsSection("oidc")).toBe(true)
    expect(isKratosSettingsSection("lookup_secret")).toBe(false)
  })
})
