import { beforeAll, describe, expect, it } from "bun:test"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { isUnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import { parseUploadAnalytics } from "./dashboard-analytics"

beforeAll(() => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  setI18nLocale("zh-CN")
})

const metrics = (attemptCount: number, successCount: number) => ({
  attemptCount,
  successCount,
  failureCount: attemptCount - successCount,
  successRate: attemptCount > 0 ? successCount / attemptCount : null,
  activeGameAccounts: 3,
  latencySampleCount: attemptCount,
  latencyP50Ms: 120.5,
  latencyP95Ms: 900,
  metadataCount: 0,
  metadataCoverage: 0,
})

describe("parseUploadAnalytics", () => {
  it("reads the summary, orders methods and failure stages, and keeps the protocol split", () => {
    const parsed = parseUploadAnalytics({
      from: "2026-11-09T00:00:00Z",
      to: "2026-11-10T00:00:00Z",
      groupBy: ["upload_method"],
      summary: metrics(110, 104),
      groups: [
        { dimensions: { upload_method: "manual" }, ...metrics(10, 8) },
        { dimensions: { upload_method: "haruki_proxy" }, ...metrics(100, 96) },
      ],
      byFailureStage: { persist: 1, decode_payload: 4, unknown: 1, preprocess: 0 },
      migration: { v2Success: 24, v3Success: 72, unknownProtocolSuccess: 0, v3Share: 0.75, v2OnlyAccounts: 5 },
    })
    expect(parsed.summary.attemptCount).toBe(110)
    expect(parsed.summary.successRate).toBeCloseTo(104 / 110)
    expect(parsed.summary.latencyP95Ms).toBe(900)
    expect(parsed.methods.map((row) => [row.method, row.attemptCount, row.failureCount])).toEqual([
      ["haruki_proxy", 100, 4],
      ["manual", 10, 2],
    ])
    expect(parsed.failureStages).toEqual([
      { key: "decode_payload", count: 4 },
      { key: "persist", count: 1 },
      { key: "unknown", count: 1 },
    ])
    expect(parsed.migration).toEqual({ v2Success: 24, v3Success: 72, v3Share: 0.75, v2OnlyAccounts: 5 })
  })

  it("keeps missing rates and latencies as null and tolerates absent lists", () => {
    const parsed = parseUploadAnalytics({
      summary: { attemptCount: 0, successCount: 0, failureCount: 0, successRate: null, activeGameAccounts: 0, latencyP50Ms: null, latencyP95Ms: null },
      groups: [{ dimensions: { upload_method: null }, attemptCount: 2 }, "junk"],
    })
    expect(parsed.summary.successRate).toBeNull()
    expect(parsed.summary.latencyP50Ms).toBeNull()
    expect(parsed.methods).toHaveLength(1)
    expect(parsed.methods[0]?.method).toBe("")
    expect(parsed.failureStages).toEqual([])
    expect(parsed.migration.v3Share).toBeNull()
  })

  it("rejects a payload without a summary", () => {
    for (const payload of [null, [], { items: [] }, { summary: {} }]) {
      try {
        parseUploadAnalytics(payload)
        throw new Error("expected a throw")
      } catch (error) {
        expect(isUnexpectedPayloadError(error)).toBe(true)
        expect((error as { path: string }).path).toContain("upload-analytics")
      }
    }
  })
})
