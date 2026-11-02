import { afterEach, beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { interceptKratosWebAuthnAlerts, localizeKratosWebAuthnAlert } from "./kratos-webauthn-alerts"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  await setI18nLocale("zh-CN")
})

const webauthn = zhCNCore.auth.kratos.webauthn

describe("localizeKratosWebAuthnAlert", () => {
  test("maps webauthn.js sentences and DOMExceptions", () => {
    expect(localizeKratosWebAuthnAlert("This browser does not support WebAuthn!")).toBe(webauthn.unsupported)
    expect(localizeKratosWebAuthnAlert(new DOMException("The operation either timed out or was not allowed.", "NotAllowedError"))).toBe(webauthn.notAllowed)
    expect(localizeKratosWebAuthnAlert("InvalidStateError: The authenticator was previously registered")).toBe(webauthn.invalidState)
    expect(localizeKratosWebAuthnAlert({ name: "SecurityError" })).toBe(webauthn.security)
    expect(localizeKratosWebAuthnAlert(new Error("boom"))).toBe(webauthn.failed)
    expect(localizeKratosWebAuthnAlert(undefined)).toBe(webauthn.failed)
  })
})

describe("interceptKratosWebAuthnAlerts", () => {
  const original = globalThis.window
  afterEach(() => {
    globalThis.window = original
  })

  test("routes alerts while installed and restores the previous alert", () => {
    const shown: string[] = []
    const previous = () => undefined
    globalThis.window = { alert: previous } as unknown as Window & typeof globalThis
    const restore = interceptKratosWebAuthnAlerts((message) => shown.push(message))
    window.alert("This browser does not support WebAuthn!")
    expect(shown).toEqual([webauthn.unsupported])
    restore()
    expect(window.alert).toBe(previous)
  })
})
