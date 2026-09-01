import type { SekaiEventItem } from "@/modules/events"
import { normalizeCatalogNumber, normalizeCatalogRecords } from "@/shared/sekai/catalog"

/**
 * `eventMusics` re-shaped both ways. Built once per master version by the
 * `music-library/event-musics` resource and shared by the list (box / World
 * Link tags) and the detail page (related events).
 */
export type EventMusicsIndex = {
  /** musicId → event ids (ascending). */
  eventIdsByMusic: Map<number, number[]>
  /** eventId → music ids (ascending). */
  musicIdsByEvent: Map<number, number[]>
}

function append(map: Map<number, number[]>, key: number, value: number): void {
  const list = map.get(key)
  if (!list) {
    map.set(key, [value])
  } else if (!list.includes(value)) {
    list.push(value)
  }
}

export function buildEventMusicsIndex(files: Record<string, unknown>): EventMusicsIndex {
  const eventIdsByMusic = new Map<number, number[]>()
  const musicIdsByEvent = new Map<number, number[]>()
  for (const record of normalizeCatalogRecords(files.eventMusics)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const musicId = normalizeCatalogNumber(record.musicId)
    if (!eventId || !musicId) {
      continue
    }
    append(eventIdsByMusic, musicId, eventId)
    append(musicIdsByEvent, eventId, musicId)
  }
  for (const list of eventIdsByMusic.values()) {
    list.sort((a, b) => a - b)
  }
  for (const list of musicIdsByEvent.values()) {
    list.sort((a, b) => a - b)
  }
  return { eventIdsByMusic, musicIdsByEvent }
}

/** Music ids linked to a World Link (world_bloom) event. */
export function listWorldLinkMusicIdsFromCatalog(
  events: readonly { id: number; eventType: string | null }[],
  musicIdsByEvent: ReadonlyMap<number, readonly number[]>,
): Set<number> {
  const musicIds = new Set<number>()
  for (const event of events) {
    if (event.eventType !== "world_bloom") {
      continue
    }
    for (const musicId of musicIdsByEvent.get(event.id) ?? []) {
      musicIds.add(musicId)
    }
  }
  return musicIds
}

/** The events a song is linked to, in event id order; unknown ids are skipped. */
export function resolveMusicEvents(
  musicId: number,
  eventIdsByMusic: ReadonlyMap<number, readonly number[]>,
  eventsById: ReadonlyMap<number, SekaiEventItem>,
): SekaiEventItem[] {
  const events: SekaiEventItem[] = []
  for (const eventId of eventIdsByMusic.get(musicId) ?? []) {
    const event = eventsById.get(eventId)
    if (event) {
      events.push(event)
    }
  }
  return events.sort((a, b) => a.id - b.id)
}
