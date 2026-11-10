import { describe, expect, it } from "bun:test"
import {
  buildSystemLogFilterParams,
  countActiveSystemLogFilters,
  createDefaultSystemLogFilters,
  formatSystemLogMetadata,
  parseSystemLogFiltersQuery,
  resolveSystemLogRangeStart,
  resolveSystemLogTarget,
} from "./logs-system-query"

const NOW = Date.parse("2026-11-10T12:00:00Z")

describe("parseSystemLogFiltersQuery", () => {
  it("reads the filters a URL carries", () => {
    expect(parseSystemLogFiltersQuery({ q: "user.ban", result: "failure", actor: "admin", range: "7d" })).toEqual({
      search: "user.ban",
      result: "failure",
      actorType: "admin",
      range: "7d",
    })
  })

  it("falls back to the defaults for missing or unknown values", () => {
    expect(parseSystemLogFiltersQuery({ result: "maybe", actor: "robot", range: "1y" })).toEqual(createDefaultSystemLogFilters())
    expect(parseSystemLogFiltersQuery({})).toEqual({ search: "", result: "all", actorType: "all", range: "24h" })
  })
})

describe("resolveSystemLogRangeStart", () => {
  it("leaves the default 24 hours to the backend", () => {
    expect(resolveSystemLogRangeStart("24h", NOW)).toBeNull()
  })

  it("starts seven days back", () => {
    expect(resolveSystemLogRangeStart("7d", NOW)).toBe("2026-11-03T12:00:00.000Z")
  })

  it("stops the longest range short of the backend's 30-day limit", () => {
    expect(resolveSystemLogRangeStart("30d", NOW)).toBe("2026-10-11T12:10:00.000Z")
  })
})

describe("buildSystemLogFilterParams", () => {
  it("sends nothing for the default view", () => {
    expect(buildSystemLogFilterParams(createDefaultSystemLogFilters(), NOW)).toEqual({})
  })

  it("names every narrowing the way the backend reads it", () => {
    expect(
      buildSystemLogFilterParams({ search: "  user.ban ", result: "failure", actorType: "admin", range: "7d" }, NOW),
    ).toEqual({
      action: "user.ban",
      result: "failure",
      actor_type: "admin",
      from: "2026-11-03T12:00:00.000Z",
    })
  })
})

describe("countActiveSystemLogFilters", () => {
  it("counts the search, the result and the actor type, not the range", () => {
    expect(countActiveSystemLogFilters(createDefaultSystemLogFilters())).toBe(0)
    expect(countActiveSystemLogFilters({ search: " ", result: "all", actorType: "all", range: "30d" })).toBe(0)
    expect(countActiveSystemLogFilters({ search: "x", result: "success", actorType: "system", range: "24h" })).toBe(3)
  })
})

describe("resolveSystemLogTarget", () => {
  it("joins the target type and id", () => {
    expect(resolveSystemLogTarget({ targetType: "user", targetId: "123" })).toBe("user:123")
    expect(resolveSystemLogTarget({ targetType: "config" })).toBe("config")
    expect(resolveSystemLogTarget({ targetId: " 9 " })).toBe("9")
  })

  it("is null when the log names no target", () => {
    expect(resolveSystemLogTarget({})).toBeNull()
    expect(resolveSystemLogTarget({ targetType: " ", targetId: null })).toBeNull()
  })
})

describe("formatSystemLogMetadata", () => {
  it("pretty-prints the metadata object", () => {
    expect(formatSystemLogMetadata({ metadata: { reason: "banned", count: 2 } })).toBe('{\n  "reason": "banned",\n  "count": 2\n}')
  })

  it("falls back to the legacy detail string, as JSON when it parses", () => {
    expect(formatSystemLogMetadata({ detail: '{"a":1}' })).toBe('{\n  "a": 1\n}')
    expect(formatSystemLogMetadata({ detail: " plain text " })).toBe("plain text")
  })

  it("is empty when there is nothing to show", () => {
    expect(formatSystemLogMetadata(null)).toBe("")
    expect(formatSystemLogMetadata({})).toBe("")
    expect(formatSystemLogMetadata({ metadata: {} })).toBe("")
    expect(formatSystemLogMetadata({ metadata: null, detail: "" })).toBe("")
  })
})
