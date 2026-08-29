import { describe, expect, it } from "bun:test"
import { createRequestId } from "./request-id"

describe("request id", () => {
  it("creates distinct UUID values", () => {
    const first = createRequestId()
    const second = createRequestId()

    expect(first).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
    expect(second).not.toBe(first)
  })
})
