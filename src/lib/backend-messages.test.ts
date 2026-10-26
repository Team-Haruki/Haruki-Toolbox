import { describe, expect, test } from "bun:test"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import enUSCore from "@/shared/i18n/messages/en-US/en-US-core"
import { BACKEND_MESSAGE_KEYS, resolveBackendMessage } from "./backend-messages"

function hasKey(bundle: Record<string, unknown>, key: string): boolean {
  let node: unknown = bundle
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return false
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === "string" && node.length > 0
}

describe("resolveBackendMessage", () => {
  test("matches exact messages case-insensitively and trimmed", () => {
    expect(resolveBackendMessage("user not authenticated")).toEqual({ key: "backendMessages.notAuthenticated" })
    expect(resolveBackendMessage("  User Not Authenticated ")).toEqual({ key: "backendMessages.notAuthenticated" })
    expect(resolveBackendMessage("Retrieve mysekai data failed, it seems you may not have completed the tutorial yet.")).toEqual({
      key: "backendMessages.mysekaiRetrieveFailed",
    })
    expect(resolveBackendMessage("Player data not found.")).toEqual({ key: "backendMessages.playerDataNotFound" })
    expect(resolveBackendMessage("this game account is already bound by another user")).toEqual({ key: "backendMessages.accountBoundByAnotherUser" })
  })

  test("matches prefixes and captures the inherit code", () => {
    expect(resolveBackendMessage("ticket quota exceeded (3/3)")).toEqual({ key: "backendMessages.ticketQuotaExceeded" })
    expect(resolveBackendMessage("failed to parse suite data: unexpected end of JSON")).toEqual({ key: "backendMessages.suiteParseFailed" })
    expect(resolveBackendMessage("inherit failed")).toEqual({ key: "backendMessages.inheritFailed", params: undefined })
    expect(resolveBackendMessage("inherit failed: 10005")).toEqual({ key: "backendMessages.inheritFailedWithCode", params: { code: "10005" } })
  })

  test("returns null for unknown or empty input", () => {
    expect(resolveBackendMessage("")).toBeNull()
    expect(resolveBackendMessage(undefined)).toBeNull()
    expect(resolveBackendMessage("Your account has been banned")).toBeNull()
    expect(resolveBackendMessage("ticket is closed for business")).toBeNull()
  })

  test("every mapped key exists in zh-CN and en-US", () => {
    for (const key of BACKEND_MESSAGE_KEYS) {
      expect(hasKey(zhCNCore, key)).toBe(true)
      expect(hasKey(enUSCore, key)).toBe(true)
    }
  })
})
