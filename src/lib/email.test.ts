import { describe, expect, test } from "bun:test"
import { isValidEmail } from "./email"

describe("isValidEmail", () => {
  test("accepts ordinary addresses and trims whitespace", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
    expect(isValidEmail("  first.last+tag@sub.example.co.jp ")).toBe(true)
  })

  test("rejects empty, missing parts and spaces", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("   ")).toBe(false)
    expect(isValidEmail("user")).toBe(false)
    expect(isValidEmail("user@")).toBe(false)
    expect(isValidEmail("@example.com")).toBe(false)
    expect(isValidEmail("user@example")).toBe(false)
    expect(isValidEmail("us er@example.com")).toBe(false)
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false)
  })
})
