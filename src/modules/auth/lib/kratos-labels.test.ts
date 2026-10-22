import { describe, expect, it } from "bun:test"
import { resolveKratosInputLabelKeys, resolveKratosSubmitLabelKey } from "./kratos-labels"

describe("resolveKratosInputLabelKeys", () => {
  it("maps the well-known login nodes to the auth bundle", () => {
    expect(resolveKratosInputLabelKeys("login", "identifier")).toEqual({
      labelKey: "auth.login.emailLabel",
      placeholderKey: "auth.login.emailPlaceholder",
    })
    expect(resolveKratosInputLabelKeys("login", "password")?.labelKey).toBe("auth.login.passwordLabel")
    expect(resolveKratosInputLabelKeys("login", "totp_code")?.labelKey).toBe("auth.kratos.labels.totpCode")
  })

  it("uses flow-specific wording where the same node means something else", () => {
    expect(resolveKratosInputLabelKeys("registration", "password")?.labelKey).toBe("auth.register.passwordLabel")
    expect(resolveKratosInputLabelKeys("settings", "password")?.labelKey).toBe("auth.resetPassword.newPasswordLabel")
    expect(resolveKratosInputLabelKeys("registration", "traits.email")?.labelKey).toBe("auth.register.emailLabel")
  })

  it("leaves unknown nodes to the Kratos text", () => {
    expect(resolveKratosInputLabelKeys("login", "traits.phone")).toBeNull()
    expect(resolveKratosInputLabelKeys("login", "")).toBeNull()
  })
})

describe("resolveKratosSubmitLabelKey", () => {
  it("resolves method buttons per flow", () => {
    expect(resolveKratosSubmitLabelKey("login", "method", "password")).toBe("auth.login.submit")
    expect(resolveKratosSubmitLabelKey("registration", "method", "password")).toBe("auth.register.submit")
    expect(resolveKratosSubmitLabelKey("recovery", "method", "code")).toBe("auth.register.sendCode")
    expect(resolveKratosSubmitLabelKey("verification", "method", "code")).toBe("auth.register.sendCode")
    expect(resolveKratosSubmitLabelKey("login", "method", "totp")).toBe("auth.kratos.labels.verify")
  })

  it("tells the code submit from the (re)send buttons once the code was sent", () => {
    // choose_method: the only method=code button requests the code.
    expect(resolveKratosSubmitLabelKey("verification", "method", "code", { state: "choose_method", labelId: 1070005 })).toBe("auth.register.sendCode")
    // sent_email: "Submit" (1070005) verifies the entered code, "Resend code" (1070008) sends a new one.
    expect(resolveKratosSubmitLabelKey("verification", "method", "code", { state: "sent_email", labelId: 1070005 })).toBe("auth.verification.submit")
    expect(resolveKratosSubmitLabelKey("verification", "method", "code", { state: "sent_email" })).toBe("auth.verification.submit")
    expect(resolveKratosSubmitLabelKey("verification", "method", "code", { state: "sent_email", labelId: 1070008 })).toBe("auth.register.sendCode")
    expect(resolveKratosSubmitLabelKey("recovery", "method", "code", { state: "sent_email", labelId: 1070005 })).toBe("auth.kratos.labels.verify")
    expect(resolveKratosSubmitLabelKey("recovery", "method", "code", { state: "sent_email", labelId: 1070008 })).toBe("auth.register.sendCode")
  })

  it("ignores non-method submits and unknown methods", () => {
    expect(resolveKratosSubmitLabelKey("login", "provider", "google")).toBeNull()
    expect(resolveKratosSubmitLabelKey("login", "method", "oidc")).toBeNull()
  })
})
