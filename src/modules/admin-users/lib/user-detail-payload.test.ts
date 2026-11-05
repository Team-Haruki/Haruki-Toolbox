import { beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { isUnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import { assertUserDetailPayload, isUserDetailPayload } from "./user-detail-payload"

beforeAll(() => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  setI18nLocale("zh-CN")
})

const valid = {
  userData: { userId: "1234500000", name: "Kanade", role: "user", emailInfo: { email: "k@example.test", verified: true } },
  banned: false,
  createdAt: "2026-01-01T00:00:00Z",
}

describe("isUserDetailPayload", () => {
  test("accepts the backend shape, with a numeric id too", () => {
    expect(isUserDetailPayload(valid)).toBe(true)
    expect(isUserDetailPayload({ ...valid, userData: { ...valid.userData, userId: 1234500000 } })).toBe(true)
  })

  test("rejects a list envelope and a userData block without a name", () => {
    expect(isUserDetailPayload({ items: [] })).toBe(false)
    expect(isUserDetailPayload({ userData: { userId: "1" } })).toBe(false)
    expect(isUserDetailPayload({ userData: null })).toBe(false)
    expect(isUserDetailPayload("nope")).toBe(false)
  })
})

describe("assertUserDetailPayload", () => {
  test("returns the payload when valid and throws a localized error otherwise", () => {
    expect(assertUserDetailPayload(valid as unknown) as unknown).toBe(valid)
    expect(() => assertUserDetailPayload({ items: [] })).toThrow()
    try {
      assertUserDetailPayload({ items: [] })
    } catch (error) {
      expect(isUnexpectedPayloadError(error)).toBe(true)
      expect((error as Error).message).toContain("数据")
    }
  })
})
