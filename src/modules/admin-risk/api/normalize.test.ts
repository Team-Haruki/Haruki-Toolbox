import { describe, expect, it } from "bun:test"
import { normalizeRiskEvent, normalizeRiskEventPage } from "./event"
import { normalizeRiskRuleList } from "./rule"

describe("normalizeRiskEvent", () => {
  it("maps an event as the backend sends it", () => {
    expect(normalizeRiskEvent({
      id: 12,
      eventTime: "2026-11-09T08:30:00Z",
      status: "open",
      severity: "Critical",
      source: "automated",
      actorUserId: "2001",
      targetUserId: "8532047001",
      ip: "198.51.100.7",
      action: "suspicious_login",
      reason: "14 failed logins",
      metadata: { attempts: 14 },
    })).toEqual({
      id: "12",
      eventTime: "2026-11-09T08:30:00Z",
      status: "open",
      severity: "critical",
      source: "automated",
      actorUserId: "2001",
      targetUserId: "8532047001",
      ip: "198.51.100.7",
      action: "suspicious_login",
      reason: "14 failed logins",
      resolvedAt: null,
      resolvedBy: "",
      metadata: { attempts: 14 },
    })
  })

  it("fills in the members the backend omits and keeps the resolution", () => {
    const event = normalizeRiskEvent({
      id: 3,
      eventTime: "2026-11-01T00:00:00Z",
      status: "resolved",
      severity: "low",
      source: "manual",
      resolvedAt: "2026-11-02T00:00:00Z",
      resolvedBy: "1001",
      metadata: {},
    })
    expect(event).toMatchObject({
      actorUserId: "",
      targetUserId: "",
      ip: "",
      action: "",
      reason: "",
      resolvedAt: "2026-11-02T00:00:00Z",
      resolvedBy: "1001",
      metadata: null,
    })
  })

  it("drops entries without an id", () => {
    expect(normalizeRiskEvent({ status: "open" })).toBeNull()
    expect(normalizeRiskEvent(null)).toBeNull()
  })
})

describe("normalizeRiskEventPage", () => {
  it("reads the items, the total and the applied window", () => {
    const page = normalizeRiskEventPage({
      from: "2026-10-10T09:00:00Z",
      to: "2026-11-09T09:00:00Z",
      total: 63,
      items: [{ id: 1, status: "open" }, { status: "open" }],
    })
    expect(page.items.map((item) => item.id)).toEqual(["1"])
    expect(page.total).toBe(63)
    expect(page.from).toBe("2026-10-10T09:00:00Z")
    expect(page.to).toBe("2026-11-09T09:00:00Z")
  })

  it("is empty for a malformed payload", () => {
    expect(normalizeRiskEventPage(null)).toEqual({ items: [], total: 0, from: "", to: "" })
  })
})

describe("normalizeRiskRuleList", () => {
  it("reads the items of the list response", () => {
    expect(normalizeRiskRuleList({
      generatedAt: "2026-11-09T09:00:00Z",
      items: [
        { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 10 }, updatedAt: "2026-10-21T08:12:00Z", updatedBy: "1001" },
        { key: "upload.rate_spike", config: null, updatedAt: "2026-09-02T03:40:00Z" },
        { description: "no key" },
      ],
    })).toEqual([
      { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 10 }, updatedAt: "2026-10-21T08:12:00Z", updatedBy: "1001" },
      { key: "upload.rate_spike", description: "", config: {}, updatedAt: "2026-09-02T03:40:00Z", updatedBy: "" },
    ])
  })

  it("is empty when the payload is not a list response", () => {
    expect(normalizeRiskRuleList([{ key: "a" }])).toEqual([])
    expect(normalizeRiskRuleList(undefined)).toEqual([])
  })
})
