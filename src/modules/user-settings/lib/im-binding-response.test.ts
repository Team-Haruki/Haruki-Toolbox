import { describe, expect, test } from "bun:test"
import {
  extractGeneratedCodeResult,
  extractUpdatedSocial,
  isNotVerifiedMessage,
} from "./im-binding-response"

describe("im binding response helpers", () => {
  test("extractUpdatedSocial supports nested snake_case payload", () => {
    const result = extractUpdatedSocial({
      data: {
        updatedData: {
          social_platform_info: {
            platform: "qq",
            user_id: "10086",
            verified: true,
          },
        },
      },
    })

    expect(result).toEqual({
      platform: "qq",
      userId: "10086",
      verified: true,
    })
  })

  test("extractGeneratedCodeResult supports snake_case keys", () => {
    const result = extractGeneratedCodeResult({
      data: {
        status_token: "token-1",
        one_time_password: "otp-1",
      },
    })

    expect(result.statusToken).toBe("token-1")
    expect(result.oneTimePassword).toBe("otp-1")
  })

  test("isNotVerifiedMessage is case-insensitive", () => {
    expect(isNotVerifiedMessage("User is NOT VERIFIED")).toBe(true)
    expect(isNotVerifiedMessage("verified already")).toBe(false)
  })
})
