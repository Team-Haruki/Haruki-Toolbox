import { describe, expect, test } from "bun:test"
import {
  AssetHttpError,
  assetFailureStatus,
  loadWithAssetFallback,
  shouldRetryAssetOnFallback,
} from "@/shared/sekai/asset-fallback"

describe("shouldRetryAssetOnFallback", () => {
  test("retries network errors, timeouts, 5xx and broken bodies", () => {
    expect(shouldRetryAssetOnFallback(new TypeError("Failed to fetch"))).toBe(true)
    expect(shouldRetryAssetOnFallback(new DOMException("timed out", "TimeoutError"))).toBe(true)
    expect(shouldRetryAssetOnFallback(new AssetHttpError("u", 502))).toBe(true)
    expect(shouldRetryAssetOnFallback(new SyntaxError("Unexpected end of JSON input"))).toBe(true)
    // the vendored 3D engine and the costume role loader
    expect(shouldRetryAssetOnFallback(new Error("Failed to load https://h/a.msgpack.br: HTTP 504"))).toBe(true)
  })

  test("does not retry a 4xx or the caller's abort", () => {
    expect(shouldRetryAssetOnFallback(new AssetHttpError("u", 404))).toBe(false)
    expect(shouldRetryAssetOnFallback(new Error("HTTP 404 for https://h/parts/a.msgpack.br"))).toBe(false)
    expect(shouldRetryAssetOnFallback(new Error("Failed to load https://h/a.msgpack.br: HTTP 403"))).toBe(false)
    expect(shouldRetryAssetOnFallback(new DOMException("aborted", "AbortError"))).toBe(false)
  })

  test("reads the status from either error shape", () => {
    expect(assetFailureStatus(new AssetHttpError("u", 503))).toBe(503)
    expect(assetFailureStatus(new Error("HTTP 500 for x"))).toBe(500)
    expect(assetFailureStatus(new TypeError("Failed to fetch"))).toBeNull()
  })
})

describe("loadWithAssetFallback", () => {
  test("stays on the chosen host when it answers", async () => {
    const roots: string[] = []
    const result = await loadWithAssetFallback("https://cn", "https://gl", async (root) => {
      roots.push(root)
      return 1
    })
    expect(result).toEqual({ value: 1, root: "https://cn", usedFallback: false })
    expect(roots).toEqual(["https://cn"])
  })

  test("moves to the fallback host once on a retryable failure", async () => {
    const roots: string[] = []
    const result = await loadWithAssetFallback("https://cn", "https://gl", async (root) => {
      roots.push(root)
      if (root === "https://cn") throw new TypeError("Failed to fetch")
      return 2
    })
    expect(result).toEqual({ value: 2, root: "https://gl", usedFallback: true })
    expect(roots).toEqual(["https://cn", "https://gl"])
  })

  test("passes a 404, or any failure without a fallback, through", async () => {
    await expect(loadWithAssetFallback("https://cn", "https://gl", () => Promise.reject(new AssetHttpError("u", 404))))
      .rejects.toThrow("HTTP 404")
    await expect(loadWithAssetFallback("https://cn", null, () => Promise.reject(new TypeError("Failed to fetch"))))
      .rejects.toThrow("Failed to fetch")
    await expect(loadWithAssetFallback("https://gl", "https://gl", () => Promise.reject(new TypeError("down"))))
      .rejects.toThrow("down")
  })

  test("reports the fallback host's own failure", async () => {
    await expect(loadWithAssetFallback("https://cn", "https://gl", (root) => Promise.reject(new AssetHttpError(root, 503))))
      .rejects.toThrow("https://gl: HTTP 503")
  })
})
