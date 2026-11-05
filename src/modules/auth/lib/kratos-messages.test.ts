import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import zhTWCore from "@/shared/i18n/messages/zh-TW/zh-TW-core"
import enUSCore from "@/shared/i18n/messages/en-US/en-US-core"
import type { KratosUiMessage } from "@/modules/auth/lib/kratos"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"
import { KRATOS_ERROR_IDS, KRATOS_TEXT_IDS, KRATOS_TEXT_IDS_V25_4 } from "@/modules/auth/lib/kratos-text-ids"
import {
  describeKratosError,
  describeKratosFlowError,
  describeKratosFlowLoadError,
  formatKratosProviderName,
  localizeKratosMessage,
  localizeKratosReason,
  resolveKratosMessageKey,
} from "./kratos-messages"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  i18n.global.mergeLocaleMessage("zh-TW", zhTWCore)
  i18n.global.mergeLocaleMessage("en-US", enUSCore)
  await setI18nLocale("zh-CN")
})

afterAll(async () => {
  await setI18nLocale("zh-CN")
})

const LOCALES = { "zh-CN": zhCNCore, "zh-TW": zhTWCore, "en-US": enUSCore } as const

function kratosNamespace(core: unknown) {
  return (core as { auth: { kratos: unknown } }).auth.kratos as Record<string, Record<string, string>>
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort()
}

describe("message id inventory", () => {
  test("covers the 145 ids Kratos v25.4.0 defines plus the newer catalog ids", () => {
    expect(KRATOS_TEXT_IDS_V25_4).toHaveLength(145)
    expect(new Set(KRATOS_TEXT_IDS).size).toBe(KRATOS_TEXT_IDS.length)
  })

  for (const [locale, core] of Object.entries(LOCALES)) {
    test(`every inventoried id has ${locale} text with the zh-CN placeholders`, () => {
      const text = kratosNamespace(core).text!
      const reference = kratosNamespace(zhCNCore).text!
      const missing = KRATOS_TEXT_IDS.filter((id) => !text[String(id)]?.trim())
      expect(missing).toEqual([])
      for (const id of KRATOS_TEXT_IDS) {
        expect([id, placeholders(text[String(id)]!)]).toEqual([id, placeholders(reference[String(id)]!)])
      }
      expect(Object.keys(text).map(Number).filter((id) => !KRATOS_TEXT_IDS.includes(id))).toEqual([])
    })

    test(`every error id, reason and helper key exists in ${locale}`, () => {
      const ns = kratosNamespace(core)
      expect(KRATOS_ERROR_IDS.filter((id) => !ns.errors?.[id])).toEqual([])
      for (const group of ["variants", "fields", "credentialTypes", "reasons", "errorStatus", "errorPage", "labels", "webauthn"]) {
        expect(Object.keys(ns[group] ?? {})).toEqual(Object.keys(kratosNamespace(zhCNCore)[group] ?? {}))
      }
    })
  }

  test("ids resolve to their namespace key", () => {
    expect(resolveKratosMessageKey(1010021)).toBe("auth.kratos.text.1010021")
    expect(resolveKratosMessageKey(4000006)).toBe("auth.kratos.text.4000006")
    expect(resolveKratosMessageKey(1010000)).toBeNull()
    expect(resolveKratosMessageKey(9999999)).toBeNull()
    expect(resolveKratosMessageKey(undefined)).toBeNull()
  })
})

describe("localizeKratosMessage", () => {
  test("translates labels the login page shows", () => {
    expect(localizeKratosMessage({ id: 1010021, text: "Sign in with passkey" })).toBe("使用通行密钥登录")
    expect(localizeKratosMessage({ id: 1010022, text: "Sign in with password" })).toBe("使用密码登录")
    expect(localizeKratosMessage({ id: 1070008, text: "Resend code" })).toBe("重新发送验证码")
  })

  test("shows provider display names, not ids", () => {
    expect(localizeKratosMessage({ id: 1010002, text: "Sign in with google", context: { provider: "google", provider_id: "google" } })).toBe("使用 Google 登录")
    expect(localizeKratosMessage({ id: 1040002, text: "Sign up with apple", context: { provider: "apple", provider_id: "apple" } })).toBe("使用 Apple 注册")
    expect(localizeKratosMessage({ id: 1050002, text: "Link google", context: { provider: "google" } })).toBe("关联 Google 账号")
    expect(localizeKratosMessage({ id: 1050003, text: "Unlink google", context: { provider: "google" } })).toBe("解除关联 Google 账号")
  })

  test("keeps configured provider labels and title-cases unknown ids", () => {
    expect(formatKratosProviderName("Google Workspace", "google")).toBe("Google Workspace")
    expect(formatKratosProviderName("github", "github")).toBe("GitHub")
    expect(formatKratosProviderName("acme", "acme")).toBe("Acme")
    // The settings link/unlink messages carry only the configured label.
    expect(formatKratosProviderName("Google Workspace")).toBe("Google Workspace")
    expect(formatKratosProviderName("GOOGLE")).toBe("Google")
    expect(formatKratosProviderName("", "")).toBe("")
  })

  test("interpolates numeric and named context", () => {
    expect(localizeKratosMessage({ id: 4000032, text: "The password must be at least 8 characters long, but got 3.", context: { min_length: 8, actual_length: 3 } })).toBe("密码太短，至少需要 8 个字符。")
    expect(localizeKratosMessage({ id: 1050020, text: "Remove passkey \"k@example.com\"", context: { display_name: "k@example.com" } })).toBe("移除通行密钥「k@example.com」")
    expect(localizeKratosMessage({ id: 1060004, text: "A recovery code has been sent to k***@example.com.", context: { masked_address: "k***@example.com" } })).toContain("k***@example.com")
  })

  test("names the missing field of a required error", () => {
    expect(localizeKratosMessage({ id: 4000002, text: "Property identifier is missing.", context: { property: "identifier" } })).toBe("请填写邮箱。")
    expect(localizeKratosMessage({ id: 4000002, text: "Property password is missing.", context: { property: "password" } })).toBe("请填写密码。")
    expect(localizeKratosMessage({ id: 4000002, text: "Property foo is missing.", context: { property: "foo" } })).toBe("请填写这一项。")
  })

  test("labels identity schema traits by field name, not the schema title", () => {
    expect(localizeKratosMessage({ id: 1070002, text: "E-Mail", context: { name: "traits.email", title: "E-Mail" } })).toBe("邮箱")
    expect(localizeKratosMessage({ id: 1070002, text: "Display Name", context: { name: "traits.name", title: "Display Name" } })).toBe("用户名")
    expect(localizeKratosMessage({ id: 1070002, text: "Nickname", context: { name: "traits.nickname", title: "Nickname" } })).toBe("Nickname")
  })

  test("translates known reasons carried by the generic ids", () => {
    const tooOften = "The request was submitted too often. Please request another code."
    expect(localizeKratosMessage({ id: 4000001, text: tooOften, context: { reason: tooOften } })).toContain("尝试次数过多")
    const email = "\"not-an-email\" is not valid \"email\""
    expect(localizeKratosMessage({ id: 4000001, text: email, context: { reason: email } })).toBe("邮箱格式不正确，请检查后重新填写。")
    const denied = "Unable to complete OpenID Connect flow because the OpenID Provider returned error \"access_denied\": The user denied the request"
    expect(localizeKratosMessage({ id: 4000001, text: denied, context: { reason: denied } })).toContain("你取消了第三方账号授权")
  })

  test("builds the duplicate-account hint from its context", () => {
    const text = localizeKratosMessage({
      id: 4000028,
      text: "You tried signing in with k@example.com which is already in use by another account. ...",
      context: { available_credential_types: ["password", "passkey"], available_oidc_providers: ["google"], credential_identifier_hint: "k@example.com" },
    })
    expect(text).toBe("k@example.com 已经被另一个账号使用。你可以使用密码或通行密钥登录。你也可以使用以下第三方账号登录：Google。")
  })

  test("lists backup codes with used ones marked", () => {
    const list: KratosUiMessage = {
      id: 1050015,
      text: "abcd1234, used",
      context: {
        secrets: [
          { id: 1050009, text: "abcd1234", context: { secret: "abcd1234" } },
          { id: 1050014, text: "Secret was used at 2026-11-02 12:00:00 +0000 UTC", context: { used_at_unix: 1793620800 } },
        ],
      },
    }
    const lines = localizeKratosMessage(list).split("\n")
    expect(lines[0]).toBe("abcd1234")
    expect(lines[1]).toStartWith("已于 ")
    expect(lines[1]).toEndWith(" 使用")
  })

  test("keeps secrets verbatim", () => {
    expect(localizeKratosMessage({ id: 1050006, text: "JBSWY3DPEHPK3PXP", context: { secret: "JBSWY3DPEHPK3PXP" } })).toBe("JBSWY3DPEHPK3PXP")
  })

  test("falls back to the Kratos English for unknown ids and reasons", () => {
    expect(localizeKratosMessage({ id: 7777777, text: "Something Kratos said" })).toBe("Something Kratos said")
    expect(localizeKratosMessage({ id: 4000001, text: "brand new reason", context: { reason: "brand new reason" } })).toBe("brand new reason")
    expect(localizeKratosMessage({ text: "   " })).toBe("")
    expect(localizeKratosMessage({})).toBe("")
  })

  test("follows the active locale", async () => {
    try {
      await setI18nLocale("en-US")
      expect(localizeKratosMessage({ id: 1010002, text: "Sign in with google", context: { provider: "google", provider_id: "google" } })).toBe("Sign in with Google")
      expect(localizeKratosMessage({ id: 1070002, text: "E-Mail", context: { name: "traits.email", title: "E-Mail" } })).toBe("Email")
      await setI18nLocale("zh-TW")
      expect(localizeKratosMessage({ id: 1070008, text: "Resend code" })).toBe("重新發送驗證碼")
    } finally {
      await setI18nLocale("zh-CN")
    }
  })
})

// Every text in the captured Kratos v25.4.0 responses (the e2e fixtures) must
// come out of the id lookup in zh-CN, never as the English original.
describe("captured Kratos v25.4.0 responses", () => {
  const fixtureDir = join(import.meta.dir, "../../../../tests/e2e/fixtures/kratos")
  const messages: KratosUiMessage[] = []
  function collect(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(collect)
      return
    }
    if (!value || typeof value !== "object") return
    const record = value as Record<string, unknown>
    if (typeof record.id === "number" && typeof record.text === "string") {
      messages.push(record as KratosUiMessage)
    }
    Object.values(record).forEach(collect)
  }
  for (const file of readdirSync(fixtureDir).filter((name) => name.endsWith(".json"))) {
    collect(JSON.parse(readFileSync(join(fixtureDir, file), "utf8")))
  }

  test("every captured id is inventoried", () => {
    const unknown = [...new Set(messages.map((message) => message.id!))].filter((id) => !KRATOS_TEXT_IDS.includes(id))
    expect(unknown).toEqual([])
  })

  test("no captured text stays English in zh-CN", () => {
    const verbatim = new Set([1050006, 1050009]) // TOTP secret, backup code
    const english = messages
      .filter((message) => !verbatim.has(message.id!))
      .map((message) => {
        // User data and brands may stay Latin: key names, addresses, backup codes.
        const displayName = typeof message.context?.display_name === "string" ? message.context.display_name : ""
        const out = localizeKratosMessage(message)
        const rest = (displayName ? out.replaceAll(displayName, "") : out)
          .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+|\b(?=[a-z0-9]*\d)[a-z0-9]{8}\b|Google|Apple|App|Cookie/g, "")
        return { id: message.id, out, rest }
      })
      .filter(({ rest }) => /[A-Za-z]{3,}/.test(rest))
      .map(({ id, out }) => ({ id, out }))
    expect(english).toEqual([])
  })
})

describe("describeKratosFlowError", () => {
  test("explains by error id, then reason, then status", () => {
    expect(describeKratosFlowError({ id: "security_csrf_violation", code: 403, reason: "Please retry the flow..." })).toContain("安全校验未通过")
    expect(describeKratosFlowError({ code: 400, reason: "Unable to complete OpenID Connect flow because the OpenID Provider did not return the state query parameter." })).toContain("第三方账号登录没有完成")
    expect(describeKratosFlowError({ code: 500, reason: "This is a stub error." })).toContain("内部错误")
    expect(describeKratosFlowError({ code: 410 })).toContain("页面已过期")
    expect(describeKratosFlowError({ id: "something_new" })).toBeNull()
    expect(describeKratosFlowError(null)).toBeNull()
  })

  test("localizes standalone reasons", () => {
    expect(localizeKratosReason("A valid session was detected and thus login is not possible.")).toContain("你已经登录了")
    expect(localizeKratosReason("")).toBeNull()
    expect(localizeKratosReason("never seen before")).toBeNull()
  })
})

describe("flow load and request errors", () => {
  test("describes an unloadable flow by its page name", () => {
    expect(describeKratosFlowLoadError("login")).toBe(
      zhCNCore.auth.common.loadFlowFailed.replace("{flow}", zhCNCore.auth.common.flowNames.login)
    )
  })

  test("turns a Kratos HTTP failure into user language and defers otherwise", () => {
    expect(describeKratosError(new KratosRequestError("sessions", 503), "fallback")).toBe(
      zhCNCore.auth.common.serviceUnavailable.replace("{status}", "503")
    )
    expect(describeKratosError(new Error("app text"), "fallback")).toBe("app text")
    expect(describeKratosError(undefined, "fallback")).toBe("fallback")
  })
})
