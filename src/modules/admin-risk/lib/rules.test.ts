import { describe, expect, test } from "bun:test"
import { diffRiskRules, formatRiskRules, mergeSavedRiskRules, parseRiskRules } from "./rules"
import type { RiskRuleItem } from "@/modules/admin-risk/api/types"

const validRule = { key: "login.failed_burst", description: "desc", config: { threshold: 3 } }

function stored(key: string, config: Record<string, unknown> = {}, description = ""): RiskRuleItem {
  return { key, description, config, updatedAt: "2026-10-01T00:00:00Z", updatedBy: "1001" }
}

describe("parseRiskRules", () => {
  test("accepts an array of rules, trims keys and fills in the optional members", () => {
    const result = parseRiskRules(JSON.stringify([
      validRule,
      { key: " upload.rate ", config: null, updatedAt: "2026-10-01T00:00:00Z" },
      { key: "bare" },
    ]))
    expect(result).toEqual({
      ok: true,
      rules: [
        validRule,
        { key: "upload.rate", description: "", config: {} },
        { key: "bare", description: "", config: {} },
      ],
    })
  })

  test("accepts an empty array", () => {
    expect(parseRiskRules("[]")).toEqual({ ok: true, rules: [] })
  })

  test("reports invalid JSON, a non-array root and the first bad rule", () => {
    expect(parseRiskRules("{")).toEqual({ ok: false, error: { kind: "invalidJson" } })
    expect(parseRiskRules("{}")).toEqual({ ok: false, error: { kind: "notArray" } })
    expect(parseRiskRules(JSON.stringify([validRule, { key: 1 }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 2 },
    })
    expect(parseRiskRules(JSON.stringify([{ ...validRule, config: "x" }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
    expect(parseRiskRules(JSON.stringify([{ ...validRule, config: [] }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
    expect(parseRiskRules(JSON.stringify([{ ...validRule, description: 5 }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
    expect(parseRiskRules(JSON.stringify([{ key: "  " }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
    expect(parseRiskRules(JSON.stringify([{ key: "k".repeat(65) }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
  })

  test("reports a repeated key and too many rules", () => {
    expect(parseRiskRules(JSON.stringify([validRule, { key: "other" }, { key: " login.failed_burst" }]))).toEqual({
      ok: false,
      error: { kind: "duplicateKey", index: 3, key: "login.failed_burst" },
    })
    const many = Array.from({ length: 101 }, (_, index) => ({ key: `rule-${index}` }))
    expect(parseRiskRules(JSON.stringify(many))).toEqual({ ok: false, error: { kind: "tooMany", max: 100 } })
  })

  test("formatRiskRules round-trips and leaves out what the backend sets", () => {
    const text = formatRiskRules([stored("a", { x: 1 }, "first")])
    expect(JSON.parse(text)).toEqual([{ key: "a", description: "first", config: { x: 1 } }])
    const result = parseRiskRules(text)
    expect(result.ok).toBe(true)
    if (result.ok) expect(formatRiskRules(result.rules)).toBe(text)
  })
})

describe("diffRiskRules", () => {
  const saved = [stored("a", { threshold: 3, window: 600 }, "first"), stored("b"), stored("c")]

  test("tells new, changed and unchanged rules apart", () => {
    const diff = diffRiskRules(saved, [
      // Same content, other key order and spacing: not a change.
      { key: "a", description: " first ", config: { window: 600, threshold: 3 } },
      { key: "b", description: "now described", config: {} },
      { key: "d", description: "", config: { on: true } },
    ])
    expect(diff.entries.map((entry) => [entry.rule.key, entry.change])).toEqual([
      ["a", "unchanged"],
      ["b", "changed"],
      ["d", "new"],
    ])
    expect(diff.entries[0]?.saved).toBe(saved[0]!)
    expect(diff.entries[2]?.saved).toBeNull()
    expect(diff.added).toBe(1)
    expect(diff.changed).toBe(1)
    expect(diff.omitted).toEqual(["c"])
  })

  test("sees a nested config change", () => {
    const diff = diffRiskRules(
      [stored("a", { limits: { perHour: [1, 2] } })],
      [{ key: "a", description: "", config: { limits: { perHour: [1, 3] } } }],
    )
    expect(diff.changed).toBe(1)
  })

  test("is empty for an untouched draft", () => {
    const diff = diffRiskRules(saved, saved)
    expect(diff.added + diff.changed).toBe(0)
    expect(diff.omitted).toEqual([])
  })
})

describe("mergeSavedRiskRules", () => {
  test("replaces by key, adds new rules and keeps the list sorted", () => {
    const merged = mergeSavedRiskRules(
      [stored("a"), stored("c")],
      [{ ...stored("c", { x: 1 }), updatedAt: "2026-11-01T00:00:00Z" }, stored("b")],
    )
    expect(merged.map((rule) => rule.key)).toEqual(["a", "b", "c"])
    expect(merged[2]?.config).toEqual({ x: 1 })
    expect(merged[2]?.updatedAt).toBe("2026-11-01T00:00:00Z")
  })
})
