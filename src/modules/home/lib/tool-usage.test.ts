import { describe, expect, it } from "bun:test"
import {
  TOOL_USAGE_STORAGE_KEY,
  addToolVisit,
  matchToolUrl,
  rankFrequentTools,
  readToolUsage,
  recordToolVisit,
} from "./tool-usage"

const TOOLS = ["/cards", "/cards/box", "/music", "/rank-border", "/deck-recommend"]
const DAY = 24 * 60 * 60 * 1000

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe("matchToolUrl", () => {
  it("picks the most specific tool for a path", () => {
    expect(matchToolUrl("/cards", TOOLS)).toBe("/cards")
    expect(matchToolUrl("/cards/box", TOOLS)).toBe("/cards/box")
    expect(matchToolUrl("/cards/1234", TOOLS)).toBe("/cards")
    expect(matchToolUrl("/rank-border/detail", TOOLS)).toBe("/rank-border")
  })

  it("ignores pages that are not tools and lookalike prefixes", () => {
    expect(matchToolUrl("/", TOOLS)).toBeNull()
    expect(matchToolUrl("/user/settings", TOOLS)).toBeNull()
    expect(matchToolUrl("/music-progress", TOOLS)).toBeNull()
  })
})

describe("tool usage storage", () => {
  it("counts visits per tool", () => {
    const storage = createStorage()
    recordToolVisit("/cards/12", TOOLS, 1_000, storage)
    recordToolVisit("/cards", TOOLS, 2_000, storage)
    recordToolVisit("/about", TOOLS, 3_000, storage)
    expect(readToolUsage(storage)).toEqual({ "/cards": { count: 2, lastUsedAt: 2_000 } })
  })

  it("recovers from damaged or missing data", () => {
    expect(readToolUsage(createStorage({ [TOOL_USAGE_STORAGE_KEY]: "not json" }))).toEqual({})
    expect(readToolUsage(createStorage({ [TOOL_USAGE_STORAGE_KEY]: "[1]" }))).toEqual({})
    expect(
      readToolUsage(createStorage({ [TOOL_USAGE_STORAGE_KEY]: JSON.stringify({ "/cards": { count: "x" }, "/music": { count: 1, lastUsedAt: 5 } }) }))
    ).toEqual({ "/music": { count: 1, lastUsedAt: 5 } })
    expect(readToolUsage(null)).toEqual({})
  })
})

describe("rankFrequentTools", () => {
  it("orders by use and lets old habits fade", () => {
    const now = 100 * DAY
    let usage = {}
    for (let index = 0; index < 5; index += 1) usage = addToolVisit(usage, "/music", now - 90 * DAY)
    for (let index = 0; index < 2; index += 1) usage = addToolVisit(usage, "/deck-recommend", now - DAY)
    usage = addToolVisit(usage, "/rank-border", now)
    expect(rankFrequentTools(usage, TOOLS, 3, now)).toEqual(["/deck-recommend", "/rank-border", "/music"])
  })

  it("drops tools that no longer exist and honours the limit", () => {
    const usage = { "/gone": { count: 9, lastUsedAt: 10 }, "/cards": { count: 1, lastUsedAt: 10 }, "/music": { count: 2, lastUsedAt: 10 } }
    expect(rankFrequentTools(usage, TOOLS, 1, 10)).toEqual(["/music"])
  })
})
