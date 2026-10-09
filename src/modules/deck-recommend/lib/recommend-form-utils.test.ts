import { describe, expect, it } from "bun:test"
import { parseWorldBloomTurn } from "./recommend-form-utils"

describe("parseWorldBloomTurn", () => {
  it("accepts turns 1 to 3", () => {
    expect(parseWorldBloomTurn("1")).toBe(1)
    expect(parseWorldBloomTurn("3")).toBe(3)
  })

  it("rejects missing, fractional and out-of-range values", () => {
    expect(parseWorldBloomTurn(null)).toBeNull()
    expect(parseWorldBloomTurn("")).toBeNull()
    expect(parseWorldBloomTurn("1.5")).toBeNull()
    expect(parseWorldBloomTurn("4")).toBeNull()
  })
})
