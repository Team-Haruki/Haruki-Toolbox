import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"
import { normalizeWorldBloomChapter, type SekaiWorldBloomChapter } from "@/modules/events/lib/event-filter"
import { normalizeEventRarityBonusRates, type EventRarityBonusRate } from "@/modules/events/lib/event-rarity-bonus"

/**
 * Secondary event tables read by the detail page in one resource:
 * rarity/master-rank bonus rates, World Link chapters, event songs,
 * Cheerful Carnival teams and story outlines. All are small (a few hundred
 * rows at most) so the whole region is indexed once per master version.
 */

/** One `eventMusics` row. */
export type EventMusicLink = {
  eventId: number
  musicId: number
  seq: number
}

/** One `cheerfulCarnivalTeams` row. */
export type CheerfulCarnivalTeam = {
  id: number
  eventId: number
  seq: number
  teamName: string
  assetbundleName: string | null
}

export type EventStoryEpisode = {
  id: number
  episodeNo: number
  title: string
}

/** One `eventStories` row (optional file; tw/kr may lack it). */
export type EventStory = {
  id: number
  eventId: number
  outline: string
  bannerGameCharacterUnitId: number | null
  episodes: EventStoryEpisode[]
}

export type EventDetailExtras = {
  rarityBonusRates: EventRarityBonusRate[]
  chaptersByEvent: Map<number, SekaiWorldBloomChapter[]>
  musicsByEvent: Map<number, EventMusicLink[]>
  teamsByEvent: Map<number, CheerfulCarnivalTeam[]>
  storiesByEvent: Map<number, EventStory>
}

function groupBy<T>(items: readonly T[], keyOf: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

export function normalizeEventMusics(value: unknown): EventMusicLink[] {
  const rows: EventMusicLink[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const musicId = normalizeCatalogNumber(record.musicId)
    if (!eventId || !musicId) {
      continue
    }
    rows.push({ eventId, musicId, seq: normalizeCatalogNumber(record.seq) ?? 0 })
  }
  return rows.sort((a, b) => a.eventId - b.eventId || a.seq - b.seq || a.musicId - b.musicId)
}

export function normalizeCheerfulCarnivalTeams(value: unknown): CheerfulCarnivalTeam[] {
  const rows: CheerfulCarnivalTeam[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const id = normalizeCatalogNumber(record.id)
    const eventId = normalizeCatalogNumber(record.eventId)
    if (!id || !eventId) {
      continue
    }
    rows.push({
      id,
      eventId,
      seq: normalizeCatalogNumber(record.seq) ?? 0,
      teamName: normalizeCatalogString(record.teamName) || `#${id}`,
      assetbundleName: normalizeCatalogString(record.assetbundleName) || null,
    })
  }
  return rows.sort((a, b) => a.eventId - b.eventId || a.seq - b.seq || a.id - b.id)
}

export function normalizeEventStories(value: unknown): EventStory[] {
  const rows: EventStory[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const id = normalizeCatalogNumber(record.id)
    const eventId = normalizeCatalogNumber(record.eventId)
    if (!id || !eventId) {
      continue
    }
    const episodes: EventStoryEpisode[] = []
    for (const episode of normalizeCatalogRecords(record.eventStoryEpisodes)) {
      const episodeId = normalizeCatalogNumber(episode.id)
      const episodeNo = normalizeCatalogNumber(episode.episodeNo)
      if (!episodeId || episodeNo == null) {
        continue
      }
      episodes.push({ id: episodeId, episodeNo, title: normalizeCatalogString(episode.title) })
    }
    episodes.sort((a, b) => a.episodeNo - b.episodeNo)
    rows.push({
      id,
      eventId,
      outline: normalizeCatalogString(record.outline),
      bannerGameCharacterUnitId: normalizeCatalogNumber(record.bannerGameCharacterUnitId),
      episodes,
    })
  }
  return rows
}

export function groupWorldBloomChaptersByEvent(value: unknown): Map<number, SekaiWorldBloomChapter[]> {
  const chapters: SekaiWorldBloomChapter[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const chapter = normalizeWorldBloomChapter(record)
    if (chapter) {
      chapters.push(chapter)
    }
  }
  const grouped = groupBy(chapters, (chapter) => chapter.eventId)
  for (const list of grouped.values()) {
    list.sort((a, b) => (a.chapterNo ?? Number.MAX_SAFE_INTEGER) - (b.chapterNo ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
  }
  return grouped
}

export function buildEventDetailExtras(files: Record<string, unknown>): EventDetailExtras {
  const storiesByEvent = new Map<number, EventStory>()
  for (const story of normalizeEventStories(files.eventStories)) {
    if (!storiesByEvent.has(story.eventId)) {
      storiesByEvent.set(story.eventId, story)
    }
  }
  return {
    rarityBonusRates: normalizeEventRarityBonusRates(files.eventRarityBonusRates),
    chaptersByEvent: groupWorldBloomChaptersByEvent(files.worldBlooms),
    musicsByEvent: groupBy(normalizeEventMusics(files.eventMusics), (row) => row.eventId),
    teamsByEvent: groupBy(normalizeCheerfulCarnivalTeams(files.cheerfulCarnivalTeams), (row) => row.eventId),
    storiesByEvent,
  }
}
