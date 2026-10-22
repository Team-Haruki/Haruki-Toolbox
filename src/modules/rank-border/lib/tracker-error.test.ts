import { beforeAll, describe, expect, test } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { describeTrackerError, isTrackerError } from "./tracker-error"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  await setI18nLocale("zh-CN")
})

function trackerError(message: string, status?: number): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

describe("describeTrackerError", () => {
  test("keeps the localized hint as the headline and the raw tracker text as detail", () => {
    expect(describeTrackerError(trackerError("Tracker request failed: HTTP 404", 404), "hint")).toEqual({
      message: "hint",
      detail: "Tracker request failed: HTTP 404",
    })
    // WebSocket / endpoint errors are plain Errors without a status.
    expect(describeTrackerError(new Error("Tracker WebSocket is unavailable"), "hint")).toEqual({
      message: "hint",
      detail: "Tracker WebSocket is unavailable",
    })
    expect(describeTrackerError(new Error("Tracker endpoint is empty"), "hint")).toEqual({
      message: "hint",
      detail: "Tracker endpoint is empty",
    })
  })

  test("maps 5xx and 429 to the shared transport texts", () => {
    expect(describeTrackerError(trackerError("Tracker request failed: HTTP 502", 502), "hint")).toEqual({
      message: zhCNCore.core.errors.serverUnavailable.replace("{status}", "502"),
      detail: "Tracker request failed: HTTP 502",
    })
    expect(describeTrackerError(trackerError("slow down", 429), "hint")).toEqual({
      message: zhCNCore.core.errors.rateLimited,
      detail: "slow down",
    })
  })

  test("leaves non-tracker errors to describeError", () => {
    expect(describeTrackerError(new TypeError("Failed to fetch"), "hint")).toEqual({ message: zhCNCore.core.errors.network })
    expect(describeTrackerError(new Error("already translated"), "hint")).toEqual({ message: "already translated" })
    expect(describeTrackerError("oops", "hint")).toEqual({ message: "hint", detail: "oops" })
  })

  test("isTrackerError recognises status-bearing and Tracker-prefixed errors only", () => {
    expect(isTrackerError(trackerError("x", 500))).toBe(true)
    expect(isTrackerError(trackerError("x", undefined))).toBe(true)
    expect(isTrackerError(new Error("Tracker WebSocket request timed out"))).toBe(true)
    expect(isTrackerError(new Error("something else"))).toBe(false)
    expect(isTrackerError("Tracker string")).toBe(false)
  })
})
