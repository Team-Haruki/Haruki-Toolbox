import type { RouteLocationRaw } from "vue-router"
import type { SekaiRegion } from "@/types"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import { buildRankBorderDetailQuery } from "@/modules/rank-border/lib/detail-link"
import type { EventBonusGroup } from "@/modules/events/lib/event-bonus"
import type { SekaiEventItem, SekaiWorldBloomChapter } from "@/modules/events/lib/event-filter"

/** Rank-border detail defaults used by the event page's deep link. */
export const EVENT_RANK_BORDER_INTERVAL_SECONDS = 3600
export const EVENT_RANK_BORDER_TARGET_LINE = 100

function chapterEndAt(chapter: SekaiWorldBloomChapter): number | null {
  return chapter.aggregateAt ?? chapter.chapterEndAt
}

/**
 * The World Link chapter a rank-border link should open: the character
 * chapter running at `nowMs`, else the first character chapter. The finale
 * (no character) never resolves.
 */
export function resolveWorldBloomActiveChapter(
  chapters: readonly SekaiWorldBloomChapter[],
  nowMs: number,
): SekaiWorldBloomChapter | null {
  const characterChapters = chapters.filter((chapter) => chapter.gameCharacterId != null)
  const running = characterChapters.find((chapter) => {
    const start = chapter.chapterStartAt
    const end = chapterEndAt(chapter)
    return start != null && start <= nowMs && (end == null || nowMs <= end)
  })
  return running ?? characterChapters[0] ?? null
}

/**
 * `/rank-border/detail` pre-scoped to the event (T100 border line, hourly
 * interval). Upcoming events and World Link events without a resolvable
 * chapter fall back to the rank-border landing page.
 */
export function buildEventRankBorderLink(
  event: Pick<SekaiEventItem, "id" | "eventType">,
  region: SekaiRegion,
  status: CatalogStatus,
  chapters: readonly SekaiWorldBloomChapter[],
  nowMs: number,
): RouteLocationRaw {
  if (status === "upcoming") {
    return { path: "/rank-border" }
  }
  let worldBloomCharacterId: number | null = null
  if (event.eventType === "world_bloom") {
    const chapter = resolveWorldBloomActiveChapter(chapters, nowMs)
    if (chapter?.gameCharacterId == null) {
      return { path: "/rank-border" }
    }
    worldBloomCharacterId = chapter.gameCharacterId
  }
  return {
    path: "/rank-border/detail",
    query: buildRankBorderDetailQuery(
      {
        region,
        eventId: event.id,
        mode: worldBloomCharacterId != null ? "world_bloom" : "normal",
        worldBloomCharacterId,
        intervalSeconds: EVENT_RANK_BORDER_INTERVAL_SECONDS,
      },
      { kind: "line", rank: EVENT_RANK_BORDER_TARGET_LINE },
    ),
  }
}

export type EventDeckRecommendBonus = {
  attr: string | null
  characterIds: number[]
}

/**
 * The custom-bonus form of an event's bonus groups: the attribute of the
 * strongest character+attribute group (else the attribute-only group) and
 * every bonus character id, ascending.
 */
export function resolveEventDeckRecommendBonus(groups: readonly EventBonusGroup[]): EventDeckRecommendBonus {
  const combo = groups.find((group) => group.cardAttr != null && group.characters.length > 0)
  const attrOnly = groups.find((group) => group.cardAttr != null)
  const characterIds = new Set<number>()
  for (const group of groups) {
    for (const character of group.characters) {
      characterIds.add(character.gameCharacterId)
    }
  }
  return {
    attr: combo?.cardAttr ?? attrOnly?.cardAttr ?? null,
    characterIds: [...characterIds].sort((a, b) => a - b),
  }
}

/**
 * `/deck-recommend` for the event. While the event runs the tool already
 * defaults to it, so only the region is passed; otherwise the bonus is
 * replayed through the `customBonus*` keys the tool's route query parser
 * understands.
 */
export function buildEventDeckRecommendLink(
  region: SekaiRegion,
  status: CatalogStatus,
  groups: readonly EventBonusGroup[],
): RouteLocationRaw {
  const query: Record<string, string> = { region }
  if (status !== "ongoing") {
    const bonus = resolveEventDeckRecommendBonus(groups)
    if (bonus.attr) {
      query.customBonusAttr = bonus.attr
    }
    if (bonus.characterIds.length > 0) {
      query.customBonusCharacterIds = bonus.characterIds.join(",")
    }
  }
  return { path: "/deck-recommend", query }
}
