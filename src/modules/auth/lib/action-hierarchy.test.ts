import { describe, expect, it } from "bun:test"
import { classifyKratosAction, kratosActionVariant, orderKratosActions } from "./action-hierarchy"

const social = (value: string) => ({ group: "oidc", name: "provider", value, labelId: 1010002 })
const method = (group: string, value = group, labelId: number | null = null) => ({ group, name: "method", value, labelId })

describe("classifyKratosAction", () => {
  it("recognises social, passkey, back and resend buttons", () => {
    expect(classifyKratosAction(social("google"))).toBe("social")
    expect(classifyKratosAction({ group: "passkey", name: "passkey_login_trigger", value: "" })).toBe("passkey")
    expect(classifyKratosAction({ group: "profile", name: "screen", value: "previous" })).toBe("back")
    expect(classifyKratosAction({ group: "profile", name: "x", value: "", labelId: 1040008 })).toBe("back")
    expect(classifyKratosAction({ group: "code", name: "email", value: "a@b.c", labelId: 1070008 })).toBe("resend")
    expect(classifyKratosAction({ group: "code", name: "email", value: "a@b.c" })).toBe("resend")
  })

  it("treats every other submit as a method submit", () => {
    expect(classifyKratosAction(method("password"))).toBe("primary")
    expect(classifyKratosAction(method("profile"))).toBe("primary")
  })
})

describe("orderKratosActions", () => {
  it("puts the method submit first and social providers after it, as on login", () => {
    // Registration lists the providers before the profile submit.
    const ordered = orderKratosActions([social("apple"), social("google"), method("profile")])
    expect(ordered.map((entry) => entry.action.value)).toEqual(["profile", "apple", "google"])
    expect(ordered.map((entry) => entry.variant)).toEqual(["default", "outline", "outline"])
  })

  it("keeps one primary on the credential step: passkey and social outline, Back ghost", () => {
    const ordered = orderKratosActions([
      social("apple"),
      social("google"),
      { group: "passkey", name: "passkey_register_trigger", value: "", labelId: 1040007 },
      method("password", "password", 1040001),
      { group: "profile", name: "screen", value: "previous", labelId: 1040008 },
    ])
    expect(ordered.map((entry) => entry.role)).toEqual(["primary", "passkey", "social", "social", "back"])
    expect(ordered.map((entry) => entry.variant)).toEqual(["default", "outline", "outline", "outline", "ghost"])
    expect(ordered.filter((entry) => entry.variant === "default")).toHaveLength(1)
  })

  it("demotes a second method submit to an alternative (AAL2: authenticator vs backup code)", () => {
    const ordered = orderKratosActions([method("totp"), method("lookup_secret")])
    expect(ordered.map((entry) => entry.role)).toEqual(["primary", "alternative"])
    expect(ordered[1]?.variant).toBe("outline")
  })

  it("renders Resend as a link after the Continue submit", () => {
    const ordered = orderKratosActions([
      method("code", "code", 1070009),
      { group: "code", name: "email", value: "kanade@example.com", labelId: 1070008 },
    ])
    expect(ordered.map((entry) => entry.role)).toEqual(["primary", "resend"])
    expect(ordered[1]?.variant).toBe("link")
  })

  it("is stable within a role", () => {
    const ordered = orderKratosActions([social("apple"), social("google")])
    expect(ordered.map((entry) => entry.action.value)).toEqual(["apple", "google"])
  })
})

describe("kratosActionVariant", () => {
  it("maps every role to a button variant", () => {
    expect(kratosActionVariant("primary")).toBe("default")
    expect(kratosActionVariant("back")).toBe("ghost")
    expect(kratosActionVariant("resend")).toBe("link")
  })
})
