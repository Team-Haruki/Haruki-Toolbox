import { beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNUserSettings from "@/shared/i18n/messages/zh-CN/zh-CN-user-settings"
import enUSUserSettings from "@/shared/i18n/messages/en-US/en-US-user-settings"
import { classifySekaiDataError, describeSekaiDataError } from "./sekai-data-error"

beforeAll(() => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNUserSettings)
  i18n.global.mergeLocaleMessage("en-US", enUSUserSettings)
  setI18nLocale("zh-CN")
})

describe("classifySekaiDataError", () => {
  test("recognises the browsers' fetch failure messages as network errors", () => {
    expect(classifySekaiDataError("Failed to fetch")).toBe("network")
    expect(classifySekaiDataError("Load failed")).toBe("network")
    expect(classifySekaiDataError("NetworkError when attempting to fetch resource.")).toBe("network")
    expect(classifySekaiDataError("TypeError: fetch failed")).toBe("network")
  })

  test("recognises timeouts and keeps other messages", () => {
    expect(classifySekaiDataError("Request timed out after 30s")).toBe("timeout")
    expect(classifySekaiDataError("Manifest version mismatch")).toBe("other")
    expect(classifySekaiDataError("")).toBeNull()
    expect(classifySekaiDataError(null)).toBeNull()
  })
})

describe("describeSekaiDataError", () => {
  test("localizes network failures with a hint to switch the asset route", () => {
    const text = describeSekaiDataError("Failed to fetch")
    expect(text).not.toContain("Failed to fetch")
    expect(text).toContain("网络")
  })

  test("keeps specific messages and returns null for none", () => {
    expect(describeSekaiDataError("Manifest version mismatch")).toBe("Manifest version mismatch")
    expect(describeSekaiDataError(undefined)).toBeNull()
  })

  test("follows the active locale", async () => {
    await setI18nLocale("en-US")
    expect(describeSekaiDataError("Failed to fetch")).toMatch(/connection|route/i)
    await setI18nLocale("zh-CN")
  })
})
