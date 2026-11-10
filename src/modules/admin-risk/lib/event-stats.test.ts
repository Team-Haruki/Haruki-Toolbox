import { describe, expect, it } from "bun:test"
import {
  countRiskEventSources,
  isRiskSeverity,
  riskEventRangeStart,
  riskResolutionRate,
  riskSeverityTone,
  sumKnown,
} from "./event-stats"

describe("riskEventRangeStart", () => {
  const now = new Date("2026-11-09T09:00:00Z")

  it("goes back the length of the window from now", () => {
    expect(riskEventRangeStart("24h", now).toISOString()).toBe("2026-11-08T09:00:00.000Z")
    expect(riskEventRangeStart("7d", now).toISOString()).toBe("2026-11-02T09:00:00.000Z")
    expect(riskEventRangeStart("30d", now).toISOString()).toBe("2026-10-10T09:00:00.000Z")
  })

  it("keeps the longest window inside the backend's 366-day cap", () => {
    const span = now.getTime() - riskEventRangeStart("365d", now).getTime()
    expect(span).toBeLessThanOrEqual(366 * 86_400_000)
  })
})

describe("severity helpers", () => {
  it("knows the four severities and tints them from critical down", () => {
    expect(isRiskSeverity("critical")).toBe(true)
    expect(isRiskSeverity("urgent")).toBe(false)
    expect(riskSeverityTone("critical")).toBe("danger")
    expect(riskSeverityTone("high")).toBe("warning")
    expect(riskSeverityTone("medium")).toBe("info")
    expect(riskSeverityTone("low")).toBe("neutral")
    expect(riskSeverityTone("urgent")).toBe("neutral")
  })
})

describe("countRiskEventSources", () => {
  it("ranks sources by count, then by name, and keeps the unnamed ones together", () => {
    expect(countRiskEventSources([
      { source: "manual" },
      { source: "automated" },
      { source: " automated " },
      { source: "" },
      { source: "dashboard" },
    ])).toEqual([
      { source: "automated", count: 2 },
      { source: "", count: 1 },
      { source: "dashboard", count: 1 },
      { source: "manual", count: 1 },
    ])
  })

  it("is empty for an empty page", () => {
    expect(countRiskEventSources([])).toEqual([])
  })
})

describe("riskResolutionRate", () => {
  it("is the resolved share of open plus resolved", () => {
    expect(riskResolutionRate(1, 3)).toBe(75)
    expect(riskResolutionRate(4, 0)).toBe(0)
  })

  it("has nothing to say without events or without both counts", () => {
    expect(riskResolutionRate(0, 0)).toBeNull()
    expect(riskResolutionRate(null, 3)).toBeNull()
    expect(riskResolutionRate(3, null)).toBeNull()
  })
})

describe("sumKnown", () => {
  it("adds only when both are known", () => {
    expect(sumKnown(2, 3)).toBe(5)
    expect(sumKnown(null, 3)).toBeNull()
    expect(sumKnown(2, null)).toBeNull()
  })
})
