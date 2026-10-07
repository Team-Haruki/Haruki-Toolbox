import { describe, expect, it } from "bun:test"
import {
  VERIFICATION_CONTINUE_NODE_ID,
  VERIFICATION_PASSED_STATE,
  resolveVerificationContinuePath,
} from "./verification-flow"

const ORIGIN = "https://haruki.seiunx.com"
const DEVICE_PATH = "/device?user_code=BCDF-GHJK"

function continueAnchor(href: string) {
  return [{ id: VERIFICATION_CONTINUE_NODE_ID, href }]
}

describe("resolveVerificationContinuePath", () => {
  it("returns null while the flow has not passed", () => {
    for (const state of ["", "choose_method", "sent_email"]) {
      expect(resolveVerificationContinuePath({
        state,
        returnTo: `${ORIGIN}${DEVICE_PATH}`,
        anchors: [],
      }, ORIGIN)).toBeNull()
    }
  })

  it("ignores link nodes other than continue", () => {
    expect(resolveVerificationContinuePath({
      state: "sent_email",
      returnTo: `${ORIGIN}${DEVICE_PATH}`,
      anchors: [{ id: "resend", href: `${ORIGIN}/elsewhere` }],
    }, ORIGIN)).toBeNull()
  })

  it("leads a passed flow to the sign-up's return_to", () => {
    expect(resolveVerificationContinuePath({
      state: VERIFICATION_PASSED_STATE,
      returnTo: `${ORIGIN}${DEVICE_PATH}`,
      anchors: continueAnchor(`${ORIGIN}${DEVICE_PATH}`),
    }, ORIGIN)).toBe(DEVICE_PATH)

    expect(resolveVerificationContinuePath({
      state: VERIFICATION_PASSED_STATE,
      returnTo: `${ORIGIN}/oauth2/login?login_challenge=abc123`,
      anchors: [],
    }, ORIGIN)).toBe("/oauth2/login?login_challenge=abc123")
  })

  it("treats a continue link as passed even without a state", () => {
    expect(resolveVerificationContinuePath({
      state: "",
      returnTo: `${ORIGIN}${DEVICE_PATH}`,
      anchors: continueAnchor(`${ORIGIN}${DEVICE_PATH}`),
    }, ORIGIN)).toBe(DEVICE_PATH)
  })

  it("falls back to the continue link when the flow has no usable return_to", () => {
    expect(resolveVerificationContinuePath({
      state: VERIFICATION_PASSED_STATE,
      returnTo: "",
      anchors: continueAnchor(`${ORIGIN}/user/settings`),
    }, ORIGIN)).toBe("/user/settings")

    expect(resolveVerificationContinuePath({
      state: VERIFICATION_PASSED_STATE,
      returnTo: "https://haruki-api.seiunx.com/",
      anchors: continueAnchor(`${ORIGIN}/`),
    }, ORIGIN)).toBe("/")
  })

  it("never leaves the current origin", () => {
    const offOrigin = [
      "https://evil.example/device",
      "https://haruki-api.seiunx.com/",
      `${ORIGIN}//evil.example/`,
      "javascript:alert(1)",
    ]
    for (const target of offOrigin) {
      expect(resolveVerificationContinuePath({
        state: VERIFICATION_PASSED_STATE,
        returnTo: target,
        anchors: continueAnchor(target),
      }, ORIGIN)).toBe("/")
    }
  })

  it("leads to the app root outside a browser", () => {
    expect(resolveVerificationContinuePath({
      state: VERIFICATION_PASSED_STATE,
      returnTo: `${ORIGIN}${DEVICE_PATH}`,
      anchors: [],
    }, "")).toBe("/")
  })
})
