import { describe, expect, it } from "bun:test"
import type { SekaiEventItem } from "@/modules/events"
import { GACHA_RELATED_EVENT_TOLERANCE_MS, resolveGachaRelatedEvents } from "./gacha-related"

const DAY = 24 * 60 * 60 * 1000

function event(id: number, startAt: number, aggregateAt: number): SekaiEventItem {
  return {
    id,
    name: `Event ${id}`,
    eventType: "marathon",
    assetbundleName: `event_${id}`,
    unit: null,
    startAt,
    aggregateAt,
    closedAt: aggregateAt + DAY,
  }
}

const base = Date.UTC(2024, 0, 10)
const events = [
  event(1, base - 30 * DAY, base - 20 * DAY),
  event(2, base - 2 * DAY, base + 7 * DAY),
  event(3, base + 12 * DAY, base + 20 * DAY),
  event(4, base + 40 * DAY, base + 50 * DAY),
]

describe("resolveGachaRelatedEvents", () => {
  it("prefers events sharing pickup cards, ranked by shared count", () => {
    const links = new Map<number, { eventId: number }[]>([
      [100, [{ eventId: 1 }, { eventId: 3 }]],
      [101, [{ eventId: 3 }]],
      [102, [{ eventId: 999 }]],
    ])
    const related = resolveGachaRelatedEvents(
      { id: 1, startAt: base, endAt: base + 9 * DAY, pickupCardIds: [100, 101, 102] },
      events,
      links,
    )
    expect(related.map((entry) => `${entry.event.id}:${entry.reason}:${entry.sharedCardIds.join("+")}`))
      .toEqual(["3:pickup:100+101", "1:pickup:100"])
  })

  it("falls back to period overlap within the tolerance, closest start first", () => {
    const related = resolveGachaRelatedEvents(
      { id: 1, startAt: base, endAt: base + 9 * DAY, pickupCardIds: [5] },
      events,
      new Map(),
    )
    expect(related.map((entry) => `${entry.event.id}:${entry.reason}`)).toEqual(["2:period", "3:period"])
    expect(GACHA_RELATED_EVENT_TOLERANCE_MS).toBe(3 * DAY)
  })

  it("respects the limit and returns nothing without dates", () => {
    const related = resolveGachaRelatedEvents(
      { id: 1, startAt: base - 40 * DAY, endAt: base + 60 * DAY, pickupCardIds: [] },
      events,
      new Map(),
      { limit: 2 },
    )
    expect(related).toHaveLength(2)
    expect(resolveGachaRelatedEvents({ id: 1, startAt: null, endAt: null, pickupCardIds: [] }, events, new Map())).toEqual([])
  })
})
