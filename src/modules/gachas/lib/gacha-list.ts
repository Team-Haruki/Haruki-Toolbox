import { matchesCommandSearch } from "@/lib/search-match"
import { resolveCatalogStatus, type CatalogSortDirection, type CatalogStatus } from "@/shared/components/catalog/types"
import type { CatalogGachaSummary } from "@/modules/gachas/composables/useGachasIndex"
import type { GachaListQuery, GachaListSortKey } from "@/modules/gachas/lib/gachas-query"

/** The slice of a gacha summary the list filters/sorts need. */
export type GachaListItem = Pick<CatalogGachaSummary, "id" | "gachaType" | "name" | "startAt" | "endAt" | "pickupCardIds">

export type GachaListFilterContext = {
  /** gachaId → pickup character ids (from the cards index). */
  pickupCharacterIdsByGacha: ReadonlyMap<number, ReadonlySet<number>>
  /** gachaId → search parts (name, id, pickup character names). */
  searchPartsByGacha: ReadonlyMap<number, readonly string[]>
  nowMs: number
}

/** gachaId → set of pickup character ids, resolved through `cardCharacterById`. */
export function buildGachaPickupCharacterMap(
  gachas: readonly GachaListItem[],
  cardCharacterById: ReadonlyMap<number, number | null>,
): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>()
  for (const gacha of gachas) {
    const ids = new Set<number>()
    for (const cardId of gacha.pickupCardIds) {
      const characterId = cardCharacterById.get(cardId)
      if (characterId != null) {
        ids.add(characterId)
      }
    }
    map.set(gacha.id, ids)
  }
  return map
}

export function buildGachaSearchParts(gacha: GachaListItem, characterNames: readonly string[]): string[] {
  return [gacha.name, `#${gacha.id}`, ...characterNames].filter(Boolean)
}

export function resolveGachaListYear(gacha: Pick<GachaListItem, "startAt">): number | null {
  return gacha.startAt == null ? null : new Date(gacha.startAt).getFullYear()
}

export function collectGachaListYears(gachas: readonly GachaListItem[]): number[] {
  const years = new Set<number>()
  for (const gacha of gachas) {
    const year = resolveGachaListYear(gacha)
    if (year != null) {
      years.add(year)
    }
  }
  return [...years].sort((a, b) => b - a)
}

export function resolveGachaListStatus(gacha: Pick<GachaListItem, "startAt" | "endAt">, nowMs: number): CatalogStatus {
  return resolveCatalogStatus(gacha.startAt, gacha.endAt, nowMs)
}

/** The timestamp a status badge counts towards: start when upcoming, end when ongoing. */
export function resolveGachaStatusUntil(
  gacha: Pick<GachaListItem, "startAt" | "endAt">,
  status: CatalogStatus,
): number | null {
  if (status === "upcoming") {
    return gacha.startAt
  }
  if (status === "ongoing") {
    return gacha.endAt
  }
  return null
}

export function filterGachaList<T extends GachaListItem>(
  gachas: readonly T[],
  query: Pick<GachaListQuery, "q" | "type" | "status" | "year" | "chars" | "cards">,
  ctx: GachaListFilterContext,
): T[] {
  const search = query.q.trim()
  const types = query.type.length > 0 ? new Set(query.type) : null
  const statuses = query.status.length > 0 ? new Set<CatalogStatus>(query.status) : null
  const year = query.year
  const chars = query.chars
  const cards = query.cards

  return gachas.filter((gacha) => {
    if (types && !types.has(gacha.gachaType)) {
      return false
    }
    if (statuses && !statuses.has(resolveGachaListStatus(gacha, ctx.nowMs))) {
      return false
    }
    if (year != null && resolveGachaListYear(gacha) !== year) {
      return false
    }
    if (chars.length > 0) {
      const pickupCharacters = ctx.pickupCharacterIdsByGacha.get(gacha.id)
      if (!pickupCharacters || !chars.some((id) => pickupCharacters.has(id))) {
        return false
      }
    }
    if (cards.length > 0 && !cards.every((cardId) => gacha.pickupCardIds.includes(cardId))) {
      return false
    }
    if (search) {
      const parts = ctx.searchPartsByGacha.get(gacha.id) ?? buildGachaSearchParts(gacha, [])
      if (!matchesCommandSearch(parts, search)) {
        return false
      }
    }
    return true
  })
}

export function sortGachaList<T extends GachaListItem>(
  gachas: readonly T[],
  sort: GachaListSortKey,
  direction: CatalogSortDirection,
): T[] {
  const sign = direction === "asc" ? 1 : -1
  const sorted = [...gachas]
  if (sort === "id") {
    return sorted.sort((a, b) => sign * (a.id - b.id))
  }
  return sorted.sort((a, b) => {
    const aStart = a.startAt ?? (direction === "asc" ? Number.MAX_SAFE_INTEGER : 0)
    const bStart = b.startAt ?? (direction === "asc" ? Number.MAX_SAFE_INTEGER : 0)
    return sign * (aStart - bStart) || sign * (a.id - b.id)
  })
}
