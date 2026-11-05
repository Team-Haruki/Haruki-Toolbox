import { describe, expect, it } from "bun:test"
import { resolveSponsorFramesLockReason } from "./sponsor-frames-access"

describe("resolveSponsorFramesLockReason", () => {
  it("lets eligible sponsors through whatever the override says", () => {
    expect(resolveSponsorFramesLockReason({ eligible: true, accessOverride: "", oauthEnabled: true })).toBeNull()
    expect(resolveSponsorFramesLockReason({ eligible: true, accessOverride: "granted", oauthEnabled: false })).toBeNull()
  })

  it("names the administrator block before any verification hint", () => {
    expect(resolveSponsorFramesLockReason({ eligible: false, accessOverride: "blocked", oauthEnabled: true })).toBe("blocked")
  })

  it("points unverified users at the methods that are actually open", () => {
    expect(resolveSponsorFramesLockReason({ eligible: false, accessOverride: "", oauthEnabled: true })).toBe("unverified")
    expect(resolveSponsorFramesLockReason({ eligible: false, oauthEnabled: false })).toBe("orderOnly")
  })
})
