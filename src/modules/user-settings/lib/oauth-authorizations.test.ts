import { describe, expect, test } from "bun:test"
import { oauthAuthorizationKey } from "./oauth-authorizations"

describe("oauthAuthorizationKey", () => {
  test("keys rows by consent request id", () => {
    expect(oauthAuthorizationKey({ clientId: "client-a", consentRequestId: "consent-1" }, 0)).toBe("consent-1")
  })

  test("gives two consents of the same client distinct keys", () => {
    const rows = [
      { clientId: "client-a", consentRequestId: "consent-1" },
      { clientId: "client-a", consentRequestId: "consent-2" },
    ]

    const keys = rows.map((row, index) => oauthAuthorizationKey(row, index))
    expect(keys).toEqual(["consent-1", "consent-2"])
  })

  test("falls back to client id and position when the id is missing or blank", () => {
    const rows = [
      { clientId: "client-a" },
      { clientId: "client-a", consentRequestId: "" },
      { clientId: "client-a", consentRequestId: "   " },
    ]

    const keys = rows.map((row, index) => oauthAuthorizationKey(row, index))
    expect(keys).toEqual(["client-a#0", "client-a#1", "client-a#2"])
    expect(new Set(keys).size).toBe(rows.length)
  })
})
