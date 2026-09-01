import type { LocationQuery } from "vue-router"
import type { QueryCodec } from "@/composables/useRouteQueryState"
import {
  readQueryEnum,
  readQueryEnumList,
  readQueryInt,
  readQueryIntList,
  readQueryString,
  writeQueryList,
  writeQueryValue,
  type QueryWriteRecord,
} from "@/lib/query-codec"
import type { CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import {
  CATALOG_PAGE_SIZES,
  CATALOG_SORT_DIRECTIONS,
  CATALOG_STATUSES,
  type CatalogSortDirection,
  type CatalogStatus,
} from "@/shared/components/catalog/types"
import { SEKAI_CARD_ATTRS, SEKAI_UNITS, type SekaiCardAttr, type SekaiUnit } from "@/shared/sekai/catalog"
import { SEKAI_EVENT_TYPES, type SekaiEventType } from "@/modules/events/lib/event-filter"

/**
 * `/events` query state. Every key is short and stable; defaults are omitted
 * from the URL. Layout preferences (grid/list view, filter panel state) are
 * deliberately not part of it.
 */

export const EVENT_SORT_KEYS = ["start", "id"] as const

export type EventSortKey = (typeof EVENT_SORT_KEYS)[number]

export const EVENTS_DEFAULT_PAGE_SIZE = 30

export type EventsQueryState = {
  q: string
  type: SekaiEventType[]
  status: CatalogStatus[]
  units: SekaiUnit[]
  attrs: SekaiCardAttr[]
  chars: number[]
  year: number | null
  sort: EventSortKey
  dir: CatalogSortDirection
  page: number
  size: number
}

const KEYS = ["q", "type", "status", "units", "attrs", "chars", "year", "sort", "dir", "page", "size"] as const
const FILTER_KEYS = ["q", "type", "status", "units", "attrs", "chars", "year"] as const

export function createDefaultEventsQuery(): EventsQueryState {
  return {
    q: "",
    type: [],
    status: [],
    units: [],
    attrs: [],
    chars: [],
    year: null,
    sort: "start",
    dir: "desc",
    page: 1,
    size: EVENTS_DEFAULT_PAGE_SIZE,
  }
}

export function parseEventsQuery(query: LocationQuery): EventsQueryState {
  const defaults = createDefaultEventsQuery()
  const size = readQueryInt(query.size, { min: 1 })
  return {
    q: readQueryString(query.q) ?? "",
    type: readQueryEnumList(query.type, SEKAI_EVENT_TYPES),
    status: readQueryEnumList(query.status, CATALOG_STATUSES),
    units: readQueryEnumList(query.units, SEKAI_UNITS),
    attrs: readQueryEnumList(query.attrs, SEKAI_CARD_ATTRS),
    chars: readQueryIntList(query.chars, { min: 1 }),
    year: readQueryInt(query.year, { min: 2000, max: 2100 }),
    sort: readQueryEnum(query.sort, EVENT_SORT_KEYS) ?? defaults.sort,
    dir: readQueryEnum(query.dir, CATALOG_SORT_DIRECTIONS) ?? defaults.dir,
    page: readQueryInt(query.page, { min: 1 }) ?? defaults.page,
    size: size != null && CATALOG_PAGE_SIZES.includes(size) ? size : defaults.size,
  }
}

export function serializeEventsQuery(state: EventsQueryState): QueryWriteRecord {
  const defaults = createDefaultEventsQuery()
  return {
    q: writeQueryValue(state.q.trim()),
    type: writeQueryList(state.type),
    status: writeQueryList(state.status),
    units: writeQueryList(state.units),
    attrs: writeQueryList(state.attrs),
    chars: writeQueryList(state.chars),
    year: writeQueryValue(state.year),
    sort: writeQueryValue(state.sort, defaults.sort),
    dir: writeQueryValue(state.dir, defaults.dir),
    page: writeQueryValue(state.page, defaults.page),
    size: writeQueryValue(state.size, defaults.size),
  }
}

export const eventsQueryCodec: QueryCodec<EventsQueryState> = {
  keys: KEYS,
  filterKeys: FILTER_KEYS,
  defaults: createDefaultEventsQuery,
  parse: parseEventsQuery,
  serialize: serializeEventsQuery,
}

export type EventsActiveChipContext = {
  /** Labels for enum values (already translated). */
  typeLabel: (value: SekaiEventType) => string
  statusLabel: (value: CatalogStatus) => string
  unitLabel: (value: SekaiUnit) => string
  attrLabel: (value: SekaiCardAttr) => string
  characterName: (id: number) => string
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Removable chips for the collapsed filter panel: one chip per active filter
 * key (list filters join their labels) so `removeChip(key)` clears that key.
 */
export function buildEventsActiveChips(
  state: EventsQueryState,
  ctx: EventsActiveChipContext,
  t: Translate,
): CatalogActiveChip[] {
  const chips: CatalogActiveChip[] = []
  const query = state.q.trim()
  if (query) {
    chips.push({ key: "q", label: t("eventCatalog.chips.search", { value: query }) })
  }
  if (state.type.length > 0) {
    chips.push({ key: "type", label: t("eventCatalog.chips.type", { value: state.type.map(ctx.typeLabel).join(" / ") }) })
  }
  if (state.status.length > 0) {
    chips.push({ key: "status", label: t("eventCatalog.chips.status", { value: state.status.map(ctx.statusLabel).join(" / ") }) })
  }
  if (state.units.length > 0) {
    chips.push({ key: "units", label: t("eventCatalog.chips.unit", { value: state.units.map(ctx.unitLabel).join(" / ") }) })
  }
  if (state.attrs.length > 0) {
    chips.push({ key: "attrs", label: t("eventCatalog.chips.attr", { value: state.attrs.map(ctx.attrLabel).join(" / ") }) })
  }
  if (state.chars.length > 0) {
    chips.push({ key: "chars", label: t("eventCatalog.chips.characters", { value: state.chars.map(ctx.characterName).join(" / ") }) })
  }
  if (state.year != null) {
    chips.push({ key: "year", label: t("eventCatalog.chips.year", { value: state.year }) })
  }
  return chips
}
