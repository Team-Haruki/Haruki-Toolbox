import { describe, expect, it } from "bun:test"
import {
  createAllowedReturnToOrigins,
  isAllowedFlowReturnTo,
  parseAllowedReturnToOrigins,
  resolvePublicFrontendOrigin,
} from "./return-to"

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

  it("uses https for public frontend origins when the browser reports a non-local http origin", () => {
    expect(resolvePublicFrontendOrigin("http://haruki.seiunx.com")).toBe("https://haruki.seiunx.com")
    expect(resolvePublicFrontendOrigin("http://localhost:5173")).toBe("http://localhost:5173")
    expect(resolvePublicFrontendOrigin(
      "http://haruki.seiunx.com",
      { webUrl: "https://haruki-dev-local.seiunx.com/app" }
    )).toBe("https://haruki-dev-local.seiunx.com")
  })

  it("does not keep downgrade http origins in allowed return_to origins", () => {
    const origins = createAllowedReturnToOrigins("http://haruki.seiunx.com")

    expect(origins.has("https://haruki.seiunx.com")).toBe(true)
    expect(origins.has("http://haruki.seiunx.com")).toBe(false)
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
