import { describe, expect, test } from "bun:test"
import { AVAILABLE_SCOPE_IDS, normalizeRedirectUris, toggleScopeSelection, validateClientPayload } from "./form"

describe("admin oauth form helpers", () => {
  test("toggleScopeSelection adds and removes scope ids", () => {
    const scopes = ["user:read"]
    const appended = toggleScopeSelection(scopes, "bindings:read", true)
    expect(appended).toEqual(["user:read", "bindings:read"])

    const removed = toggleScopeSelection(appended, "user:read", false)
    expect(removed).toEqual(["bindings:read"])
  })

  test("normalizeRedirectUris trims and removes empty values", () => {
    expect(normalizeRedirectUris(["  https://a.com/cb  ", "", "   "])).toEqual(["https://a.com/cb"])
  })

  test("validateClientPayload validates required fields", () => {
    const invalid = validateClientPayload({
      clientId: "",
      name: "",
      scopes: [],
      redirectUris: [],
    })
    expect("errorCode" in invalid).toBe(true)
    if ("errorCode" in invalid) {
      expect(invalid.errorCode).toBe("clientIdAndNameRequired")
    }

    const valid = validateClientPayload({
      clientId: "web-client",
      name: "Web Client",
      scopes: ["user:read"],
      redirectUris: [" https://a.com/callback "],
      postLogoutRedirectUris: [" https://a.com/logged-out ", ""],
    })
    expect("normalizedUris" in valid).toBe(true)
    if ("normalizedUris" in valid) {
      expect(valid.normalizedUris).toEqual(["https://a.com/callback"])
      expect(valid.normalizedPostLogoutUris).toEqual(["https://a.com/logged-out"])
    }
  })

  test("rejects profile/email scopes without openid", () => {
    const invalid = validateClientPayload({
      clientId: "web-client",
      name: "Web Client",
      scopes: ["profile", "email"],
      redirectUris: ["https://a.com/callback"],
    })
    expect("errorCode" in invalid && invalid.errorCode === "oidcScopeRequiresOpenid").toBe(true)

    const valid = validateClientPayload({
      clientId: "web-client",
      name: "Web Client",
      scopes: ["openid", "profile", "email"],
      redirectUris: ["https://a.com/callback"],
    })
    expect("normalizedUris" in valid).toBe(true)
  })

  test("available scopes include offline access and oidc scopes", () => {
    expect(AVAILABLE_SCOPE_IDS).toContain("offline_access")
    expect(AVAILABLE_SCOPE_IDS).toContain("openid")
    expect(AVAILABLE_SCOPE_IDS).toContain("profile")
    expect(AVAILABLE_SCOPE_IDS).toContain("email")
  })
})
