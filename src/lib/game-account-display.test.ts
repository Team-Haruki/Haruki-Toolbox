import { describe, expect, it } from "bun:test"
import { formatGameAccountLabel, maskGameUserId } from "./game-account-display"

describe("game account display helpers", () => {
  it("masks game user ids with the first 2 and last 4 digits", () => {
    expect(maskGameUserId("1234567890")).toBe("12****7890")
  })

  it("keeps short game user ids readable", () => {
    expect(maskGameUserId("123456")).toBe("123456")
  })

  it("formats hidden game account labels with masked uid", () => {
    expect(formatGameAccountLabel({
      regionLabel: "JP",
      uid: "1234567890",
      hideUid: true,
    })).toBe("JP / UID 12****7890")
  })

  it("formats visible game account labels with full uid", () => {
    expect(formatGameAccountLabel({
      regionLabel: "JP",
      uid: "1234567890",
      hideUid: false,
    })).toBe("JP / UID 1234567890")
  })
})
