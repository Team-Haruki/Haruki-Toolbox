import { describe, expect, test } from "bun:test"
import { formatRiskRules, parseRiskRules } from "./rules"

const validRule = { id: "r1", name: "Rule", description: "desc", enabled: true, config: { threshold: 3 } }

describe("parseRiskRules", () => {
  test("accepts an array of rules and strips a null config", () => {
    const result = parseRiskRules(JSON.stringify([validRule, { ...validRule, id: "r2", config: null }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rules).toHaveLength(2)
    expect(result.rules[0]?.config).toEqual({ threshold: 3 })
    expect(result.rules[1]?.config).toBeUndefined()
  })

  test("reports invalid JSON, a non-array root and the first bad rule", () => {
    expect(parseRiskRules("{")).toEqual({ ok: false, error: { kind: "invalidJson" } })
    expect(parseRiskRules("{}")).toEqual({ ok: false, error: { kind: "notArray" } })
    expect(parseRiskRules(JSON.stringify([validRule, { id: 1 }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 2 },
    })
    expect(parseRiskRules(JSON.stringify([{ ...validRule, config: "x" }]))).toEqual({
      ok: false,
      error: { kind: "invalidRule", index: 1 },
    })
  })

  test("formatRiskRules round-trips", () => {
    const text = formatRiskRules([validRule])
    const result = parseRiskRules(text)
    expect(result.ok).toBe(true)
    if (result.ok) expect(formatRiskRules(result.rules)).toBe(text)
  })
})
