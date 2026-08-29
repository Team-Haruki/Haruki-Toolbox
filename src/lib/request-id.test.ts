import { describe, expect, it } from "bun:test"
import { createRequestId } from "./request-id"

describe("request id", () => {
  it("creates distinct UUID values", () => {
    const first = createRequestId()
    const second = createRequestId()

    expect(first).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
    expect(second).not.toBe(first)
  })

  it("creates an RFC 4122 UUID when randomUUID is unavailable", () => {
    const requestId = createRequestId({
      getRandomValues(bytes) {
        bytes.set(Array.from({ length: bytes.length }, (_, index) => index))
        return bytes
      },
    })

    expect(requestId).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f")
  })
})
