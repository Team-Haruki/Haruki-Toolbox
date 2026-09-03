import { matchesCommandSearch } from "@/lib/search-match"
import { resolveCatalogStatus, type CatalogStatus } from "@/shared/components/catalog/types"
import type { CatalogCharacterUnit } from "@/shared/sekai/catalog-resources"
import { isEventUnreleased, resolveEventYear, type SekaiEventItem } from "@/modules/events/lib/event-filter"
import type { EventsQueryState } from "@/modules/events/lib/event-query"

/** The instant an event stops counting as ongoing: aggregation, else closing. */
export function resolveEventEndAt(event: Pick<SekaiEventItem, "aggregateAt" | "closedAt">): number | null {
  return event.aggregateAt ?? event.closedAt
}

/** Shared catalog status model applied to an event's start / aggregate window. */
export function resolveEventCatalogStatus(
  event: Pick<SekaiEventItem, "startAt" | "aggregateAt" | "closedAt">,
  nowMs: number,
): CatalogStatus {
  return resolveCatalogStatus(event.startAt, resolveEventEndAt(event), nowMs)
}

/** The timestamp a status badge counts towards: start when upcoming, end when ongoing. */
export function resolveEventStatusUntil(
  event: Pick<SekaiEventItem, "startAt" | "aggregateAt" | "closedAt">,
  status: CatalogStatus,
): number | null {
  if (status === "upcoming") {
    return event.startAt
  }
  if (status === "ongoing") {
    return resolveEventEndAt(event)
  }
  return null
}

export function buildEventSearchParts(event: Pick<SekaiEventItem, "id" | "name">): string[] {
  return [event.name, String(event.id), `#${event.id}`]
}

export function matchesEventSearch(event: Pick<SekaiEventItem, "id" | "name">, query: string): boolean {
  return matchesCommandSearch(buildEventSearchParts(event), query)
}

export type EventListContext = {
  nowMs: number
  hideUnreleased: boolean
  bonusAttrMap: ReadonlyMap<number, ReadonlySet<string>>
  bonusCharacterUnitIdsByEvent: ReadonlyMap<number, ReadonlySet<number>>
  characterUnitById: ReadonlyMap<number, Pick<CatalogCharacterUnit, "gameCharacterId">>
}

/** Game character ids that carry a character bonus in the event. */
export function resolveEventBonusCharacterIds(
  eventId: number,
  bonusCharacterUnitIdsByEvent: ReadonlyMap<number, ReadonlySet<number>>,
  characterUnitById: ReadonlyMap<number, Pick<CatalogCharacterUnit, "gameCharacterId">>,
): Set<number> {
  const ids = new Set<number>()
  for (const unitId of bonusCharacterUnitIdsByEvent.get(eventId) ?? []) {
    const characterId = characterUnitById.get(unitId)?.gameCharacterId
    if (characterId != null) {
      ids.add(characterId)
    }
  }
  return ids
}

export function filterEventList(
  events: readonly SekaiEventItem[],
  state: EventsQueryState,
  ctx: EventListContext,
): SekaiEventItem[] {
  const predicates = buildEventPredicates(state, ctx)
  return events.filter((event) => predicates.every((matches) => matches(event)))
}

type EventPredicate = (event: SekaiEventItem) => boolean

/** One predicate per active filter; an inactive filter contributes nothing. */
function buildEventPredicates(state: EventsQueryState, ctx: EventListContext): EventPredicate[] {
  const predicates: EventPredicate[] = []
  if (ctx.hideUnreleased) {
    predicates.push((event) => !isEventUnreleased(event, ctx.nowMs))
  }
  const query = state.q.trim()
  if (query) {
    predicates.push((event) => matchesEventSearch(event, query))
  }
  const types = new Set<string>(state.type)
  if (types.size > 0) {
    predicates.push((event) => event.eventType != null && types.has(event.eventType))
  }
  const statuses = new Set<CatalogStatus>(state.status)
  if (statuses.size > 0) {
    predicates.push((event) => statuses.has(resolveEventCatalogStatus(event, ctx.nowMs)))
  }
  const units = new Set<string>(state.units)
  if (units.size > 0) {
    predicates.push((event) => event.unit != null && units.has(event.unit))
  }
  const attrs = state.attrs
  if (attrs.length > 0) {
    predicates.push((event) => {
      const eventAttrs = ctx.bonusAttrMap.get(event.id)
      return eventAttrs != null && attrs.some((attr) => eventAttrs.has(attr))
    })
  }
  const chars = state.chars
  if (chars.length > 0) {
    predicates.push((event) => {
      const characterIds = resolveEventBonusCharacterIds(event.id, ctx.bonusCharacterUnitIdsByEvent, ctx.characterUnitById)
      return chars.some((id) => characterIds.has(id))
    })
  }
  const year = state.year
  if (year != null) {
    predicates.push((event) => resolveEventYear(event) === year)
  }
  return predicates
}

/**
 * Sorts a filtered list. The default order (`start` desc) keeps ongoing
 * events pinned to the top, as the previous page did.
 */
export function sortEventList(
  events: readonly SekaiEventItem[],
  state: Pick<EventsQueryState, "sort" | "dir">,
  nowMs: number,
): SekaiEventItem[] {
  const direction = state.dir === "asc" ? 1 : -1
  const sorted = [...events].sort((a, b) => {
    if (state.sort === "id") {
      return (a.id - b.id) * direction
    }
    return ((a.startAt ?? 0) - (b.startAt ?? 0)) * direction || (a.id - b.id) * direction
  })
  if (state.sort === "start" && state.dir === "desc") {
    const ongoing = sorted.filter((event) => resolveEventCatalogStatus(event, nowMs) === "ongoing")
    if (ongoing.length > 0) {
      const rest = sorted.filter((event) => resolveEventCatalogStatus(event, nowMs) !== "ongoing")
      return [...ongoing, ...rest]
    }
  }
  return sorted
}

/**
 * True when the only reason the list is empty is the `upcoming` status
 * filter fighting the "hide unreleased content" setting.
 */
export function isUpcomingHiddenByFilter(
  state: Pick<EventsQueryState, "status">,
  hideUnreleased: boolean,
  resultCount: number,
): boolean {
  return hideUnreleased
    && resultCount === 0
    && state.status.length > 0
    && state.status.every((status) => status === "upcoming")
}
