import { beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import enUSCore from "@/shared/i18n/messages/en-US/en-US-core"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"
import {
  describeKratosError,
  describeKratosFlowLoadError,
  localizeKratosMessage,
  resolveKratosMessageKey,
} from "./kratos-messages"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  i18n.global.mergeLocaleMessage("en-US", enUSCore)
  await setI18nLocale("zh-CN")
})

describe("resolveKratosMessageKey", () => {
  test("maps the ids the auth pages see most", () => {
    expect(resolveKratosMessageKey(4000006)).toBe("auth.kratos.messages.invalidCredentials")
    expect(resolveKratosMessageKey(4000007)).toBe("auth.kratos.messages.accountExists")
    expect(resolveKratosMessageKey(4010001)).toBe("auth.kratos.messages.flowExpired")
    expect(resolveKratosMessageKey(1060002)).toBe("auth.kratos.messages.recoveryLinkSent")
    expect(resolveKratosMessageKey(1080001)).toBe("auth.kratos.messages.verificationLinkSent")
    expect(resolveKratosMessageKey(1010003)).toBe("auth.kratos.messages.reauthConfirm")
  })

  test("returns null for unmapped or missing ids", () => {
    expect(resolveKratosMessageKey(undefined)).toBeNull()
    expect(resolveKratosMessageKey(9999999)).toBeNull()
  })

  test("every mapped key has zh-CN and en-US text", () => {
    const zh = zhCNCore.auth.kratos.messages as Record<string, string>
    const en = enUSCore.auth.kratos.messages as Record<string, string>
    for (const id of [1010003, 1010004, 1050001, 1060001, 1060002, 1060003, 1080001, 1080002, 1080003, 4000001, 4000002, 4000003, 4000005, 4000006, 4000007, 4000008, 4000010, 4000012, 4000028, 4000031, 4000032, 4000035, 4010001, 4040001, 5000001]) {
      const key = resolveKratosMessageKey(id)
      expect(key).not.toBeNull()
      const name = key!.replace("auth.kratos.messages.", "")
      expect(zh[name]).toBeTruthy()
      expect(en[name]).toBeTruthy()
    }
  })
})

describe("localizeKratosMessage", () => {
  test("replaces the English paragraph with the translated text", () => {
    expect(localizeKratosMessage({
      id: 4000006,
      type: "error",
      text: "The provided credentials are invalid, check for spelling mistakes in your password or username, email address, or phone number.",
    })).toBe(zhCNCore.auth.kratos.messages.invalidCredentials)
  })

  test("interpolates context values", () => {
    expect(localizeKratosMessage({ id: 4000003, text: "length must be >= 8, but got 3", context: { min_length: 8, actual_length: 3 } })).toContain("8")
  })

  test("keeps the original text for unmapped ids and empty messages", () => {
    expect(localizeKratosMessage({ id: 7777777, text: "Something Kratos said" })).toBe("Something Kratos said")
    expect(localizeKratosMessage({ text: "   " })).toBe("")
    expect(localizeKratosMessage({})).toBe("")
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
