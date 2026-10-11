import { describe, expect, it } from "bun:test"
import { formatRelativeTime } from "./relative-time"

describe("formatRelativeTime", () => {
  const now = 1_000_000_000
  it("picks the largest whole unit", () => {
    expect(formatRelativeTime(1_000_000 - 5, "en-US", now)).toBe("5s ago")
    expect(formatRelativeTime(1_000_000 - 125, "en-US", now)).toBe("2m ago")
    expect(formatRelativeTime(1_000_000 - 7_200, "en-US", now)).toBe("2h ago")
    expect(formatRelativeTime(1_000_000 - 172_800, "en-US", now)).toBe("2d ago")
  })

  it("never says 'in' for clock skew", () => {
    expect(formatRelativeTime(1_000_000 + 30, "en-US", now)).toBe("0s ago")
  })
})
