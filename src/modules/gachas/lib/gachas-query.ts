import type { LocationQuery } from "vue-router"
import type { QueryCodec } from "@/composables/useRouteQueryState"
import {
  readQueryEnum,
  readQueryEnumList,
  readQueryInt,
  readQueryIntList,
  readQueryList,
  readQueryString,
  writeQueryList,
  writeQueryValue,
} from "@/lib/query-codec"
import type { CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import {
  CATALOG_PAGE_SIZES,
  CATALOG_SORT_DIRECTIONS,
  CATALOG_STATUSES,
  type CatalogSortDirection,
  type CatalogStatus,
} from "@/shared/components/catalog/types"

export const GACHA_LIST_SORT_KEYS = ["start", "id"] as const

export type GachaListSortKey = (typeof GACHA_LIST_SORT_KEYS)[number]

export const GACHA_LIST_DEFAULT_PAGE_SIZE = 30

/** `route.query` state of `/gachas`. Defaults are omitted from the URL. */
export type GachaListQuery = {
  q: string
  /** Gacha types (csv). Not restricted to the known enum: dumps add members. */
  type: string[]
  status: CatalogStatus[]
  year: number | null
  /** Pickup character ids. */
  chars: number[]
  /** Pickup card ids — deep links only (no picker in the panel). */
  cards: number[]
  sort: GachaListSortKey
  dir: CatalogSortDirection
  page: number
  size: number
}

const TYPE_TOKEN_PATTERN = /^[a-z][a-z0-9_]*$/

const KEYS = ["q", "type", "status", "year", "chars", "cards", "sort", "dir", "page", "size"] as const
const FILTER_KEYS = ["q", "type", "status", "year", "chars", "cards"] as const

function readTypeList(value: LocationQuery[string]): string[] {
  return readQueryList(value).filter((item) => TYPE_TOKEN_PATTERN.test(item))
}

export const gachasQueryCodec: QueryCodec<GachaListQuery> = {
  keys: KEYS,
  filterKeys: FILTER_KEYS,
  defaults: () => ({
    q: "",
    type: [],
    status: [],
    year: null,
    chars: [],
    cards: [],
    sort: "start",
    dir: "desc",
    page: 1,
    size: GACHA_LIST_DEFAULT_PAGE_SIZE,
  }),
  parse: (query) => {
    const size = readQueryInt(query.size, { min: 1 })
    return {
      q: readQueryString(query.q) ?? "",
      type: readTypeList(query.type),
      status: readQueryEnumList(query.status, CATALOG_STATUSES),
      year: readQueryInt(query.year, { min: 2000, max: 2100 }),
      chars: readQueryIntList(query.chars),
      cards: readQueryIntList(query.cards),
      sort: readQueryEnum(query.sort, GACHA_LIST_SORT_KEYS) ?? "start",
      dir: readQueryEnum(query.dir, CATALOG_SORT_DIRECTIONS) ?? "desc",
      page: readQueryInt(query.page, { min: 1 }) ?? 1,
      size: size != null && CATALOG_PAGE_SIZES.includes(size) ? size : GACHA_LIST_DEFAULT_PAGE_SIZE,
    }
  },
  serialize: (state) => ({
    q: writeQueryValue(state.q.trim()),
    type: writeQueryList(state.type),
    status: writeQueryList(state.status),
    year: writeQueryValue(state.year),
    chars: writeQueryList(state.chars),
    cards: writeQueryList(state.cards),
    sort: writeQueryValue(state.sort, "start"),
    dir: writeQueryValue(state.dir, "desc"),
    page: writeQueryValue(state.page, 1),
    size: writeQueryValue(state.size, GACHA_LIST_DEFAULT_PAGE_SIZE),
  }),
}

export type GachaActiveChipContext = {
  characterNames: ReadonlyMap<number, string>
  cardNames: ReadonlyMap<number, string>
  typeLabel: (gachaType: string) => string
  statusLabel: (status: CatalogStatus) => string
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Removable chips for the collapsed filter panel: one per value. Chip keys
 * are `<queryKey>` for scalars and `<queryKey>:<value>` for list entries so
 * `removeGachaActiveChip` can drop a single value.
 */
export function buildGachaActiveChips(
  state: GachaListQuery,
  ctx: GachaActiveChipContext,
  t: Translate,
): CatalogActiveChip[] {
  const chips: CatalogActiveChip[] = []
  const query = state.q.trim()
  if (query) {
    chips.push({ key: "q", label: t("gachaCatalog.list.chips.search", { query }) })
  }
  for (const type of state.type) {
    chips.push({ key: `type:${type}`, label: ctx.typeLabel(type) })
  }
  for (const status of state.status) {
    chips.push({ key: `status:${status}`, label: ctx.statusLabel(status) })
  }
  if (state.year != null) {
    chips.push({ key: "year", label: t("gachaCatalog.list.chips.year", { year: state.year }) })
  }
  for (const id of state.chars) {
    chips.push({ key: `chars:${id}`, label: ctx.characterNames.get(id) ?? `#${id}` })
  }
  for (const id of state.cards) {
    const name = ctx.cardNames.get(id)
    chips.push({
      key: `cards:${id}`,
      label: name ? t("gachaCatalog.list.chips.card", { name }) : t("gachaCatalog.list.chips.cardId", { id }),
    })
  }
  return chips
}

/** Applies a chip removal to the reactive state (single value or whole key). */
export function removeGachaActiveChip(state: GachaListQuery, chipKey: string): void {
  const separator = chipKey.indexOf(":")
  const key = separator >= 0 ? chipKey.slice(0, separator) : chipKey
  const value = separator >= 0 ? chipKey.slice(separator + 1) : null
  switch (key) {
    case "q":
      state.q = ""
      return
    case "year":
      state.year = null
      return
    case "type":
      state.type = value == null ? [] : state.type.filter((item) => item !== value)
      return
    case "status":
      state.status = value == null ? [] : state.status.filter((item) => item !== value)
      return
    case "chars":
      state.chars = value == null ? [] : state.chars.filter((item) => String(item) !== value)
      return
    case "cards":
      state.cards = value == null ? [] : state.cards.filter((item) => String(item) !== value)
      return
    default:
      return
  }
}
