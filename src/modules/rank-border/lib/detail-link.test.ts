import { describe, expect, it } from "bun:test"
import { buildRankBorderDetailQuery, parseRankBorderDetailQuery, resolveQuickFactsDetailTarget } from "./detail-link"

describe("rank border detail links", () => {
  it("pins the player holding a seat when opening full details", () => {
    expect(resolveQuickFactsDetailTarget({ kind: "rank", rank: 3, userId: " abc " })).toEqual({ kind: "user", userId: "abc" })
  })

  it("follows the rank only for an empty seat, and lines stay lines", () => {
    expect(resolveQuickFactsDetailTarget({ kind: "rank", rank: 3, userId: null })).toEqual({ kind: "rank", rank: 3 })
    expect(resolveQuickFactsDetailTarget({ kind: "rank", rank: 3, userId: "  " })).toEqual({ kind: "rank", rank: 3 })
    expect(resolveQuickFactsDetailTarget({ kind: "line", rank: 500, userId: "abc" })).toEqual({ kind: "line", rank: 500 })
  })

  it("keeps a chapter-mode link without a chapter so the page can resolve it", () => {
    expect(parseRankBorderDetailQuery({ region: "cn", event: "170", mode: "world_bloom", target: "rank:1" })).toEqual({
      region: "cn",
      eventId: 170,
      mode: "world_bloom",
      worldBloomCharacterId: null,
      intervalSeconds: 3600,
      target: { kind: "rank", rank: 1 },
    })
  })

  it("round-trips a pinned World Link player through the URL", () => {
    const query = buildRankBorderDetailQuery(
      { region: "cn", eventId: 170, mode: "world_bloom", worldBloomCharacterId: 20, intervalSeconds: 3600 },
      { kind: "user", userId: "abc" },
    )
    expect(parseRankBorderDetailQuery(query as Record<string, string>)).toEqual({
      region: "cn",
      eventId: 170,
      mode: "world_bloom",
      worldBloomCharacterId: 20,
      intervalSeconds: 3600,
      target: { kind: "user", userId: "abc", own: false },
    })
  })
})
