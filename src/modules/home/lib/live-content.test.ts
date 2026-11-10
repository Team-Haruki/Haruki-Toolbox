import { describe, expect, it } from "bun:test"
import { selectFeaturedEvent, selectLiveGachas, selectRecentSongs, splitDuration } from "./live-content"

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const NOW = 1_000 * DAY

const event = (id: number, startOffset: number, lengthDays = 8) => ({
  id,
  startAt: NOW + startOffset,
  aggregateAt: NOW + startOffset + lengthDays * DAY,
  closedAt: NOW + startOffset + (lengthDays + 2) * DAY,
})

describe("selectFeaturedEvent", () => {
  it("features the running event and reports when the next one starts", () => {
    const featured = selectFeaturedEvent([event(1, -20 * DAY), event(2, -2 * DAY), event(3, 8 * DAY)], NOW, { allowUpcoming: false })
    expect(featured).toMatchObject({ event: { id: 2 }, phase: "running", nextStartAt: NOW + 8 * DAY })
  })

  it("between events features the next one only when unreleased content may be shown", () => {
    const events = [event(1, -10 * DAY), event(2, 10 * HOUR), event(3, 12 * DAY)]
    expect(selectFeaturedEvent(events, NOW, { allowUpcoming: true })).toMatchObject({
      event: { id: 2 }, phase: "upcoming", nextStartAt: NOW + 12 * DAY,
    })
    expect(selectFeaturedEvent(events, NOW, { allowUpcoming: false })).toMatchObject({
      event: { id: 1 }, phase: "ended", nextStartAt: NOW + 10 * HOUR,
    })
  })

  it("does not feature an event that is still far away", () => {
    const featured = selectFeaturedEvent([event(1, -10 * DAY), event(2, 20 * DAY)], NOW, { allowUpcoming: true })
    expect(featured).toMatchObject({ event: { id: 1 }, phase: "ended" })
  })

  it("handles a server whose data ends with the event that just finished", () => {
    expect(selectFeaturedEvent([event(1, -9 * DAY)], NOW, { allowUpcoming: true })).toMatchObject({
      event: { id: 1 }, phase: "ended", nextStartAt: null,
    })
    expect(selectFeaturedEvent([], NOW, { allowUpcoming: true })).toBeNull()
    expect(selectFeaturedEvent([{ id: 1, startAt: null, aggregateAt: null }], NOW, { allowUpcoming: true })).toBeNull()
  })
})

describe("selectLiveGachas", () => {
  const gacha = (id: number, gachaType: string, startOffset: number, lengthDays: number) => ({
    id, gachaType, startAt: NOW + startOffset, endAt: NOW + startOffset + lengthDays * DAY,
  })

  it("keeps open limited pools, pity pools first, newest first", () => {
    const picked = selectLiveGachas([
      gacha(1, "normal", -3 * DAY, 20),
      gacha(2, "ceil", -9 * DAY, 11),
      gacha(3, "ceil", -2 * DAY, 7),
      gacha(4, "beginner", -5 * DAY, 20),
      gacha(5, "normal", -40 * DAY, 90),
      gacha(6, "ceil", -30 * DAY, 10),
      gacha(7, "ceil", 2 * DAY, 10),
    ], NOW, 5)
    expect(picked.map((item) => item.id)).toEqual([3, 2, 1])
  })

  it("honours the limit and skips undated pools", () => {
    const picked = selectLiveGachas([
      gacha(1, "ceil", -DAY, 5),
      gacha(2, "ceil", -2 * DAY, 5),
      { id: 3, gachaType: "ceil", startAt: null, endAt: null },
    ], NOW, 1)
    expect(picked.map((item) => item.id)).toEqual([1])
  })
})

describe("selectRecentSongs", () => {
  it("returns songs added in the window, newest first, without unreleased ones", () => {
    const songs = [
      { id: 1, publishedAt: NOW - 30 * DAY },
      { id: 2, publishedAt: NOW - 3 * DAY },
      { id: 3, publishedAt: NOW - DAY },
      { id: 4, publishedAt: NOW + DAY },
      { id: 5, publishedAt: null },
    ]
    expect(selectRecentSongs(songs, NOW, 5).map((song) => song.id)).toEqual([3, 2])
    expect(selectRecentSongs(songs, NOW, 1).map((song) => song.id)).toEqual([3])
  })
})

describe("splitDuration", () => {
  it("names the leading unit", () => {
    expect(splitDuration(3 * DAY + 4 * HOUR + 5 * 60_000)).toEqual({ unit: "days", days: 3, hours: 4, minutes: 5 })
    expect(splitDuration(4 * HOUR + 5 * 60_000)).toMatchObject({ unit: "hours", hours: 4, minutes: 5 })
    expect(splitDuration(5 * 60_000 + 30_000)).toMatchObject({ unit: "minutes", minutes: 5 })
    expect(splitDuration(-1)).toMatchObject({ unit: "minutes", minutes: 0 })
  })
})
