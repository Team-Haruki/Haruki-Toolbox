import { describe, expect, it } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import {
  buildConfigGeneratorLocation,
  checkQQNumber,
  checkVerificationCode,
  parseRetryAfterSeconds,
  readErrorStatus,
  resolveStepState,
} from "./registration"

function httpError(status: number, headers: Record<string, string> = {}): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response = { status, statusText: "", headers, config, data: {} } as AxiosResponse
  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, null, response)
}

describe("bot neo registration helpers", () => {
  it("accepts a 5–12 digit QQ number and trims it", () => {
    expect(checkQQNumber(" 1234567890 ")).toEqual({ ok: true, value: 1234567890 })
    expect(checkQQNumber("10000")).toEqual({ ok: true, value: 10000 })
    expect(checkQQNumber("123456789012")).toEqual({ ok: true, value: 123456789012 })
  })

  it("tells an empty QQ number from a malformed one", () => {
    expect(checkQQNumber("   ")).toEqual({ ok: false, issue: "missing" })
    expect(checkQQNumber("1234")).toEqual({ ok: false, issue: "invalid" })
    expect(checkQQNumber("0123456")).toEqual({ ok: false, issue: "invalid" })
    expect(checkQQNumber("1234567890123")).toEqual({ ok: false, issue: "invalid" })
    expect(checkQQNumber("12345a")).toEqual({ ok: false, issue: "invalid" })
  })

  it("accepts only a six-digit verification code", () => {
    expect(checkVerificationCode(" 012345 ")).toEqual({ ok: true, value: "012345" })
    expect(checkVerificationCode("")).toEqual({ ok: false, issue: "missing" })
    expect(checkVerificationCode("12345")).toEqual({ ok: false, issue: "invalid" })
    expect(checkVerificationCode("1234567")).toEqual({ ok: false, issue: "invalid" })
    expect(checkVerificationCode("12a456")).toEqual({ ok: false, issue: "invalid" })
  })

  it("reads the wait from a 429 and nothing from other failures", () => {
    expect(parseRetryAfterSeconds(httpError(429, { "retry-after": "42" }))).toBe(42)
    expect(parseRetryAfterSeconds(httpError(429, { "retry-after": "1.2" }))).toBe(2)
    expect(parseRetryAfterSeconds(httpError(429, { "retry-after": "0" }))).toBeNull()
    expect(parseRetryAfterSeconds(httpError(429, { "retry-after": "soon" }))).toBeNull()
    expect(parseRetryAfterSeconds(httpError(429))).toBeNull()
    expect(parseRetryAfterSeconds(httpError(503, { "retry-after": "42" }))).toBeNull()
    expect(parseRetryAfterSeconds(new Error("offline"))).toBeNull()
  })

  it("reads the status of a failed request", () => {
    expect(readErrorStatus(httpError(409))).toBe(409)
    expect(readErrorStatus(new AxiosError("offline"))).toBeNull()
    expect(readErrorStatus(new Error("offline"))).toBeNull()
  })

  it("places each step before, at or after the current one", () => {
    expect(resolveStepState("input", "input")).toBe("current")
    expect(resolveStepState("verify", "input")).toBe("upcoming")
    expect(resolveStepState("input", "verify")).toBe("done")
    expect(resolveStepState("verify", "result")).toBe("done")
    expect(resolveStepState("result", "result")).toBe("current")
  })

  it("links to the config generator with the new bot filled in", () => {
    expect(buildConfigGeneratorLocation({ bot_id: "91145149", credential: "fake-credential", owner_id: 10001 }, "20002")).toEqual({
      path: "/client-config-generator",
      query: { ownerId: "10001", botId: "91145149", credential: "fake-credential" },
    })
    expect(buildConfigGeneratorLocation({ bot_id: "91145149", credential: "fake-credential", ownerId: " 30003 " }, "20002").query.ownerId).toBe("30003")
  })

  it("falls back to the registered QQ number as the owner", () => {
    expect(buildConfigGeneratorLocation({ bot_id: "91145149", credential: "fake-credential" }, " 20002 ").query.ownerId).toBe("20002")
    expect(buildConfigGeneratorLocation(null, "")).toEqual({
      path: "/client-config-generator",
      query: { ownerId: "", botId: "", credential: "" },
    })
  })
})
