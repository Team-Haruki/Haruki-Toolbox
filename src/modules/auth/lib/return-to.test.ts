import { describe, expect, it } from "bun:test"
import { isAllowedFlowReturnTo, parseAllowedReturnToOrigins } from "./return-to"

describe("auth return_to helpers", () => {
  it("parses configured allowed origins", () => {
    expect(parseAllowedReturnToOrigins([
      "https://haruki-dev.seiunx.com",
    ])).toEqual([])

    expect(parseAllowedReturnToOrigins(
      "https://haruki-dev.seiunx.com, https://haruki-dev.seiunx.com/path bad-value ftp://example.com"
    )).toEqual(["https://haruki-dev.seiunx.com"])
  })

  it("allows configured frontend return_to origins", () => {
    expect(isAllowedFlowReturnTo(
      "https://haruki-dev.seiunx.com/user/settings",
      {
        currentOrigin: "https://haruki.seiunx.com",
        allowedOrigins: ["https://haruki-dev.seiunx.com"],
      }
    )).toBe(true)
  })

  it("allows nested Kratos flow URLs only when their return_to is allowed", () => {
    const kratosFlowUrl = "https://toolbox-auth.haruki.seiunx.com/self-service/login/browser"
    const safeReturnTo = `${kratosFlowUrl}?return_to=${encodeURIComponent("https://haruki-dev.seiunx.com/")}`
    const unsafeReturnTo = `${kratosFlowUrl}?return_to=${encodeURIComponent("https://evil.example/")}`
    const options = {
      currentOrigin: "https://haruki.seiunx.com",
      kratosOrigin: "https://toolbox-auth.haruki.seiunx.com",
      allowedOrigins: ["https://haruki-dev.seiunx.com"],
    }

    expect(isAllowedFlowReturnTo(safeReturnTo, options)).toBe(true)
    expect(isAllowedFlowReturnTo(unsafeReturnTo, options)).toBe(false)
  })
})
