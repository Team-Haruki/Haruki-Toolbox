import type { LocationQuery } from "vue-router"
import type { QueryCodec } from "@/composables/useRouteQueryState"
import {
  readQueryEnum,
  readQueryEnumList,
  readQueryInt,
  readQueryIntList,
  writeQueryList,
  writeQueryValue,
  type QueryWriteRecord,
} from "@/lib/query-codec"
import { SEKAI_CARD_ATTRS, SEKAI_UNITS } from "@/shared/sekai/catalog"
import { CARD_RARITY_TYPES } from "@/modules/cards/lib/card-filter"
import { CARD_OWNERSHIP_FILTERS, createCardBoxFilters, type CardBoxFilters } from "@/modules/cards/lib/card-box"

/**
 * `/cards/box` query state: the filters plus the phone pagination, so a
 * reload or a shared link lands on the same view. Grouping and sort stay
 * device preferences (see `useCatalogViewPreference`).
 */
export type CardBoxQueryState = CardBoxFilters & {
  page: number
  size: number
}

export const CARD_BOX_PAGE_SIZES = [60, 120, 240] as const
export const CARD_BOX_DEFAULT_PAGE_SIZE: number = CARD_BOX_PAGE_SIZES[0]

const KEYS = ["chars", "units", "attrs", "rar", "own", "page", "size"] as const
const FILTER_KEYS = ["chars", "units", "attrs", "rar", "own"] as const

export function createDefaultCardBoxQuery(): CardBoxQueryState {
  return { ...createCardBoxFilters(), page: 1, size: CARD_BOX_DEFAULT_PAGE_SIZE }
}

export function parseCardBoxQuery(query: LocationQuery): CardBoxQueryState {
  const defaults = createDefaultCardBoxQuery()
  const size = readQueryInt(query.size, { min: 1 })
  return {
    characterIds: readQueryIntList(query.chars, { min: 1 }),
    units: readQueryEnumList(query.units, SEKAI_UNITS),
    attrs: readQueryEnumList(query.attrs, SEKAI_CARD_ATTRS),
    rarities: readQueryEnumList(query.rar, CARD_RARITY_TYPES),
    ownership: readQueryEnum(query.own, CARD_OWNERSHIP_FILTERS) ?? defaults.ownership,
    page: readQueryInt(query.page, { min: 1 }) ?? 1,
    size: size != null && (CARD_BOX_PAGE_SIZES as readonly number[]).includes(size) ? size : defaults.size,
  }
}

export function serializeCardBoxQuery(state: CardBoxQueryState): QueryWriteRecord {
  return {
    chars: writeQueryList(state.characterIds),
    units: writeQueryList(state.units),
    attrs: writeQueryList(state.attrs),
    rar: writeQueryList(state.rarities),
    own: writeQueryValue(state.ownership, "all"),
    page: writeQueryValue(state.page, 1),
    size: writeQueryValue(state.size, CARD_BOX_DEFAULT_PAGE_SIZE),
  }
}

export const CARD_BOX_QUERY_CODEC: QueryCodec<CardBoxQueryState> = {
  keys: KEYS,
  filterKeys: FILTER_KEYS,
  defaults: createDefaultCardBoxQuery,
  parse: parseCardBoxQuery,
  serialize: serializeCardBoxQuery,
}
