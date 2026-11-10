import { describe, expect, it } from "bun:test"
import { avatarInitial, resolveAccountStatus } from "./user-display"

describe("resolveAccountStatus", () => {
  it("reads a soft-deleted account as deleted although it is stored as a ban", () => {
    expect(resolveAccountStatus({ banned: true, deleted: true })).toBe("deleted")
  })

  it("tells banned from normal", () => {
    expect(resolveAccountStatus({ banned: true })).toBe("banned")
    expect(resolveAccountStatus({ banned: true, deleted: false })).toBe("banned")
    expect(resolveAccountStatus({ banned: false })).toBe("normal")
  })
})

describe("avatarInitial", () => {
  it("takes the first character, upper-cased", () => {
    expect(avatarInitial("haruki")).toBe("H")
    expect(avatarInitial("  社交绑定旧账号")).toBe("社")
  })

  it("keeps an emoji whole and falls back to a question mark", () => {
    expect(avatarInitial("🎵 miku")).toBe("🎵")
    expect(avatarInitial("")).toBe("?")
    expect(avatarInitial(null)).toBe("?")
  })
})
