import { describe, expect, test } from "bun:test"
import { resolveEventRelatedGachas } from "./event-related-gachas"

const DAY = 24 * 60 * 60 * 1000
const START = Date.UTC(2024, 3, 1)
const EVENT = { startAt: START, aggregateAt: START + 8 * DAY, closedAt: START + 9 * DAY }

const GACHAS = [
  { id: 30, startAt: START + 30 * DAY, endAt: START + 40 * DAY, pickupCardIds: [900] },
  { id: 20, startAt: START - DAY, endAt: START + 8 * DAY, pickupCardIds: [501, 502] },
  { id: 19, startAt: START - 2 * DAY, endAt: START + 7 * DAY, pickupCardIds: [777] },
  { id: 10, startAt: START - 60 * DAY, endAt: START - 50 * DAY, pickupCardIds: [1] },
]

describe("resolveEventRelatedGachas", () => {
  test("prefers gachas featuring an event card as pickup", () => {
    const result = resolveEventRelatedGachas(EVENT, new Set([502, 503]), GACHAS)
    expect(result.matchedBy).toBe("pickup")
    expect(result.gachas.map((gacha) => gacha.id)).toEqual([20])
  })

  test("falls back to the ±3 day period overlap, keeping input order", () => {
    const result = resolveEventRelatedGachas(EVENT, new Set([1234]), GACHAS)
    expect(result.matchedBy).toBe("period")
    expect(result.gachas.map((gacha) => gacha.id)).toEqual([20, 19])
  })

  test("uses the fallback when the event has no cards", () => {
    expect(resolveEventRelatedGachas(EVENT, new Set(), GACHAS).matchedBy).toBe("period")
  })

  test("returns none when nothing relates or the event has no dates", () => {
    expect(resolveEventRelatedGachas(EVENT, new Set(), [GACHAS[0], GACHAS[3]])).toEqual({ gachas: [], matchedBy: "none" })
    expect(resolveEventRelatedGachas({ startAt: null, aggregateAt: null, closedAt: null }, new Set(), GACHAS)).toEqual({ gachas: [], matchedBy: "none" })
  })
})
