import { describe, expect, it } from "bun:test"
import { appendImageRetryParam, IMAGE_RETRY_DELAYS_MS, resolveImageRetryDelayMs } from "./image-recovery"

describe("appendImageRetryParam", () => {
  it("appends the retry marker with the right separator", () => {
    expect(appendImageRetryParam("https://a.example/x.png", 1)).toBe("https://a.example/x.png?_retry=1")
    expect(appendImageRetryParam("https://a.example/x.png?v=2", 3)).toBe("https://a.example/x.png?v=2&_retry=3")
  })
})

describe("resolveImageRetryDelayMs", () => {
  it("backs off quickly first, then waits out a WAF burst before giving up", () => {
    expect(IMAGE_RETRY_DELAYS_MS.length).toBeGreaterThanOrEqual(4)
    expect(resolveImageRetryDelayMs(1)).toBe(800)
    expect(resolveImageRetryDelayMs(2)).toBe(1600)
    expect(resolveImageRetryDelayMs(3)).toBe(5000)
    expect(resolveImageRetryDelayMs(4)).toBe(15000)
    expect(resolveImageRetryDelayMs(5)).toBeNull()
    expect(resolveImageRetryDelayMs(0)).toBeNull()
  })

  it("is strictly increasing", () => {
    for (let index = 1; index < IMAGE_RETRY_DELAYS_MS.length; index += 1) {
      expect(IMAGE_RETRY_DELAYS_MS[index]).toBeGreaterThan(IMAGE_RETRY_DELAYS_MS[index - 1])
    }
  })
})
