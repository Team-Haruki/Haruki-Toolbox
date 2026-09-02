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
import { CATALOG_PAGE_SIZES, isCatalogSortDirection, type CatalogSortDirection } from "@/shared/components/catalog/types"
import type { CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import { SEKAI_CARD_ATTRS, SEKAI_UNITS, type SekaiCardAttr, type SekaiUnit } from "@/shared/sekai/catalog"
import {
  resolveSekaiAttrLabel,
  resolveSekaiEnumLabel,
  resolveSekaiRarityLabel,
  resolveSekaiSupplyLabel,
  resolveSekaiUnitLabel,
  type SekaiLabelContext,
} from "@/shared/sekai/labels"
import {
  CARD_RARITY_TYPES,
  CARD_SORTS,
  CARD_SUPPLY_TYPES,
  isCardSort,
  type CardListFilters,
  type CardRarityType,
  type CardSort,
  type CardSupplyType,
} from "@/modules/cards/lib/card-filter"
import { CARD_SKILL_FILTER_TYPES, type CardSkillFilterType } from "@/modules/cards/lib/card-skill"

/**
 * `/cards` URL state. Defaults are omitted on write so a fresh list is just
 * `/cards`; layout preferences (art mode, panel state) are not query keys.
 */

export const CARD_ART_MODES = ["normal", "trained", "both"] as const

export type CardArtMode = (typeof CARD_ART_MODES)[number]

export const CARDS_DEFAULT_PAGE_SIZE = 60

/** Short rarity codes used by the `rar` key. */
export const CARD_RARITY_QUERY_CODES: Record<CardRarityType, string> = {
  rarity_1: "1",
  rarity_2: "2",
  rarity_3: "3",
  rarity_4: "4",
  rarity_birthday: "bd",
}

const RARITY_BY_CODE = new Map<string, CardRarityType>(
  CARD_RARITY_TYPES.map((rarity) => [CARD_RARITY_QUERY_CODES[rarity], rarity]),
)

const RARITY_CODES = CARD_RARITY_TYPES.map((rarity) => CARD_RARITY_QUERY_CODES[rarity])

export type CardsQueryState = {
  q: string
  chars: number[]
  units: SekaiUnit[]
  attrs: SekaiCardAttr[]
  rar: CardRarityType[]
  supply: CardSupplyType[]
  skill: CardSkillFilterType[]
  year: number | null
  sort: CardSort
  dir: CatalogSortDirection
  page: number
  size: number
}

export const CARDS_QUERY_KEYS = [
  "q",
  "chars",
  "units",
  "attrs",
  "rar",
  "supply",
  "skill",
  "year",
  "sort",
  "dir",
  "page",
  "size",
] as const

export const CARDS_QUERY_FILTER_KEYS = ["q", "chars", "units", "attrs", "rar", "supply", "skill", "year"] as const

const CARDS_DEFAULT_SORT: CardSort = "release"
const CARDS_DEFAULT_DIRECTION: CatalogSortDirection = "desc"

export function createDefaultCardsQueryState(): CardsQueryState {
  return {
    q: "",
    chars: [],
    units: [],
    attrs: [],
    rar: [],
    supply: [],
    skill: [],
    year: null,
    sort: CARDS_DEFAULT_SORT,
    dir: CARDS_DEFAULT_DIRECTION,
    page: 1,
    size: CARDS_DEFAULT_PAGE_SIZE,
  }
}

export function parseCardsQuery(query: LocationQuery): CardsQueryState {
  const defaults = createDefaultCardsQueryState()
  const sort = readQueryEnum(query.sort, CARD_SORTS)
  const dir = readQueryString(query.dir)
  const size = readQueryInt(query.size, { min: 1 })
  return {
    q: readQueryString(query.q) ?? "",
    chars: readQueryIntList(query.chars),
    units: readQueryEnumList(query.units, SEKAI_UNITS),
    attrs: readQueryEnumList(query.attrs, SEKAI_CARD_ATTRS),
    rar: readQueryEnumList(query.rar, RARITY_CODES)
      .map((code) => RARITY_BY_CODE.get(code))
      .filter((rarity): rarity is CardRarityType => rarity != null),
    supply: readQueryEnumList(query.supply, CARD_SUPPLY_TYPES),
    skill: readQueryEnumList(query.skill, CARD_SKILL_FILTER_TYPES),
    year: readQueryInt(query.year, { min: 2000, max: 2100 }),
    sort: isCardSort(sort) ? sort : defaults.sort,
    dir: isCatalogSortDirection(dir) ? dir : defaults.dir,
    page: readQueryInt(query.page, { min: 1 }) ?? defaults.page,
    size: size != null && CATALOG_PAGE_SIZES.includes(size) ? size : defaults.size,
  }
}

export function serializeCardsQuery(state: CardsQueryState): QueryWriteRecord {
  return {
    q: writeQueryValue(state.q.trim()),
    chars: writeQueryList(state.chars),
    units: writeQueryList(state.units),
    attrs: writeQueryList(state.attrs),
    rar: writeQueryList(state.rar.map((rarity) => CARD_RARITY_QUERY_CODES[rarity])),
    supply: writeQueryList(state.supply),
    skill: writeQueryList(state.skill),
    year: writeQueryValue(state.year),
    sort: writeQueryValue(state.sort, CARDS_DEFAULT_SORT),
    dir: writeQueryValue(state.dir, CARDS_DEFAULT_DIRECTION),
    page: writeQueryValue(state.page, 1),
    size: writeQueryValue(state.size, CARDS_DEFAULT_PAGE_SIZE),
  }
}

export const cardsQueryCodec: QueryCodec<CardsQueryState> = {
  keys: CARDS_QUERY_KEYS,
  filterKeys: CARDS_QUERY_FILTER_KEYS,
  defaults: createDefaultCardsQueryState,
  parse: parseCardsQuery,
  serialize: serializeCardsQuery,
}

/** The URL state in the shape `filterCards` consumes. */
export function toCardListFilters(state: CardsQueryState): CardListFilters {
  return {
    query: state.q,
    characterIds: state.chars,
    units: state.units,
    attrs: state.attrs,
    rarities: state.rar,
    supplyTypes: state.supply,
    skillTypes: state.skill,
    year: state.year,
  }
}

export type CardsActiveChipContext = {
  characterNames: ReadonlyMap<number, string>
  labels: SekaiLabelContext
}

/**
 * One removable chip per active filter value. Keys are `<field>` for scalar
 * filters and `<field>:<value>` for list entries, so `removeCardsQueryChip`
 * can drop a single value without clearing the whole field.
 */
export function buildCardsActiveChips(state: CardsQueryState, ctx: CardsActiveChipContext): CatalogActiveChip[] {
  const { labels } = ctx
  const chips: CatalogActiveChip[] = []
  const q = state.q.trim()
  if (q) {
    chips.push({ key: "q", label: `${labels.t("catalog.search.label")}: ${q}` })
  }
  for (const id of state.chars) {
    chips.push({ key: `chars:${id}`, label: ctx.characterNames.get(id) ?? `#${id}` })
  }
  for (const unit of state.units) {
    chips.push({ key: `units:${unit}`, label: resolveSekaiUnitLabel(labels, unit) })
  }
  for (const attr of state.attrs) {
    chips.push({ key: `attrs:${attr}`, label: resolveSekaiAttrLabel(labels, attr) })
  }
  for (const rarity of state.rar) {
    chips.push({ key: `rar:${rarity}`, label: resolveSekaiRarityLabel(labels, rarity) })
  }
  for (const supply of state.supply) {
    chips.push({ key: `supply:${supply}`, label: resolveSekaiSupplyLabel(labels, supply) })
  }
  for (const skill of state.skill) {
    chips.push({ key: `skill:${skill}`, label: resolveSekaiEnumLabel(labels, "cardCatalog.skillFilters", skill) })
  }
  if (state.year != null) {
    chips.push({ key: "year", label: String(state.year) })
  }
  return chips
}

/** Applies a chip removal in place: one list value, or a whole scalar field. */
export function removeCardsQueryChip(state: CardsQueryState, key: string): void {
  const separator = key.indexOf(":")
  const field = separator >= 0 ? key.slice(0, separator) : key
  const value = separator >= 0 ? key.slice(separator + 1) : null
  switch (field) {
    case "q":
      state.q = ""
      return
    case "year":
      state.year = null
      return
    case "chars":
      state.chars = state.chars.filter((id) => String(id) !== value)
      return
    case "units":
      state.units = state.units.filter((unit) => unit !== value)
      return
    case "attrs":
      state.attrs = state.attrs.filter((attr) => attr !== value)
      return
    case "rar":
      state.rar = state.rar.filter((rarity) => rarity !== value)
      return
    case "supply":
      state.supply = state.supply.filter((supply) => supply !== value)
      return
    case "skill":
      state.skill = state.skill.filter((skill) => skill !== value)
      return
    default:
      return
  }
}
