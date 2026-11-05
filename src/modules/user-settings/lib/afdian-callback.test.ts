import { describe, expect, it } from "bun:test"
import { AxiosError, AxiosHeaders } from "axios"
import { classifyAfdianCallbackError, classifyAfdianCallbackStatus } from "./afdian-callback"

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new AxiosError("request failed", "ERR_BAD_RESPONSE")
  error.response = { status, statusText: "", data: null, headers: {}, config: { headers: new AxiosHeaders() } }
  return error
}

describe("classifyAfdianCallbackStatus", () => {
  it("tells the unfixable conflict apart from a stale authorization and a transient failure", () => {
    expect(classifyAfdianCallbackStatus(409)).toBe("conflict")
    expect(classifyAfdianCallbackStatus(400)).toBe("expired")
    expect(classifyAfdianCallbackStatus(401)).toBe("expired")
    expect(classifyAfdianCallbackStatus(422)).toBe("expired")
    expect(classifyAfdianCallbackStatus(500)).toBe("failed")
    expect(classifyAfdianCallbackStatus(503)).toBe("failed")
    expect(classifyAfdianCallbackStatus(undefined)).toBe("failed")
  })
})

describe("classifyAfdianCallbackError", () => {
  it("reads the status off an axios error and treats anything else as transient", () => {
    expect(classifyAfdianCallbackError(axiosErrorWithStatus(409))).toBe("conflict")
    expect(classifyAfdianCallbackError(axiosErrorWithStatus(403))).toBe("expired")
    expect(classifyAfdianCallbackError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe("failed")
    expect(classifyAfdianCallbackError(new Error("boom"))).toBe("failed")
  })
})
