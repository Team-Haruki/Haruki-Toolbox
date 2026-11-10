import { describe, expect, it } from "bun:test"
import {
  botSecurityKindTone,
  buildBotSecurityTimeline,
  dailyAlertAverage,
  handledAlertTotal,
  summarizeBotSecurityRows,
} from "./alert-stats"
import type { BotSecurityAlert } from "@/types/admin"

function alert(overrides: Partial<BotSecurityAlert>): BotSecurityAlert {
  return {
    id: 1,
    kind: "auth_failed",
    botId: null,
    ownerQq: null,
    sourceIp: "",
    buildId: "",
    clientVersion: "",
    reason: "",
    enforced: false,
    count: 1,
    threshold: 1,
    windowSeconds: 600,
    node: "",
    alertTime: "2026-09-02T09:00:00Z",
    receivedAt: "2026-09-02T09:00:00Z",
    status: "open",
    note: "",
    handledBy: null,
    handledAt: null,
    ...overrides,
  }
}

describe("botSecurityKindTone", () => {
  it("groups the known kinds and leaves unknown ones neutral", () => {
    expect(botSecurityKindTone("auth_failed")).toBe("danger")
    expect(botSecurityKindTone(" rate_limited ")).toBe("warning")
    expect(botSecurityKindTone("client_changed")).toBe("info")
    expect(botSecurityKindTone("policy_unavailable")).toBe("neutral")
    expect(botSecurityKindTone("quantum_tunnel")).toBe("neutral")
    expect(botSecurityKindTone("toString")).toBe("neutral")
  })
})

describe("summarizeBotSecurityRows", () => {
  it("counts enforcement and ranks the counting windows", () => {
    const stats = summarizeBotSecurityRows([
      alert({ enforced: true, windowSeconds: 600 }),
      alert({ enforced: false, windowSeconds: 600 }),
      alert({ enforced: true, windowSeconds: 3_600 }),
      alert({ enforced: true, windowSeconds: 60 }),
      alert({ enforced: false, windowSeconds: 0 }),
    ])
    expect(stats).toEqual({
      total: 5,
      enforced: 3,
      logOnly: 2,
      byWindow: [
        { seconds: 600, count: 2 },
        { seconds: 60, count: 1 },
        { seconds: 3_600, count: 1 },
      ],
    })
  })

  it("is all zero for an empty page", () => {
    expect(summarizeBotSecurityRows([])).toEqual({ total: 0, enforced: 0, logOnly: 0, byWindow: [] })
  })
})

describe("buildBotSecurityTimeline", () => {
  it("spreads the rows over equal slices, oldest first", () => {
    const timeline = buildBotSecurityTimeline([
      { alertTime: "2026-09-02T12:00:00Z" },
      { alertTime: "2026-09-02T00:00:00Z" },
      { alertTime: "2026-09-02T11:00:00Z" },
      { alertTime: "2026-09-02T03:00:00Z" },
    ], 4)
    expect(timeline).toEqual({
      counts: [1, 1, 0, 2],
      from: Date.parse("2026-09-02T00:00:00Z"),
      to: Date.parse("2026-09-02T12:00:00Z"),
    })
  })

  it("has nothing to draw without a span", () => {
    expect(buildBotSecurityTimeline([])).toBeNull()
    expect(buildBotSecurityTimeline([{ alertTime: "2026-09-02T00:00:00Z" }])).toBeNull()
    expect(buildBotSecurityTimeline([
      { alertTime: "2026-09-02T00:00:00Z" },
      { alertTime: "2026-09-02T00:00:00Z" },
    ])).toBeNull()
    expect(buildBotSecurityTimeline([{ alertTime: "" }, { alertTime: "not a date" }])).toBeNull()
  })
})

describe("handledAlertTotal", () => {
  it("adds the two counts once both are known", () => {
    expect(handledAlertTotal(4, 3)).toBe(7)
    expect(handledAlertTotal(null, 3)).toBeNull()
    expect(handledAlertTotal(4, null)).toBeNull()
  })
})

describe("dailyAlertAverage", () => {
  it("is the 7-day figure per day, to one decimal", () => {
    expect(dailyAlertAverage(7)).toBe(1)
    expect(dailyAlertAverage(10)).toBe(1.4)
    expect(dailyAlertAverage(0)).toBe(0)
    expect(dailyAlertAverage(Number.NaN)).toBe(0)
  })
})
