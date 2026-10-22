import { describe, expect, it } from "bun:test"
import { KRATOS_RESEND_CODE_LABEL_ID } from "./kratos-labels"
import {
  resolveFieldsToValidate,
  resolveValidationSubmitter,
  type KratosSubmitterInfo,
  type KratosValidatableField,
} from "./kratos-validation"

function field(name: string, group: string, overrides: Partial<KratosValidatableField> = {}): KratosValidatableField {
  return { name, group, type: "text", required: true, disabled: false, ...overrides }
}

function submit(value: string, group = value, extra: Partial<KratosSubmitterInfo> = {}): KratosSubmitterInfo {
  return { name: "method", value, group, labelId: null, ...extra }
}

const LOGIN_FIELDS = [field("identifier", "default"), field("password", "password", { type: "password" })]

describe("resolveFieldsToValidate", () => {
  it("validates the default group plus the method's own group", () => {
    expect(resolveFieldsToValidate(submit("password"), LOGIN_FIELDS)).toEqual(["identifier", "password"])
  })

  it("lets OIDC provider buttons through with empty credentials", () => {
    const google: KratosSubmitterInfo = { name: "provider", value: "google", group: "oidc" }
    expect(resolveFieldsToValidate(google, LOGIN_FIELDS)).toEqual([])
  })

  it("never blocks non-method submits such as passkey/webauthn or unnamed buttons", () => {
    expect(resolveFieldsToValidate({ name: "passkey_login_trigger", value: "", group: "passkey" }, LOGIN_FIELDS)).toEqual([])
    expect(resolveFieldsToValidate({ name: "webauthn_login_trigger", value: "", group: "webauthn" }, LOGIN_FIELDS)).toEqual([])
    expect(resolveFieldsToValidate({ name: "", value: "", group: "default" }, LOGIN_FIELDS)).toEqual([])
  })

  it("checks only the chosen factor on the MFA page", () => {
    const mfaFields = [field("totp_code", "totp"), field("lookup_secret", "lookup_secret")]
    expect(resolveFieldsToValidate(submit("totp"), mfaFields)).toEqual(["totp_code"])
    expect(resolveFieldsToValidate(submit("lookup_secret"), mfaFields)).toEqual(["lookup_secret"])
  })

  it("skips validation for the resend-code button but keeps it for the verify submit", () => {
    const sentFields = [field("code", "code")]
    const resend = submit("code", "code", { labelId: KRATOS_RESEND_CODE_LABEL_ID })
    const verify = submit("code", "code", { labelId: 1070005 })
    expect(resolveFieldsToValidate(resend, sentFields)).toEqual([])
    expect(resolveFieldsToValidate(verify, sentFields)).toEqual(["code"])
  })

  it("leaves the other method's inputs alone when a form offers several methods", () => {
    // Login choose_method: identifier (default) + password; "continue with code" only needs the identifier.
    expect(resolveFieldsToValidate(submit("code"), LOGIN_FIELDS)).toEqual(["identifier"])
    // Registration with password + code methods.
    const registrationFields = [field("traits.email", "default"), field("traits.name", "default", { required: false }), field("password", "password")]
    expect(resolveFieldsToValidate(submit("code"), registrationFields)).toEqual(["traits.email"])
    expect(resolveFieldsToValidate(submit("password"), registrationFields)).toEqual(["traits.email", "password"])
  })

  it("treats the method's credential inputs as required even when Kratos omits the flag", () => {
    const fields = [field("identifier", "default", { required: false }), field("password", "password", { required: false })]
    expect(resolveFieldsToValidate(submit("password"), fields)).toEqual(["identifier", "password"])
    // ...but not for a method that does not use them.
    expect(resolveFieldsToValidate(submit("totp"), fields)).toEqual([])
  })

  it("falls back to the method value when the submit node carries no group", () => {
    expect(resolveFieldsToValidate(submit("password", ""), LOGIN_FIELDS)).toEqual(["identifier", "password"])
    expect(resolveFieldsToValidate(submit("Password", "default"), LOGIN_FIELDS)).toEqual(["identifier", "password"])
  })

  it("ignores disabled inputs and trigger buttons", () => {
    const fields = [
      field("identifier", "default", { disabled: true }),
      field("passkey_login_trigger", "passkey", { type: "button" }),
      field("password", "password"),
    ]
    expect(resolveFieldsToValidate(submit("password"), fields)).toEqual(["password"])
  })

  it("checks the default group only when no submitter can be resolved", () => {
    expect(resolveFieldsToValidate(null, LOGIN_FIELDS)).toEqual(["identifier"])
    expect(resolveFieldsToValidate(undefined, [field("password", "password")])).toEqual([])
  })
})

describe("resolveValidationSubmitter", () => {
  it("keeps the submitter the browser reported", () => {
    const google: KratosSubmitterInfo = { name: "provider", value: "google", group: "oidc" }
    expect(resolveValidationSubmitter(google, [submit("password"), google])).toBe(google)
  })

  it("uses the only method button when the event has no submitter", () => {
    const password = submit("password")
    const google: KratosSubmitterInfo = { name: "provider", value: "google", group: "oidc" }
    expect(resolveValidationSubmitter(null, [google, password])).toBe(password)
  })

  it("ignores the resend button when looking for that single method", () => {
    const verify = submit("code", "code", { labelId: 1070005 })
    const resend = submit("code", "code", { labelId: KRATOS_RESEND_CODE_LABEL_ID })
    expect(resolveValidationSubmitter(undefined, [verify, resend])).toBe(verify)
  })

  it("gives up when several methods could have been meant", () => {
    expect(resolveValidationSubmitter(null, [submit("totp"), submit("lookup_secret")])).toBeNull()
    expect(resolveValidationSubmitter(null, [])).toBeNull()
  })
})
