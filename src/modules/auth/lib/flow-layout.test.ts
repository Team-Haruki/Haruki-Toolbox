import { describe, expect, it } from "bun:test"
import { orderKratosActions } from "./action-hierarchy"
import { layoutKratosFlow } from "./flow-layout"

interface Field {
  name: string
  group: string
}

interface Action {
  group: string
  name: string
  value: string
  labelId?: number | null
}

const field = (name: string, group = "default"): Field => ({ name, group })
const method = (group: string, value = group, labelId: number | null = null): Action => ({ group, name: "method", value, labelId })
const social = (value: string): Action => ({ group: "oidc", name: "provider", value, labelId: 1010002 })

function layout(fields: Field[], actions: Action[]) {
  const ordered = orderKratosActions(actions).map(({ action, role }) => ({ ...action, role }))
  return layoutKratosFlow(fields, ordered)
}

const names = (fields: readonly Field[]) => fields.map((entry) => entry.name)

describe("layoutKratosFlow", () => {
  it("puts identifier and password over the one primary button and lists passkey and social after it", () => {
    const result = layout(
      [field("identifier"), field("password", "password")],
      [
        social("apple"),
        social("google"),
        { group: "passkey", name: "passkey_login_trigger", value: "", labelId: 1010021 },
        method("password", "password", 1010022),
      ],
    )

    expect(result.primary?.action?.value).toBe("password")
    expect(names(result.primary?.fields ?? [])).toEqual(["identifier", "password"])
    expect(result.alternatives).toEqual([])
    expect(result.shortcuts.map((action) => action.role)).toEqual(["passkey", "social", "social"])
    expect(result.shortcuts.map((action) => action.value)).toEqual(["", "apple", "google"])
    expect(result.resend).toEqual([])
    expect(result.back).toEqual([])
  })

  it("gives every second-factor method its own input", () => {
    const result = layout(
      [field("totp_code", "totp"), field("lookup_secret", "lookup_secret")],
      [method("totp"), method("lookup_secret")],
    )

    expect(result.primary?.action?.value).toBe("totp")
    expect(names(result.primary?.fields ?? [])).toEqual(["totp_code"])
    expect(result.alternatives).toHaveLength(1)
    expect(result.alternatives[0]?.action?.value).toBe("lookup_secret")
    expect(names(result.alternatives[0]?.fields ?? [])).toEqual(["lookup_secret"])
  })

  it("matches a field to the group named after the method value", () => {
    // The button sits in the default group but posts `method=code`.
    const result = layout(
      [field("code", "code"), field("identifier")],
      [method("password"), { group: "default", name: "method", value: "code" }],
    )

    expect(names(result.primary?.fields ?? [])).toEqual(["identifier"])
    expect(names(result.alternatives[0]?.fields ?? [])).toEqual(["code"])
  })

  it("keeps Resend apart from the code submit and Back last", () => {
    const recovery = layout(
      [field("code", "code")],
      [method("code", "code", 1070009), { group: "code", name: "email", value: "kanade@example.com", labelId: 1070008 }],
    )
    expect(recovery.primary?.action?.name).toBe("method")
    expect(names(recovery.primary?.fields ?? [])).toEqual(["code"])
    expect(recovery.resend.map((action) => action.value)).toEqual(["kanade@example.com"])

    const registration = layout(
      [field("password", "password")],
      [
        social("google"),
        method("password", "password", 1040001),
        { group: "profile", name: "screen", value: "previous", labelId: 1040008 },
      ],
    )
    expect(registration.back.map((action) => action.value)).toEqual(["previous"])
    expect(registration.shortcuts.map((action) => action.value)).toEqual(["google"])
  })

  it("hands a field nobody claims to the primary method", () => {
    const result = layout([field("captcha", "captcha"), field("traits.email")], [method("profile")])

    expect(names(result.primary?.fields ?? [])).toEqual(["captcha", "traits.email"])
  })

  it("keeps fields in a block of their own when the form has no method button", () => {
    const result = layout(
      [field("identifier")],
      [{ group: "passkey", name: "passkey_login_trigger", value: "", labelId: 1010021 }],
    )

    expect(result.primary).toEqual({ action: null, fields: [field("identifier")] })
    expect(result.shortcuts).toHaveLength(1)
  })

  it("has no primary block for a passkey-only re-authentication", () => {
    const result = layout([], [{ group: "passkey", name: "passkey_login_trigger", value: "", labelId: 1010021 }])

    expect(result.primary).toBeNull()
    expect(result.alternatives).toEqual([])
    expect(result.shortcuts).toHaveLength(1)
  })

  it("ignores blank groups and method values", () => {
    const result = layout(
      [field("code", " Code ")],
      [{ group: "", name: "method", value: "" }, { group: "CODE", name: "method", value: " code " }],
    )

    expect(result.primary?.fields).toEqual([])
    expect(names(result.alternatives[0]?.fields ?? [])).toEqual(["code"])
  })
})
