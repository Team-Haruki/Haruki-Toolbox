import type { LocationQuery } from "vue-router"
import type { QueryCodec } from "@/composables/useRouteQueryState"
import {
  readQueryBoolean,
  readQueryEnum,
  readQueryInt,
  readQueryIntList,
  readQueryList,
  readQueryString,
  writeQueryList,
  writeQueryValue,
  type QueryWriteRecord,
} from "@/lib/query-codec"
import {
  CATALOG_DEFAULT_PAGE_SIZE,
  CATALOG_PAGE_SIZES,
  CATALOG_SORT_DIRECTIONS,
  type CatalogSortDirection,
} from "@/shared/components/catalog/types"
import type { MusicDifficulty } from "./music-difficulties"
import { MUSIC_DIFFICULTIES } from "./music-difficulties"
import {
  MUSIC_CHARACTER_FILTER_SCOPES,
  createDefaultMusicLibraryFilter,
  type MusicCharacterFilterScope,
  type MusicLibraryFilter,
  type MusicNoteCountFilterMode,
  type MusicSortKey,
} from "./music-filter"

/**
 * `/music` list state ⇄ `route.query`. Keys are short and stable; defaults
 * are omitted on write and garbage falls back to the default on read.
 */

export const MUSIC_QUERY_SORTS = ["published", "level", "notes", "title"] as const

export type MusicQuerySort = (typeof MUSIC_QUERY_SORTS)[number]

const SORT_KEY_BY_QUERY: Record<MusicQuerySort, MusicSortKey> = {
  published: "publishedAt",
  level: "level",
  notes: "noteCount",
  title: "title",
}

export function resolveMusicSortKey(sort: MusicQuerySort): MusicSortKey {
  return SORT_KEY_BY_QUERY[sort]
}

/** The `notes` key: `886` (exact) or `800-900` / `800-` / `-900` (range). */
export type MusicNoteCountQuery = {
  mode: MusicNoteCountFilterMode
  exact: number | null
  min: number | null
  max: number | null
}

export type MusicQueryState = {
  q: string
  diff: MusicDifficulty | null
  lvmin: number | null
  lvmax: number | null
  notes: MusicNoteCountQuery
  /** Tag tokens as offered by the list (known tags plus any extra found in the dump). */
  tags: string[]
  /** MV categories; only honoured on servers whose master ships `categories`. */
  mv: string[]
  year: number | null
  /** Character ids; empty means any, several match as a union. */
  chars: number[]
  /** Refines how a selected character has to relate to the track. */
  scope: MusicCharacterFilterScope
  /** Only songs with an APPEND chart. */
  append: boolean
  sort: MusicQuerySort
  dir: CatalogSortDirection
  page: number
  size: number
}

export const MUSIC_QUERY_KEYS = [
  "q",
  "diff",
  "lvmin",
  "lvmax",
  "notes",
  "tags",
  "mv",
  "year",
  "chars",
  "scope",
  "append",
  "sort",
  "dir",
  "page",
  "size",
] as const

const NON_FILTER_KEYS: ReadonlySet<string> = new Set(["sort", "dir", "page", "size"])

export const MUSIC_QUERY_FILTER_KEYS: readonly string[] = MUSIC_QUERY_KEYS.filter((key) => !NON_FILTER_KEYS.has(key))

/**
 * Keys behind the active-filter badge. `scope` only qualifies `chars`, so it
 * is reset with the filters but never counted on its own.
 */
export const MUSIC_QUERY_COUNT_KEYS: readonly string[] = MUSIC_QUERY_FILTER_KEYS.filter((key) => key !== "scope")

const LEVEL_MAX = 99
const NOTE_COUNT_MAX = 99_999
const YEAR_MIN = 2000
const YEAR_MAX = 2100
const NOTE_RANGE_PATTERN = /^(\d*)-(\d*)$/
/**
 * Tag / MV-type tokens are not restricted to the known enums: the list offers
 * every value found in the dump, so the codec must round-trip them too. Only
 * malformed tokens are dropped.
 */
const LIST_TOKEN_PATTERN = /^[a-z][a-z0-9_]*$/

export function createDefaultMusicNoteCountQuery(): MusicNoteCountQuery {
  return { mode: "exact", exact: null, min: null, max: null }
}

export function createDefaultMusicQueryState(): MusicQueryState {
  return {
    q: "",
    diff: null,
    lvmin: null,
    lvmax: null,
    notes: createDefaultMusicNoteCountQuery(),
    tags: [],
    mv: [],
    year: null,
    chars: [],
    scope: "any",
    append: false,
    sort: "published",
    dir: "desc",
    page: 1,
    size: CATALOG_DEFAULT_PAGE_SIZE,
  }
}

function parseBoundedInt(raw: string, max: number): number | null {
  if (!/^\d+$/.test(raw)) {
    return null
  }
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : null
}

export function parseMusicNoteCountQuery(raw: string | null): MusicNoteCountQuery {
  const notes = createDefaultMusicNoteCountQuery()
  if (raw == null) {
    return notes
  }
  const trimmed = raw.trim()
  const exact = parseBoundedInt(trimmed, NOTE_COUNT_MAX)
  if (exact != null) {
    notes.exact = exact
    return notes
  }
  const match = NOTE_RANGE_PATTERN.exec(trimmed)
  if (!match) {
    return notes
  }
  const min = match[1] ? parseBoundedInt(match[1], NOTE_COUNT_MAX) : null
  const max = match[2] ? parseBoundedInt(match[2], NOTE_COUNT_MAX) : null
  if (min == null && max == null) {
    return notes
  }
  return { mode: "range", exact: null, min, max }
}

export function serializeMusicNoteCountQuery(notes: MusicNoteCountQuery): string | undefined {
  if (notes.mode === "exact") {
    return notes.exact != null ? String(notes.exact) : undefined
  }
  if (notes.min == null && notes.max == null) {
    return undefined
  }
  return `${notes.min ?? ""}-${notes.max ?? ""}`
}

function orderedPair(min: number | null, max: number | null): [number | null, number | null] {
  return min != null && max != null && min > max ? [max, min] : [min, max]
}

function readTokenList(value: LocationQuery[string]): string[] {
  return readQueryList(value).filter((item) => LIST_TOKEN_PATTERN.test(item))
}

function parsePageSize(value: LocationQuery[string]): number {
  const parsed = readQueryInt(value, { min: 1 })
  return parsed != null && CATALOG_PAGE_SIZES.includes(parsed) ? parsed : CATALOG_DEFAULT_PAGE_SIZE
}

export const musicQueryCodec: QueryCodec<MusicQueryState> = {
  keys: MUSIC_QUERY_KEYS,
  filterKeys: MUSIC_QUERY_FILTER_KEYS,
  countKeys: MUSIC_QUERY_COUNT_KEYS,
  defaults: createDefaultMusicQueryState,
  parse(query: LocationQuery): MusicQueryState {
    const defaults = createDefaultMusicQueryState()
    const [lvmin, lvmax] = orderedPair(
      readQueryInt(query.lvmin, { min: 1, max: LEVEL_MAX }),
      readQueryInt(query.lvmax, { min: 1, max: LEVEL_MAX }),
    )
    const chars = readQueryIntList(query.chars, { min: 1 })
    return {
      q: readQueryString(query.q) ?? "",
      diff: readQueryEnum(query.diff, MUSIC_DIFFICULTIES),
      lvmin,
      lvmax,
      notes: parseMusicNoteCountQuery(readQueryString(query.notes)),
      tags: readTokenList(query.tags),
      mv: readTokenList(query.mv),
      year: readQueryInt(query.year, { min: YEAR_MIN, max: YEAR_MAX }),
      chars,
      scope: chars.length > 0 ? readQueryEnum(query.scope, MUSIC_CHARACTER_FILTER_SCOPES) ?? "any" : "any",
      append: readQueryBoolean(query.append),
      sort: readQueryEnum(query.sort, MUSIC_QUERY_SORTS) ?? defaults.sort,
      dir: readQueryEnum(query.dir, CATALOG_SORT_DIRECTIONS) ?? defaults.dir,
      page: readQueryInt(query.page, { min: 1 }) ?? 1,
      size: parsePageSize(query.size),
    }
  },
  serialize(state: MusicQueryState): QueryWriteRecord {
    return {
      q: writeQueryValue(state.q.trim()),
      diff: writeQueryValue(state.diff),
      lvmin: writeQueryValue(state.lvmin),
      lvmax: writeQueryValue(state.lvmax),
      notes: serializeMusicNoteCountQuery(state.notes),
      tags: writeQueryList(state.tags),
      mv: writeQueryList(state.mv),
      year: writeQueryValue(state.year),
      chars: writeQueryList(state.chars),
      scope: state.chars.length > 0 ? writeQueryValue(state.scope, "any") : undefined,
      append: writeQueryValue(state.append),
      sort: writeQueryValue(state.sort, "published"),
      dir: writeQueryValue(state.dir, "desc"),
      page: writeQueryValue(state.page, 1),
      size: writeQueryValue(state.size, CATALOG_DEFAULT_PAGE_SIZE),
    }
  },
}

/** Query state → the filter object shared with the deck-recommend song picker. */
export function toMusicLibraryFilter(
  state: MusicQueryState,
  options: { hasCategories: boolean },
): MusicLibraryFilter {
  return {
    ...createDefaultMusicLibraryFilter(),
    search: state.q,
    difficulty: state.diff,
    levelMin: state.lvmin,
    levelMax: state.lvmax,
    noteCountMode: state.notes.mode,
    noteCountExact: state.notes.mode === "exact" ? state.notes.exact : null,
    noteCountMin: state.notes.mode === "range" ? state.notes.min : null,
    noteCountMax: state.notes.mode === "range" ? state.notes.max : null,
    tags: [...state.tags],
    categories: options.hasCategories ? [...state.mv] : [],
    year: state.year,
    characterIds: state.chars,
    characterScope: state.chars.length > 0 ? state.scope : "any",
    hasAppend: state.append,
  }
}

export type MusicActiveChip = {
  key: string
  label: string
}

export type MusicChipContext = {
  difficultyLabel: (difficulty: MusicDifficulty) => string
  tagLabel: (tag: string) => string
  categoryLabel: (category: string) => string
  characterName: (characterId: number) => string | null
  scopeLabel: (scope: MusicCharacterFilterScope) => string
  /** Whether the MV-type filter applies on this server (jp ships no categories). */
  hasCategories: boolean
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/** "12–30", "≥12" or "≤30". */
export function formatQueryRange(min: number | null, max: number | null): string {
  if (min != null && max != null) {
    return min === max ? String(min) : `${min}–${max}`
  }
  if (min != null) {
    return `≥${min}`
  }
  return max != null ? `≤${max}` : ""
}

/** Removable chips for the collapsed filter panel; keys are consumed by {@link removeMusicChip}. */
export function buildMusicActiveChips(
  state: MusicQueryState,
  ctx: MusicChipContext,
  t: Translate,
): MusicActiveChip[] {
  const chips: MusicActiveChip[] = []
  const query = state.q.trim()
  if (query) {
    chips.push({ key: "q", label: t("musicCatalog.chips.search", { query }) })
  }
  if (state.diff) {
    chips.push({ key: "diff", label: ctx.difficultyLabel(state.diff) })
  }
  if (state.lvmin != null || state.lvmax != null) {
    chips.push({ key: "lv", label: t("musicCatalog.chips.level", { range: formatQueryRange(state.lvmin, state.lvmax) }) })
  }
  const notes = serializeMusicNoteCountQuery(state.notes)
  if (notes != null) {
    const value = state.notes.mode === "exact" ? String(state.notes.exact) : formatQueryRange(state.notes.min, state.notes.max)
    chips.push({ key: "notes", label: t("musicCatalog.chips.notes", { value }) })
  }
  for (const tag of state.tags) {
    chips.push({ key: `tags:${tag}`, label: ctx.tagLabel(tag) })
  }
  if (ctx.hasCategories) {
    for (const category of state.mv) {
      chips.push({ key: `mv:${category}`, label: ctx.categoryLabel(category) })
    }
  }
  if (state.year != null) {
    chips.push({ key: "year", label: String(state.year) })
  }
  for (const id of state.chars) {
    const name = ctx.characterName(id) ?? `#${id}`
    chips.push({
      key: `chars:${id}`,
      label: state.scope === "any" ? name : t("musicCatalog.chips.character", { name, scope: ctx.scopeLabel(state.scope) }),
    })
  }
  if (state.append) {
    chips.push({ key: "append", label: t("musicCatalog.chips.append") })
  }
  return chips
}

/** Clears the filter behind one chip key (mutates `state`, which is reactive on the page). */
export function removeMusicChip(state: MusicQueryState, key: string): void {
  if (key.startsWith("tags:")) {
    const tag = key.slice("tags:".length)
    state.tags = state.tags.filter((item) => item !== tag)
    return
  }
  if (key.startsWith("mv:")) {
    const category = key.slice("mv:".length)
    state.mv = state.mv.filter((item) => item !== category)
    return
  }
  if (key.startsWith("chars:")) {
    const value = key.slice("chars:".length)
    state.chars = state.chars.filter((id) => String(id) !== value)
    if (state.chars.length === 0) {
      state.scope = "any"
    }
    return
  }
  switch (key) {
    case "q":
      state.q = ""
      return
    case "diff":
      state.diff = null
      return
    case "lv":
      state.lvmin = null
      state.lvmax = null
      return
    case "notes":
      state.notes = createDefaultMusicNoteCountQuery()
      return
    case "year":
      state.year = null
      return
    case "append":
      state.append = false
      return
    default:
      return
  }
}
