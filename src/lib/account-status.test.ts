import { describe, expect, test } from "bun:test"
import { isAccountBannedMessage, readAccountBanReason } from "./account-status"

describe("isAccountBannedMessage", () => {
  test("matches the backend's own-account ban messages", () => {
    expect(isAccountBannedMessage("Your account has been banned")).toBe(true)
    expect(isAccountBannedMessage("Your account has been banned: spam")).toBe(true)
    expect(isAccountBannedMessage("  your account has been banned  ")).toBe(true)
    expect(isAccountBannedMessage("banned users cannot access admin routes")).toBe(true)
    expect(isAccountBannedMessage("账号已被封禁")).toBe(true)
    expect(isAccountBannedMessage("您的账号已被封禁：违规")).toBe(true)
  })

  test("ignores 403 messages about other users", () => {
    expect(isAccountBannedMessage("this account is bound by a banned user")).toBe(false)
    expect(isAccountBannedMessage("grantee user is banned")).toBe(false)
    expect(isAccountBannedMessage("forbidden: account owner is banned")).toBe(false)
    expect(isAccountBannedMessage("account owner is banned: abuse")).toBe(false)
    expect(isAccountBannedMessage("upload game account owner banned")).toBe(false)
    expect(isAccountBannedMessage("该游戏账号被一个已封禁的用户绑定")).toBe(false)
  })

  test("ignores empty and unrelated input", () => {
    expect(isAccountBannedMessage(undefined)).toBe(false)
    expect(isAccountBannedMessage(null)).toBe(false)
    expect(isAccountBannedMessage("")).toBe(false)
    expect(isAccountBannedMessage("permission denied")).toBe(false)
    expect(isAccountBannedMessage("Your account has been banned by nobody, just kidding, not really a ban message prefix")).toBe(true)
  })
})

describe("readAccountBanReason", () => {
  test("extracts the reason after the colon", () => {
    expect(readAccountBanReason("Your account has been banned: repeated abuse")).toBe("repeated abuse")
    expect(readAccountBanReason("Your account has been banned：多次违规")).toBe("多次违规")
    expect(readAccountBanReason("账号已被封禁：违规")).toBe("违规")
  })

  test("returns an empty string without a reason", () => {
    expect(readAccountBanReason("Your account has been banned")).toBe("")
    expect(readAccountBanReason("grantee user is banned")).toBe("")
    expect(readAccountBanReason(undefined)).toBe("")
  })
})
