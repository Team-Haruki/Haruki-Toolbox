import { describe, expect, it } from "bun:test"
import { isEnvFlagEnabled } from "@/config/turnstile"

describe("turnstile config", () => {
  it("enables only explicit true values", () => {
    expect(isEnvFlagEnabled("true")).toBe(true)
    expect(isEnvFlagEnabled(" TRUE ")).toBe(true)
  })

  it("treats all other values as disabled", () => {
    expect(isEnvFlagEnabled("false")).toBe(false)
    expect(isEnvFlagEnabled("1")).toBe(false)
    expect(isEnvFlagEnabled("")).toBe(false)
    expect(isEnvFlagEnabled(undefined)).toBe(false)
    expect(isEnvFlagEnabled(null)).toBe(false)
  })
})
