import { describe, expect, test } from "bun:test"
import { normalizeRedirectUris, toggleScopeSelection, validateClientPayload } from "./form"

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
    })
    expect("normalizedUris" in valid).toBe(true)
    if ("normalizedUris" in valid) {
      expect(valid.normalizedUris).toEqual(["https://a.com/callback"])
    }
  })
})
