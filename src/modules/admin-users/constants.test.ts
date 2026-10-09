import { describe, expect, it } from "bun:test"
import { isUserRole } from "./constants"

describe("isUserRole", () => {
  it("accepts only the known roles", () => {
    expect(isUserRole("user")).toBe(true)
    expect(isUserRole("super_admin")).toBe(true)
    expect(isUserRole("owner")).toBe(false)
    expect(isUserRole(1)).toBe(false)
  })
})
