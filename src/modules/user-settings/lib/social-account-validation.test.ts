import { describe, expect, it } from "bun:test"
import { SHA256_HEX_LENGTH, validateSocialAccountId } from "./social-account-validation"

describe("validateSocialAccountId", () => {
  it("accepts pure-digit QQ numbers", () => {
    expect(validateSocialAccountId("qq", "10001")).toBeNull()
    expect(validateSocialAccountId("qq", "1810972564")).toBeNull()
  })

  it("rejects non-numeric QQ accounts", () => {
    expect(validateSocialAccountId("qq", "abc123")).toBe("qq-not-numeric")
    expect(validateSocialAccountId("qq", "10001 ")).toBe("qq-not-numeric")
    expect(validateSocialAccountId("qq", "1e5")).toBe("qq-not-numeric")
  })

  it("requires qqbot open-ids to be longer than a sha256 hex digest", () => {
    const sha256Hex = "a".repeat(SHA256_HEX_LENGTH)
    expect(validateSocialAccountId("qqbot", sha256Hex)).toBe("qqbot-too-short")
    expect(validateSocialAccountId("qqbot", "123456789")).toBe("qqbot-too-short")
    expect(validateSocialAccountId("qqbot", `${sha256Hex}b`)).toBeNull()
  })

  it("leaves other platforms unvalidated", () => {
    expect(validateSocialAccountId("discord", "user#42")).toBeNull()
    expect(validateSocialAccountId("telegram", "@someone")).toBeNull()
  })
})
