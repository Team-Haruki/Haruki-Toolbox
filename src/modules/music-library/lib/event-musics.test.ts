import { describe, expect, it } from "bun:test"
import type { SekaiEventItem } from "@/modules/events"
import {
  buildEventMusicsIndex,
  listWorldLinkMusicIdsFromCatalog,
  resolveMusicEvents,
} from "./event-musics"

const rawEventMusics = [
  { id: 1, eventId: 3, musicId: 64, seq: 1 },
  { id: 2, eventId: 1, musicId: 64, seq: 1 },
  { id: 3, eventId: 1, musicId: 64, seq: 2 },
  { id: 4, eventId: 2, musicId: 62, seq: 1 },
  { id: 5, eventId: null, musicId: 1 },
  { id: 6, eventId: 9, musicId: "x" },
]

function makeEvent(id: number, eventType: SekaiEventItem["eventType"]): SekaiEventItem {
  return {
    id,
    name: `Event ${id}`,
    eventType,
    assetbundleName: null,
    unit: null,
    startAt: id * 1000,
    aggregateAt: null,
    closedAt: null,
  }
}

describe("buildEventMusicsIndex", () => {
  const index = buildEventMusicsIndex({ eventMusics: rawEventMusics })

  it("groups both directions, deduplicated and sorted", () => {
    expect(index.eventIdsByMusic.get(64)).toEqual([1, 3])
    expect(index.musicIdsByEvent.get(1)).toEqual([64])
    expect(index.musicIdsByEvent.get(2)).toEqual([62])
    expect(index.eventIdsByMusic.has(1)).toBe(false)
  })

  it("tolerates a missing file", () => {
    expect(buildEventMusicsIndex({}).eventIdsByMusic.size).toBe(0)
  })
})

describe("listWorldLinkMusicIdsFromCatalog", () => {
  it("collects songs linked to world_bloom events", () => {
    const index = buildEventMusicsIndex({ eventMusics: rawEventMusics })
    const ids = listWorldLinkMusicIdsFromCatalog(
      [makeEvent(1, "marathon"), makeEvent(3, "world_bloom"), makeEvent(2, "world_bloom")],
      index.musicIdsByEvent,
    )
    expect([...ids].sort((a, b) => a - b)).toEqual([62, 64])
  })
})

describe("resolveMusicEvents", () => {
  it("resolves linked events in id order and skips unknown ids", () => {
    const index = buildEventMusicsIndex({ eventMusics: rawEventMusics })
    const byId = new Map([[3, makeEvent(3, "marathon")], [1, makeEvent(1, "cheerful_carnival")]])
    expect(resolveMusicEvents(64, index.eventIdsByMusic, byId).map((event) => event.id)).toEqual([1, 3])
    expect(resolveMusicEvents(62, index.eventIdsByMusic, byId)).toEqual([])
    expect(resolveMusicEvents(999, index.eventIdsByMusic, byId)).toEqual([])
  })
})
