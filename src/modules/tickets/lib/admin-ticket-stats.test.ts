import { describe, expect, it } from "bun:test"
import {
  buildAdminTicketCountQueries,
  countTicketCategories,
  summarizeAdminTicketCounts,
  wholePercent,
} from "./admin-ticket-stats"

describe("buildAdminTicketCountQueries", () => {
  it("asks for one row per figure, each with a single filter", () => {
    const queries = buildAdminTicketCountQueries()
    expect(queries.map((query) => query.key)).toEqual([
      "status:pending_admin",
      "status:open",
      "status:pending_user",
      "status:resolved",
      "status:closed",
      "priority:urgent",
      "priority:high",
      "priority:normal",
      "priority:low",
      "unassigned",
      "mine",
    ])
    for (const query of queries) {
      expect(query.params.page).toBe(1)
      expect(query.params.page_size).toBe(1)
      expect(Object.keys(query.params)).toHaveLength(3)
    }
    expect(queries[0]!.params.status).toBe("pending_admin")
    expect(queries[5]!.params.priority).toBe("urgent")
    expect(queries[9]!.params.quick_filter).toBe("unassigned")
    expect(queries[10]!.params.quick_filter).toBe("mine")
  })
})

describe("summarizeAdminTicketCounts", () => {
  const full = {
    "status:open": 4,
    "status:pending_admin": 9,
    "status:pending_user": 6,
    "status:resolved": 11,
    "status:closed": 27,
    "priority:urgent": 2,
    "priority:high": 8,
    "priority:normal": 40,
    "priority:low": 7,
    unassigned: 19,
    mine: 5,
  } as const

  it("adds the statuses up to the total and the tickets still in play", () => {
    const summary = summarizeAdminTicketCounts(full)
    expect(summary.total).toBe(57)
    expect(summary.active).toBe(19)
    expect(summary.unassigned).toBe(19)
    expect(summary.mine).toBe(5)
    expect(summary.byStatus).toEqual([
      { key: "pending_admin", count: 9 },
      { key: "open", count: 4 },
      { key: "pending_user", count: 6 },
      { key: "resolved", count: 11 },
      { key: "closed", count: 27 },
    ])
    expect(summary.byPriority.map((entry) => entry.key)).toEqual(["urgent", "high", "normal", "low"])
  })

  it("leaves a total unknown rather than undercounting when a status is missing", () => {
    const summary = summarizeAdminTicketCounts({ ...full, "status:closed": null })
    expect(summary.total).toBeNull()
    expect(summary.active).toBe(19)
    expect(summary.status.closed).toBeNull()
    expect(summary.byStatus.map((entry) => entry.key)).toEqual(["pending_admin", "open", "pending_user", "resolved"])
  })

  it("treats nothing loaded, negative and non-finite counts as unknown", () => {
    const summary = summarizeAdminTicketCounts({ "status:open": -1, "priority:high": Number.NaN })
    expect(summary.total).toBeNull()
    expect(summary.active).toBeNull()
    expect(summary.status.open).toBeNull()
    expect(summary.priority.high).toBeNull()
    expect(summary.unassigned).toBeNull()
    expect(summary.byStatus).toEqual([])
    expect(summary.byPriority).toEqual([])
  })

  it("keeps zero as a real count", () => {
    const summary = summarizeAdminTicketCounts({
      "status:open": 0,
      "status:pending_admin": 0,
      "status:pending_user": 0,
      "status:resolved": 0,
      "status:closed": 0,
    })
    expect(summary.total).toBe(0)
    expect(summary.byStatus).toHaveLength(5)
  })
})

describe("countTicketCategories", () => {
  it("tallies the given rows in the fixed category order and drops empty categories", () => {
    const rows = [
      { category: "bug" },
      { category: "upload" },
      { category: "bug" },
      { category: "other" },
    ] as const
    expect(countTicketCategories(rows)).toEqual([
      { key: "upload", count: 1 },
      { key: "bug", count: 2 },
      { key: "other", count: 1 },
    ])
  })

  it("is empty for no rows", () => {
    expect(countTicketCategories([])).toEqual([])
  })
})

describe("wholePercent", () => {
  it("rounds the share to a whole percentage and clamps it", () => {
    expect(wholePercent(9, 57)).toBe(16)
    expect(wholePercent(57, 57)).toBe(100)
    expect(wholePercent(0, 57)).toBe(0)
    expect(wholePercent(80, 57)).toBe(100)
  })

  it("has no answer without a total", () => {
    expect(wholePercent(3, 0)).toBeNull()
    expect(wholePercent(3, null)).toBeNull()
    expect(wholePercent(Number.NaN, 10)).toBeNull()
  })
})
