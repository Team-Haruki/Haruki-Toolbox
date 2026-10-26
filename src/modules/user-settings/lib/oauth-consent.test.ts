import { describe, expect, it } from "bun:test"
import { buildSwitchAccountAuthorizeUrl, isConsentSubjectMismatch } from "./oauth-consent"

describe("isConsentSubjectMismatch", () => {
  it("accepts a subject equal to the Kratos identity id or the user id", () => {
    expect(isConsentSubjectMismatch("kratos-1", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(false)
    expect(isConsentSubjectMismatch("user-1", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(false)
    expect(isConsentSubjectMismatch(" kratos-1 ", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(false)
  })

  it("flags a subject that matches neither id", () => {
    expect(isConsentSubjectMismatch("kratos-2", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(true)
    expect(isConsentSubjectMismatch("user-2", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(true)
  })

  it("never flags without a subject or without a known Kratos identity id", () => {
    expect(isConsentSubjectMismatch("", { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(false)
    expect(isConsentSubjectMismatch(undefined, { userId: "user-1", kratosIdentityId: "kratos-1" })).toBe(false)
    // Cached session before the Kratos session was read: the subject may be the unknown identity id.
    expect(isConsentSubjectMismatch("kratos-1", { userId: "user-1", kratosIdentityId: null })).toBe(false)
    expect(isConsentSubjectMismatch("kratos-1", { userId: null, kratosIdentityId: undefined })).toBe(false)
  })
})

describe("buildSwitchAccountAuthorizeUrl", () => {
  it("keeps the client's authorize request and forces a fresh login", () => {
    const url = buildSwitchAccountAuthorizeUrl(
      "https://auth.example/oauth2/auth?client_id=web&state=abc&code_challenge=xyz&redirect_uri=https%3A%2F%2Fapp.example%2Fcb"
    )
    expect(url).not.toBeNull()
    const parsed = new URL(url ?? "")
    expect(parsed.origin + parsed.pathname).toBe("https://auth.example/oauth2/auth")
    expect(parsed.searchParams.get("client_id")).toBe("web")
    expect(parsed.searchParams.get("state")).toBe("abc")
    expect(parsed.searchParams.get("code_challenge")).toBe("xyz")
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://app.example/cb")
    expect(parsed.searchParams.get("prompt")).toBe("login")
  })

  it("merges with an existing prompt and drops a conflicting none", () => {
    expect(new URL(buildSwitchAccountAuthorizeUrl("https://a.example/auth?prompt=consent") ?? "").searchParams.get("prompt")).toBe("consent login")
    expect(new URL(buildSwitchAccountAuthorizeUrl("https://a.example/auth?prompt=login") ?? "").searchParams.get("prompt")).toBe("login")
    expect(new URL(buildSwitchAccountAuthorizeUrl("https://a.example/auth?prompt=none") ?? "").searchParams.get("prompt")).toBe("login")
  })

  it("returns null for a missing, relative or non-http request URL", () => {
    expect(buildSwitchAccountAuthorizeUrl(undefined)).toBeNull()
    expect(buildSwitchAccountAuthorizeUrl("")).toBeNull()
    expect(buildSwitchAccountAuthorizeUrl("/oauth2/auth?client_id=web")).toBeNull()
    expect(buildSwitchAccountAuthorizeUrl("javascript:alert(1)")).toBeNull()
  })
})
