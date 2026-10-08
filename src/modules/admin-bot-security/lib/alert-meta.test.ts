import { describe, expect, it } from "bun:test"
import {
  BOT_SECURITY_FILTER_ALL,
  botSecurityActionsFor,
  buildBotSecurityAlertQuery,
  buildBotSecurityAlertUpdatePayload,
  createDefaultBotSecurityFilters,
  formatBotSecurityWindow,
  getBotSecurityKindOptions,
  getBotSecurityStatusOptions,
  hasInvalidBotSecurityTimeRange,
  resolveBotSecurityHandlerLabel,
  resolveBotSecurityKindLabel,
  resolveBotSecurityStatusLabel,
} from "@/modules/admin-bot-security/lib/alert-meta"

const TEST_TRANSLATIONS: Record<string, string> = {
  "adminBotSecurity.common.fallback": "—",
  "adminBotSecurity.kind.authFailed": "Authentication failed",
  "adminBotSecurity.kind.rateLimited": "Rate limited",
  "adminBotSecurity.status.open": "Open",
  "adminBotSecurity.status.resolved": "Resolved",
  "adminBotSecurity.filters.allKinds": "All kinds",
  "adminBotSecurity.filters.allStatuses": "All statuses",
}

function t(key: string, params?: Record<string, unknown>) {
  if (key.startsWith("adminBotSecurity.window.")) {
    return `${String(params?.count)} ${key.slice("adminBotSecurity.window.".length)}`
  }
  return TEST_TRANSLATIONS[key] ?? key
}

describe("bot security alert labels", () => {
  it("localizes known kinds and keeps unknown kinds raw", () => {
    expect(resolveBotSecurityKindLabel("auth_failed", t)).toBe("Authentication failed")
    expect(resolveBotSecurityKindLabel("quantum_tunnel", t)).toBe("quantum_tunnel")
    expect(resolveBotSecurityKindLabel("", t)).toBe("—")
    expect(resolveBotSecurityKindLabel(null, t)).toBe("—")
    // Prototype members are not kinds.
    expect(resolveBotSecurityKindLabel("toString", t)).toBe("toString")
  })

  it("localizes statuses and keeps unknown statuses raw", () => {
    expect(resolveBotSecurityStatusLabel("open", t)).toBe("Open")
    expect(resolveBotSecurityStatusLabel("archived", t)).toBe("archived")
    expect(resolveBotSecurityStatusLabel(undefined, t)).toBe("—")
  })

  it("offers every status plus an all option", () => {
    expect(getBotSecurityStatusOptions(t).map((option) => option.value))
      .toEqual(["open", "resolved", "ignored", BOT_SECURITY_FILTER_ALL])
  })

  it("adds unseen kinds to the kind options once, after the known ones", () => {
    const options = getBotSecurityKindOptions(t, ["rate_limited", "zeta_kind", "alpha_kind", "zeta_kind", "", "all"])
    const values = options.map((option) => option.value)
    expect(values[0]).toBe(BOT_SECURITY_FILTER_ALL)
    expect(values).toContain("policy_unavailable")
    expect(values.filter((value) => value === "rate_limited")).toHaveLength(1)
    expect(values.slice(-2)).toEqual(["alpha_kind", "zeta_kind"])
    expect(options.at(-1)).toEqual({ value: "zeta_kind", label: "zeta_kind" })
  })

  it("prefers the handler name and falls back to the user id", () => {
    expect(resolveBotSecurityHandlerLabel({ userId: "1001", name: "Admin" })).toBe("Admin")
    expect(resolveBotSecurityHandlerLabel({ userId: "1001", name: "" })).toBe("1001")
    expect(resolveBotSecurityHandlerLabel(null)).toBe("")
  })
})

describe("bot security alert query", () => {
  it("defaults to open alerts", () => {
    expect(buildBotSecurityAlertQuery(createDefaultBotSecurityFilters(), 1, 20))
      .toEqual({ page: 1, pageSize: 20, status: "open" })
  })

  it("leaves out all and blank filters and trims the bot id", () => {
    const from = new Date("2026-09-01T00:00:00Z")
    const to = new Date("2026-09-02T12:30:00Z")
    expect(buildBotSecurityAlertQuery({
      status: BOT_SECURITY_FILTER_ALL,
      kind: "auth_failed",
      botId: "  30042042 ",
      from,
      to,
    }, 3, 50)).toEqual({
      page: 3,
      pageSize: 50,
      kind: "auth_failed",
      botId: "30042042",
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-09-02T12:30:00.000Z",
    })

    expect(buildBotSecurityAlertQuery({ status: "resolved", kind: BOT_SECURITY_FILTER_ALL, botId: "   " }, 1, 20))
      .toEqual({ page: 1, pageSize: 20, status: "resolved" })
  })

  it("rejects a range that ends before it starts", () => {
    const early = new Date("2026-09-01T00:00:00Z")
    const late = new Date("2026-09-02T00:00:00Z")
    expect(hasInvalidBotSecurityTimeRange({ from: late, to: early })).toBe(true)
    expect(hasInvalidBotSecurityTimeRange({ from: early, to: late })).toBe(false)
    expect(hasInvalidBotSecurityTimeRange({ from: late })).toBe(false)
  })
})

describe("bot security alert updates", () => {
  it("omits an unchanged note so the backend keeps it", () => {
    expect(buildBotSecurityAlertUpdatePayload({ note: "credential reset" }, "resolved", "  credential reset "))
      .toEqual({ status: "resolved" })
    expect(buildBotSecurityAlertUpdatePayload({ note: "" }, "ignored", "   "))
      .toEqual({ status: "ignored" })
  })

  it("sends a changed note trimmed, and an empty note to clear it", () => {
    expect(buildBotSecurityAlertUpdatePayload({ note: "" }, "resolved", "  rotated token  "))
      .toEqual({ status: "resolved", note: "rotated token" })
    expect(buildBotSecurityAlertUpdatePayload({ note: "old note" }, "open", " "))
      .toEqual({ status: "open", note: "" })
  })

  it("offers the status changes that make sense for each status", () => {
    expect(botSecurityActionsFor("open")).toEqual(["resolve", "ignore"])
    expect(botSecurityActionsFor("resolved")).toEqual(["reopen", "ignore"])
    expect(botSecurityActionsFor("ignored")).toEqual(["reopen", "resolve"])
    expect(botSecurityActionsFor("archived")).toEqual([])
  })
})

describe("bot security alert window", () => {
  it("uses the largest unit that divides the window", () => {
    expect(formatBotSecurityWindow(600, t)).toBe("10 minutes")
    expect(formatBotSecurityWindow(3_600, t)).toBe("1 hours")
    expect(formatBotSecurityWindow(172_800, t)).toBe("2 days")
    expect(formatBotSecurityWindow(90, t)).toBe("90 seconds")
    expect(formatBotSecurityWindow(0, t)).toBe("—")
  })
})
