import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"

/** Story browser tabs, in the game's order. */
export const STORY_TABS = ["unit", "event", "card", "special", "area"] as const
export type StoryTab = (typeof STORY_TABS)[number]

/** Master files the story catalog reads besides the shared events/cards/characters indexes. */
export const STORY_MASTER_FILES = [
  "unitStories",
  "eventStories",
  "eventStoryUnits",
  "cardEpisodes",
  "specialStories",
  "actionSets",
  "areas",
] as const
export const STORY_OPTIONAL_FILES = ["eventStoryUnits", "specialStories", "actionSets", "areas"] as const

/** How an episode is numbered; the browser turns it into text. */
export type StoryEpisodeLabel =
  | { type: "episode"; no: number }
  | { type: "part"; part: "first" | "second" }
  | { type: "text"; text: string }

export type StoryEpisode = {
  /** ScenarioId */
  sid: string
  kind: StoryTab
  label: StoryEpisodeLabel
  title: string
  /** Candidate scenario paths inside "<region>-assets/". */
  paths: string[]
  /** Episode image path inside "jp-assets/". */
  thumb?: string
  /** Area talks: the participating game characters. */
  chars?: number[]
  /** Event stories: the event's story bundle (event-only SEs live there). */
  bundle?: string
}

export type StorySeries = {
  /** Stable key, e.g. "event:150". */
  key: string
  kind: StoryTab
  title: string
  unit?: string
  /** Virtual singer card stories also show under the VS filter. */
  vsUnit?: string
  /** Release time (ms) when known. */
  at?: number
  /** Event logo / card thumbnail path inside "jp-assets/". */
  logo?: string
  thumb?: string
  episodes: StoryEpisode[]
}

export type StoryCatalog = {
  tabs: Record<StoryTab, StorySeries[]>
  /** gameCharacterId → unit */
  units: Record<number, string>
  bySid: Map<string, { series: StorySeries; episode: StoryEpisode }>
}

/** The subset of the shared indexes the catalog needs. */
export type StoryCatalogSources = {
  stories: Record<string, unknown>
  events: ReadonlyMap<number, { name: string; startAt: number | null }>
  cards: ReadonlyMap<number, {
    characterId: number | null
    prefix: string | null
    assetbundleName: string
    releaseAt: number | null
    supportUnit: string
  }>
  characters: ReadonlyMap<number, { name: string; unit: string | null }>
}

const num = (value: unknown) => normalizeCatalogNumber(value)
const str = (value: unknown) => normalizeCatalogString(value)
const records = (value: unknown) => normalizeCatalogRecords(value)

export function buildStoryCatalog(src: StoryCatalogSources): StoryCatalog {
  const files = src.stories
  const tabs: Record<StoryTab, StorySeries[]> = { unit: [], event: [], card: [], special: [], area: [] }
  const charName = (id: number) => src.characters.get(id)?.name ?? `#${id}`

  for (const u of records(files.unitStories)) {
    const unit = str(u.unit)
    for (const ch of records(u.chapters)) {
      const bundle = str(ch.assetbundleName)
      const chapterNo = num(ch.chapterNo) ?? 0
      tabs.unit.push({
        key: `unit:${unit}:${chapterNo}`,
        kind: "unit",
        title: str(ch.title),
        unit,
        episodes: records(ch.episodes).flatMap((e): StoryEpisode[] => {
          const sid = str(e.scenarioId)
          if (!sid) return []
          return [{
            sid,
            kind: "unit",
            label: { type: "text", text: str(e.episodeNoLabel) },
            title: str(e.title),
            paths: [`startapp/scenario/unitstory/${bundle}/${sid}.json`],
            thumb: `startapp/story/episode_image/${bundle}/${str(e.assetbundleName)}.png`,
          }]
        }),
      })
    }
  }

  const mainUnit = new Map<number, string>()
  for (const r of records(files.eventStoryUnits)) {
    const id = num(r.eventStoryId)
    if (id && str(r.eventStoryUnitRelation) === "main") mainUnit.set(id, str(r.unit))
  }
  for (const s of records(files.eventStories)) {
    const eventId = num(s.eventId)
    if (!eventId) continue
    const ev = src.events.get(eventId)
    const bundle = str(s.assetbundleName)
    tabs.event.push({
      key: `event:${eventId}`,
      kind: "event",
      title: ev?.name || `#${eventId}`,
      unit: mainUnit.get(num(s.id) ?? -1) ?? "none",
      at: ev?.startAt ?? undefined,
      logo: `ondemand/event/${bundle}/logo/logo.png`,
      episodes: records(s.eventStoryEpisodes).flatMap((e): StoryEpisode[] => {
        const sid = str(e.scenarioId)
        if (!sid) return []
        return [{
          sid,
          kind: "event",
          label: { type: "episode", no: num(e.episodeNo) ?? 0 },
          title: str(e.title),
          paths: [`ondemand/event_story/${bundle}/scenario/${sid}.json`],
          thumb: `ondemand/event_story/${bundle}/episode_image/${str(e.assetbundleName)}.png`,
          bundle,
        }]
      }),
    })
  }

  const cardEpisodes = new Map<number, Record<string, unknown>[]>()
  for (const e of records(files.cardEpisodes)) {
    const cardId = num(e.cardId)
    if (!cardId) continue
    const list = cardEpisodes.get(cardId)
    if (list) list.push(e)
    else cardEpisodes.set(cardId, [e])
  }
  for (const [cardId, eps] of cardEpisodes) {
    const card = src.cards.get(cardId)
    if (!card) continue
    const character = card.characterId != null ? src.characters.get(card.characterId) : undefined
    const support = card.supportUnit && card.supportUnit !== "none" ? card.supportUnit : undefined
    eps.sort((a, b) => (num(a.seq) ?? 0) - (num(b.seq) ?? 0))
    tabs.card.push({
      key: `card:${cardId}`,
      kind: "card",
      title: `【${card.prefix ?? ""}】${card.characterId != null ? charName(card.characterId) : ""}`,
      unit: support ?? character?.unit ?? "none",
      vsUnit: character?.unit === "piapro" ? "piapro" : undefined,
      at: card.releaseAt ?? undefined,
      thumb: `startapp/thumbnail/chara/${card.assetbundleName}_normal.png`,
      episodes: eps.flatMap((e): StoryEpisode[] => {
        const sid = str(e.scenarioId)
        if (!sid) return []
        return [{
          sid,
          kind: "card",
          label: { type: "part", part: str(e.cardEpisodePartType) === "second_part" ? "second" : "first" },
          title: str(e.title),
          paths: [`startapp/character/member/${card.assetbundleName}/${sid}.json`],
        }]
      }),
    })
  }

  for (const s of records(files.specialStories)) {
    const id = num(s.id)
    if (!id) continue
    const storyBundle = str(s.assetbundleName)
    tabs.special.push({
      key: `special:${id}`,
      kind: "special",
      title: str(s.title),
      at: num(s.startAt) ?? undefined,
      episodes: records(s.episodes).flatMap((e): StoryEpisode[] => {
        const sid = str(e.scenarioId)
        if (!sid) return []
        // per-episode bundle dir (most), or the story's own (the opening)
        const dirs = [...new Set([str(e.assetbundleName), storyBundle].filter(Boolean))]
        return [{
          sid,
          kind: "special",
          label: { type: "episode", no: num(e.episodeNo) ?? 0 },
          title: str(e.title),
          paths: dirs.map((d) => `startapp/scenario/special/${d}/${sid}.json`),
        }]
      }),
    })
  }

  const areaNames = new Map<number, string>()
  for (const a of records(files.areas)) {
    const id = num(a.id)
    if (id) areaNames.set(id, str(a.name))
  }
  const byArea = new Map<number, StoryEpisode[]>()
  for (const a of records(files.actionSets)) {
    const sid = str(a.scenarioId)
    const id = num(a.id)
    const areaId = num(a.areaId)
    if (!sid || !id || !areaId) continue
    const chars = (Array.isArray(a.characterIds) ? a.characterIds : []).map(num).filter((c): c is number => c != null)
    const list = byArea.get(areaId) ?? []
    list.push({
      sid,
      kind: "area",
      label: { type: "text", text: String(id) },
      title: chars.map(charName).join("・"),
      paths: [`startapp/scenario/actionset/group${Math.floor(id / 100)}/${sid}.json`],
      chars,
    })
    byArea.set(areaId, list)
  }
  for (const [areaId, episodes] of byArea)
    tabs.area.push({ key: `area:${areaId}`, kind: "area", title: areaNames.get(areaId) || `#${areaId}`, episodes })

  // newest first where the game dates them; unit chapters and areas keep master order
  const byDateDesc = (a: StorySeries, b: StorySeries) => (b.at ?? 0) - (a.at ?? 0) || b.key.localeCompare(a.key, "en", { numeric: true })
  tabs.event.sort(byDateDesc)
  tabs.card.sort(byDateDesc)
  tabs.special.sort(byDateDesc)
  for (const t of STORY_TABS) tabs[t] = tabs[t].filter((s) => s.episodes.length > 0)

  const units: Record<number, string> = {}
  for (const [id, c] of src.characters) if (c.unit) units[id] = c.unit

  const bySid = new Map<string, { series: StorySeries; episode: StoryEpisode }>()
  for (const t of STORY_TABS)
    for (const series of tabs[t])
      for (const episode of series.episodes) if (!bySid.has(episode.sid)) bySid.set(episode.sid, { series, episode })

  return { tabs, units, bySid }
}

/**
 * Titles from another region's catalog where it has the same story, so the
 * browser follows the text language; paths and images stay JP.
 */
export function overlayStoryTitles(base: StoryCatalog, other: StoryCatalog | null): StoryCatalog {
  if (!other) return base
  const seriesTitles = new Map<string, string>()
  for (const t of STORY_TABS) for (const s of other.tabs[t]) if (s.title) seriesTitles.set(s.key, s.title)
  const tabs = {} as Record<StoryTab, StorySeries[]>
  const bySid = new Map<string, { series: StorySeries; episode: StoryEpisode }>()
  for (const t of STORY_TABS) {
    tabs[t] = base.tabs[t].map((s) => {
      const series: StorySeries = {
        ...s,
        title: seriesTitles.get(s.key) || s.title,
        episodes: s.episodes.map((e) => {
          const hit = other.bySid.get(e.sid)?.episode
          return hit?.title ? { ...e, title: hit.title } : e
        }),
      }
      for (const episode of series.episodes) if (!bySid.has(episode.sid)) bySid.set(episode.sid, { series, episode })
      return series
    })
  }
  return { tabs, units: base.units, bySid }
}

/** Drops stories that are not out yet (the catalog's unreleased setting). */
export function hideUnreleasedStories(catalog: StoryCatalog, now: number): StoryCatalog {
  const tabs = {} as Record<StoryTab, StorySeries[]>
  for (const t of STORY_TABS) tabs[t] = catalog.tabs[t].filter((s) => s.at == null || s.at <= now)
  return { ...catalog, tabs }
}
