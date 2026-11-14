import type { HarukiCostumeSource } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

/**
 * The rack's filters over the costume sources the mirror's master slices carry (`costume3dSources`, see the engine's
 * listRoleParts `sources`): each costume's original source, card supply, origin character, year and, for a costume
 * a region has and jp does not, the regions that have it. Costumes jp has too carry jp's values in every region, so a
 * later region filters by jp's years.
 */

/** Sources in the filter's order. */
export const COSTUME_SOURCES = ["card", "shop", "initial", "gacha", "pass", "pack", "event", "other"] as const

export type CostumeSourceKind = (typeof COSTUME_SOURCES)[number]

export const CARD_SUPPLIES = ["all", "normal", "limited"] as const

export type CardSupplyFilter = (typeof CARD_SUPPLIES)[number]

/** The year chip of costumes without a known year. */
export const UNKNOWN_YEAR = "unknown"

export type CostumeFilters = {
  sources: CostumeSourceKind[]
  /** Applies to card costumes while "card" is among `sources`. */
  cardSupply: CardSupplyFilter
  originCharacterIds: number[]
  /** "2021" …, or UNKNOWN_YEAR. */
  years: string[]
  regionExclusive: boolean
}

export function emptyCostumeFilters(): CostumeFilters {
  return { sources: [], cardSupply: "all", originCharacterIds: [], years: [], regionExclusive: false }
}

/** How many filter rows are set (the panel's badge). */
export function costumeFilterCount(filters: CostumeFilters): number {
  return Number(filters.sources.length > 0)
    + Number(filters.originCharacterIds.length > 0)
    + Number(filters.years.length > 0)
    + Number(filters.regionExclusive)
}

export function indexCostumeSources(rows: readonly HarukiCostumeSource[] | undefined): Map<number, HarukiCostumeSource> {
  return new Map((rows ?? []).map((row) => [row.costume3dId, row]))
}

export function costumeYearKey(source: HarukiCostumeSource | undefined): string {
  return source?.year != null ? String(source.year) : UNKNOWN_YEAR
}

/** Whether a costume passes every set filter (the rows are ANDed; the values within a row are ORed). */
export function matchesCostumeFilters(source: HarukiCostumeSource | undefined, filters: CostumeFilters): boolean {
  if (filters.sources.length > 0) {
    if (source == null || !(filters.sources as readonly string[]).includes(source.source)) {
      return false
    }
    if (source.source === "card" && filters.cardSupply !== "all" && source.cardSupply !== filters.cardSupply) {
      return false
    }
  }
  if (filters.originCharacterIds.length > 0
    && (source?.originCharacterId == null || !filters.originCharacterIds.includes(source.originCharacterId))) {
    return false
  }
  if (filters.years.length > 0 && !filters.years.includes(costumeYearKey(source))) {
    return false
  }
  if (filters.regionExclusive && !(source?.regions?.length)) {
    return false
  }
  return true
}

/** Whether the region has released a costume by `now` (one without a releaseAt is out). */
export function isCostumeReleased(source: HarukiCostumeSource | undefined, now: number): boolean {
  return source?.releaseAt == null || source.releaseAt <= now
}

/** The year chips of a character's costumes: its years in order, then UNKNOWN_YEAR when some have none. */
export function costumeYearOptions(sources: Iterable<HarukiCostumeSource>): string[] {
  const years = new Set<number>()
  let unknown = false
  for (const source of sources) {
    if (source.year != null) {
      years.add(source.year)
    } else {
      unknown = true
    }
  }
  const options = [...years].sort((a, b) => a - b).map(String)
  return unknown ? [...options, UNKNOWN_YEAR] : options
}

const REGION_ORDER = ["en", "tw", "kr", "cn"]

/** A region-exclusive costume's tile badge: its regions in a fixed order ("TW·KR·CN"), null for the others. */
export function costumeRegionBadge(source: HarukiCostumeSource | undefined): string | null {
  const regions = source?.regions
  if (!regions?.length) {
    return null
  }
  const rank = (region: string) => {
    const index = REGION_ORDER.indexOf(region)
    return index < 0 ? REGION_ORDER.length : index
  }
  return [...regions].sort((a, b) => rank(a) - rank(b)).map((region) => region.toUpperCase()).join("·")
}
