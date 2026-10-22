import { describe, expect, it } from "bun:test"
import { resolveAvatarInitial } from "./avatar-fallback"

describe("resolveAvatarInitial", () => {
  it("takes the first character of a CJK name", () => {
    expect(resolveAvatarInitial("星乃一歌")).toBe("星")
    expect(resolveAvatarInitial("初音ミク")).toBe("初")
  })

  it("takes the first letter of a latin name, upper-cased", () => {
    expect(resolveAvatarInitial("hatsune miku")).toBe("H")
    expect(resolveAvatarInitial("  Ichika Hoshino ")).toBe("I")
  })

  it("falls back to a question mark without a name", () => {
    expect(resolveAvatarInitial(null)).toBe("?")
    expect(resolveAvatarInitial("   ")).toBe("?")
  })
})
