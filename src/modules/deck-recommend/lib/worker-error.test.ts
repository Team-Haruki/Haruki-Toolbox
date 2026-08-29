import { describe, expect, test } from "bun:test"
import { normalizeDeckRecommendWorkerError } from "./worker-error"

describe("normalizeDeckRecommendWorkerError", () => {
  test("uses the message from an Error", () => {
    expect(normalizeDeckRecommendWorkerError(new Error("failed"))).toBe("failed")
  })

  test("includes the constructor name for error-like objects", () => {
    class WorkerFailure {
      message = "bad payload"
    }
    expect(normalizeDeckRecommendWorkerError(new WorkerFailure())).toBe("WorkerFailure: bad payload")
  })

  test("normalizes an Emscripten exception without a message", () => {
    class Exception {}
    expect(normalizeDeckRecommendWorkerError(new Exception())).toBe("wasm engine failed to execute recommendation")
  })

  test("falls back to the constructor name or primitive value", () => {
    class WorkerFailure {}
    expect(normalizeDeckRecommendWorkerError(new WorkerFailure())).toBe("WorkerFailure")
    expect(normalizeDeckRecommendWorkerError("stopped")).toBe("stopped")
  })
})
