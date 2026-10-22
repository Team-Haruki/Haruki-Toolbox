import { describe, expect, test } from "bun:test"
import { parseBotSecurityFiltersQuery, writeBotSecurityFiltersQuery } from "./alert-meta"

describe("bot security filter query codec", () => {
  test("parses a shared URL and falls back for unknown values", () => {
    const filters = parseBotSecurityFiltersQuery({
      status: "resolved",
      kind: "auth_failed",
      bot: " bot-1 ",
      from: "2026-01-01T00:00:00.000Z",
      to: "garbage",
    })
    expect(filters.status).toBe("resolved")
    expect(filters.kind).toBe("auth_failed")
    expect(filters.botId).toBe("bot-1")
    expect(filters.from?.toISOString()).toBe("2026-01-01T00:00:00.000Z")
    expect(filters.to).toBeUndefined()

    const fallback = parseBotSecurityFiltersQuery({ status: "nope" })
    expect(fallback.status).toBe("open")
    expect(fallback.kind).toBe("all")
    expect(fallback.botId).toBe("")
  })

  test("writes only non-default values", () => {
    expect(writeBotSecurityFiltersQuery({ status: "open", kind: "all", botId: "", from: undefined, to: undefined })).toEqual({
      status: undefined,
      kind: undefined,
      bot: undefined,
      from: undefined,
      to: undefined,
    })
    const record = writeBotSecurityFiltersQuery({
      status: "ignored",
      kind: "rate_limited",
      botId: "bot-2",
      from: new Date("2026-02-01T00:00:00.000Z"),
      to: undefined,
    })
    expect(record).toEqual({
      status: "ignored",
      kind: "rate_limited",
      bot: "bot-2",
      from: "2026-02-01T00:00:00.000Z",
      to: undefined,
    })
  })
})
