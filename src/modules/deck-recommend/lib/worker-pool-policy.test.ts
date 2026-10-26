import { describe, expect, test } from "bun:test"
import {
  detectDeckRecommendDeviceProfile,
  isDeckRecommendParallelLimited,
  partitionDeckRecommendAlgorithms,
  resolveDeckRecommendWorkerCap,
  resolveDeckRecommendWorkerCount,
  resolveDeckRecommendWorkerIdleDisposeMs,
} from "./worker-pool-policy"

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const IPHONE_CHROME_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1"
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

describe("detectDeckRecommendDeviceProfile", () => {
  test("iPhone Safari and Chrome are memory constrained", () => {
    expect(detectDeckRecommendDeviceProfile({ userAgent: IPHONE_UA, maxTouchPoints: 5, hardwareConcurrency: 6 }).memoryConstrained).toBe(true)
    expect(detectDeckRecommendDeviceProfile({ userAgent: IPHONE_CHROME_UA, maxTouchPoints: 5 }).memoryConstrained).toBe(true)
  })

  test("iPadOS pretending to be a Mac is recognised by its touch points", () => {
    expect(detectDeckRecommendDeviceProfile({ userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 5 }).memoryConstrained).toBe(true)
    expect(detectDeckRecommendDeviceProfile({ userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 0 }).memoryConstrained).toBe(false)
  })

  test("low device memory is constrained on any platform", () => {
    expect(detectDeckRecommendDeviceProfile({ userAgent: ANDROID_UA, maxTouchPoints: 5, deviceMemory: 4 }).memoryConstrained).toBe(true)
    expect(detectDeckRecommendDeviceProfile({ userAgent: WINDOWS_UA, deviceMemory: 2 }).memoryConstrained).toBe(true)
  })

  test("android with enough memory is a touch device, not constrained", () => {
    const profile = detectDeckRecommendDeviceProfile({ userAgent: ANDROID_UA, maxTouchPoints: 5, deviceMemory: 8, hardwareConcurrency: 8 })
    expect(profile).toEqual({ memoryConstrained: false, touchDevice: true, hardwareConcurrency: 8 })
  })

  test("missing navigator yields an unconstrained desktop profile", () => {
    expect(detectDeckRecommendDeviceProfile(null)).toEqual({ memoryConstrained: false, touchDevice: false, hardwareConcurrency: null })
  })
})

describe("resolveDeckRecommendWorkerCount", () => {
  const desktop = { memoryConstrained: false, touchDevice: false, hardwareConcurrency: 10 }
  const dualCore = { memoryConstrained: false, touchDevice: false, hardwareConcurrency: 2 }
  const phone = { memoryConstrained: true, touchDevice: true, hardwareConcurrency: 6 }
  const tablet = { memoryConstrained: false, touchDevice: true, hardwareConcurrency: 8 }

  test("sequential mode always uses one engine", () => {
    expect(resolveDeckRecommendWorkerCount("sequential", 4, desktop)).toBe(1)
    expect(resolveDeckRecommendWorkerCount("sequential", 4, phone)).toBe(1)
  })

  test("parallel mode is capped by the device", () => {
    expect(resolveDeckRecommendWorkerCap(desktop)).toBe(4)
    expect(resolveDeckRecommendWorkerCount("parallel", 4, desktop)).toBe(4)
    expect(resolveDeckRecommendWorkerCount("parallel", 2, desktop)).toBe(2)
    expect(resolveDeckRecommendWorkerCount("parallel", 4, dualCore)).toBe(1)
    expect(resolveDeckRecommendWorkerCount("parallel", 4, tablet)).toBe(2)
    expect(resolveDeckRecommendWorkerCount("parallel", 4, phone)).toBe(1)
  })

  test("never returns less than one engine", () => {
    expect(resolveDeckRecommendWorkerCount("parallel", 0, desktop)).toBe(1)
  })

  test("reports when the device limits the requested parallelism", () => {
    expect(isDeckRecommendParallelLimited("parallel", 4, phone)).toBe(true)
    expect(isDeckRecommendParallelLimited("parallel", 1, phone)).toBe(false)
    expect(isDeckRecommendParallelLimited("sequential", 4, phone)).toBe(false)
    expect(isDeckRecommendParallelLimited("parallel", 4, desktop)).toBe(false)
  })

  test("constrained devices dispose engines immediately, others keep them warm", () => {
    expect(resolveDeckRecommendWorkerIdleDisposeMs(phone)).toBe(0)
    expect(resolveDeckRecommendWorkerIdleDisposeMs(desktop)).toBeGreaterThan(0)
  })
})

describe("partitionDeckRecommendAlgorithms", () => {
  test("round-robins algorithms over the workers", () => {
    expect(partitionDeckRecommendAlgorithms(["dfs_ga", "dfs", "ga", "rl"], 2)).toEqual([["dfs_ga", "ga"], ["dfs", "rl"]])
    expect(partitionDeckRecommendAlgorithms(["dfs_ga", "dfs", "ga", "rl"], 4)).toEqual([["dfs_ga"], ["dfs"], ["ga"], ["rl"]])
    expect(partitionDeckRecommendAlgorithms(["dfs_ga", "dfs", "ga"], 1)).toEqual([["dfs_ga", "dfs", "ga"]])
  })

  test("never creates more groups than algorithms", () => {
    expect(partitionDeckRecommendAlgorithms(["dfs"], 4)).toEqual([["dfs"]])
    expect(partitionDeckRecommendAlgorithms([], 4)).toEqual([])
  })
})
