import { beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { isUnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import { assertDashboardPayload, isDashboardPayload } from "./dashboard-payload"

beforeAll(() => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  setI18nLocale("zh-CN")
})

const valid = {
  generatedAt: "2026-10-30T12:00:00Z",
  users: { total: 1, banned: 0, admin: 0, superAdmin: 1 },
  bindings: { total: 2, verified: 2, byServer: [] },
  uploads: { windowHours: 24, totalAllTime: 3, total: 3, success: 3, failed: 0, byMethod: [], byDataType: [] },
}

describe("isDashboardPayload", () => {
  test("accepts the backend shape", () => {
    expect(isDashboardPayload(valid)).toBe(true)
  })

  test("rejects a list envelope, missing sections and non-numeric counters", () => {
    expect(isDashboardPayload({ items: [] })).toBe(false)
    expect(isDashboardPayload({ ...valid, users: undefined })).toBe(false)
    expect(isDashboardPayload({ ...valid, uploads: { ...valid.uploads, total: "3" } })).toBe(false)
    expect(isDashboardPayload(null)).toBe(false)
    expect(isDashboardPayload([])).toBe(false)
  })
})

describe("assertDashboardPayload", () => {
  test("returns the payload when valid", () => {
    expect(assertDashboardPayload(valid as unknown) as unknown).toBe(valid)
  })

  test("throws a localized error that names the endpoint", () => {
    try {
      assertDashboardPayload({ items: [] })
      throw new Error("expected a throw")
    } catch (error) {
      expect(isUnexpectedPayloadError(error)).toBe(true)
      expect((error as Error).message).not.toMatch(/[a-z]{4,}/)
      expect((error as { path: string }).path).toContain("dashboard")
    }
  })
})
