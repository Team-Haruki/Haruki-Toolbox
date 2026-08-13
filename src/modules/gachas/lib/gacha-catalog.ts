import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export const GACHA_TYPES = [
  "ceil",
  "normal",
  "beginner",
  "sunormal",
  "subeginner",
  "return",
] as const

export type GachaType = (typeof GACHA_TYPES)[number]

export type GachaStatus = "upcoming" | "ongoing" | "ended"

// "upcoming" stays a resolvable status (startAt in the future) but is no
// longer offered as a filter option or badge — the unreleased-content
// handling covers that state.
export const GACHA_STATUSES: readonly GachaStatus[] = ["ongoing", "ended"]

export const GACHA_SORT_KEYS = ["startDesc", "startAsc", "idAsc"] as const

export type GachaSortKey = (typeof GACHA_SORT_KEYS)[number]

export type CatalogGachaRarityRate = {
  cardRarityType: string
  lotteryType: string
  rate: number
}

export type CatalogGachaDetail = {
  cardId: number
  weight: number
}

export type CatalogGachaPickup = {
  cardId: number
  gachaPickupType: string | null
}

export type CatalogGachaBehavior = {
  id: number | null
  gachaBehaviorType: string
  costResourceType: string | null
  costResourceQuantity: number | null
  spinCount: number | null
  executeLimit: number | null
  gachaSpinnableType: string | null
}

export type CatalogGachaInformation = {
  summary: string
  description: string
}

export type CatalogGacha = {
  id: number
  gachaType: string
  name: string
  seq: number | null
  assetbundleName: string
  startAt: number | null
  endAt: number | null
  gachaCeilItemId: number | null
  wishSelectCount: number
  wishFixedSelectCount: number
  wishLimitedSelectCount: number
  rarityRates: CatalogGachaRarityRate[]
  pickups: CatalogGachaPickup[]
  details: CatalogGachaDetail[]
  behaviors: CatalogGachaBehavior[]
  information: CatalogGachaInformation
}

export type CatalogGachaCeilItem = {
  id: number
  name: string
  assetbundleName: string
  gachaId: number | null
}

export function isGachaType(value: string): value is GachaType {
  return (GACHA_TYPES as readonly string[]).includes(value)
}

export function normalizeCatalogGacha(value: unknown): CatalogGacha | null {
  if (value == null || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (!id || id <= 0) {
    return null
  }

  return {
    id,
    gachaType: normalizeCatalogString(record.gachaType),
    name: normalizeCatalogString(record.name) || `#${id}`,
    seq: normalizeCatalogNumber(record.seq),
    assetbundleName: normalizeCatalogString(record.assetbundleName),
    startAt: normalizeGachaTimestamp(record.startAt),
    endAt: normalizeGachaTimestamp(record.endAt),
    gachaCeilItemId: normalizeCatalogNumber(record.gachaCeilItemId),
    wishSelectCount: normalizeCatalogNumber(record.wishSelectCount) ?? 0,
    wishFixedSelectCount: normalizeCatalogNumber(record.wishFixedSelectCount) ?? 0,
    wishLimitedSelectCount: normalizeCatalogNumber(record.wishLimitedSelectCount) ?? 0,
    rarityRates: normalizeGachaRarityRates(record.gachaCardRarityRates),
    pickups: normalizeGachaPickups(record.gachaPickups),
    details: normalizeGachaDetails(record.gachaDetails),
    behaviors: normalizeGachaBehaviors(record.gachaBehaviors),
    information: normalizeGachaInformation(record.gachaInformation),
  }
}

export function normalizeCatalogGachas(value: unknown): CatalogGacha[] {
  return normalizeCatalogRecords(value)
    .map((record) => normalizeCatalogGacha(record))
    .filter((gacha): gacha is CatalogGacha => gacha != null)
}

/** Master data timestamps are epoch milliseconds; tolerate second-based values. */
export function normalizeGachaTimestamp(value: unknown): number | null {
  const parsed = normalizeCatalogNumber(value)
  if (parsed == null || parsed <= 0) {
    return null
  }

  return parsed < 10_000_000_000 ? parsed * 1000 : parsed
}

/** KR dumps may only carry `{cardRarityType, lotteryType, rate}` per row. */
export function normalizeGachaRarityRates(value: unknown): CatalogGachaRarityRate[] {
  return normalizeCatalogRecords(value)
    .map((record): CatalogGachaRarityRate | null => {
      const cardRarityType = normalizeCatalogString(record.cardRarityType).toLowerCase()
      const rate = normalizeCatalogNumber(record.rate)
      if (!cardRarityType || rate == null) {
        return null
      }

      return {
        cardRarityType,
        lotteryType: normalizeCatalogString(record.lotteryType) || "normal",
        rate,
      }
    })
    .filter((row): row is CatalogGachaRarityRate => row != null)
}

/** KR dumps may only carry `{gachaId, cardId}` per pickup entry. */
export function normalizeGachaPickups(value: unknown): CatalogGachaPickup[] {
  return normalizeCatalogRecords(value)
    .map((record): CatalogGachaPickup | null => {
      const cardId = normalizeCatalogNumber(record.cardId)
      if (!cardId) {
        return null
      }

      return {
        cardId,
        gachaPickupType: normalizeCatalogString(record.gachaPickupType) || null,
      }
    })
    .filter((pickup): pickup is CatalogGachaPickup => pickup != null)
}

export function normalizeGachaDetails(value: unknown): CatalogGachaDetail[] {
  return normalizeCatalogRecords(value)
    .map((record): CatalogGachaDetail | null => {
      const cardId = normalizeCatalogNumber(record.cardId)
      if (!cardId) {
        return null
      }

      return {
        cardId,
        weight: normalizeCatalogNumber(record.weight) ?? 1,
      }
    })
    .filter((detail): detail is CatalogGachaDetail => detail != null)
}

export function normalizeGachaBehaviors(value: unknown): CatalogGachaBehavior[] {
  return normalizeCatalogRecords(value)
    .map((record): CatalogGachaBehavior | null => {
      const gachaBehaviorType = normalizeCatalogString(record.gachaBehaviorType)
      if (!gachaBehaviorType) {
        return null
      }

      return {
        id: normalizeCatalogNumber(record.id),
        gachaBehaviorType,
        costResourceType: normalizeCatalogString(record.costResourceType) || null,
        costResourceQuantity: normalizeCatalogNumber(record.costResourceQuantity),
        spinCount: normalizeCatalogNumber(record.spinCount),
        executeLimit: normalizeCatalogNumber(record.executeLimit),
        gachaSpinnableType: normalizeCatalogString(record.gachaSpinnableType) || null,
      }
    })
    .filter((behavior): behavior is CatalogGachaBehavior => behavior != null)
}

export function normalizeGachaInformation(value: unknown): CatalogGachaInformation {
  if (value == null || typeof value !== "object") {
    return { summary: "", description: "" }
  }

  const record = value as Record<string, unknown>
  return {
    summary: normalizeCatalogString(record.summary),
    description: normalizeCatalogString(record.description),
  }
}

export function normalizeGachaCeilItems(value: unknown): Map<number, CatalogGachaCeilItem> {
  const map = new Map<number, CatalogGachaCeilItem>()
  for (const record of normalizeCatalogRecords(value)) {
    const id = normalizeCatalogNumber(record.id)
    if (!id) {
      continue
    }

    map.set(id, {
      id,
      name: normalizeCatalogString(record.name),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
      gachaId: normalizeCatalogNumber(record.gachaId),
    })
  }

  return map
}

export function resolveGachaStatus(gacha: CatalogGacha, nowMs = Date.now()): GachaStatus {
  if (gacha.startAt != null && nowMs < gacha.startAt) {
    return "upcoming"
  }

  if (gacha.startAt != null && gacha.endAt != null && nowMs <= gacha.endAt) {
    return "ongoing"
  }

  return "ended"
}

/** A gacha counts as unreleased while its startAt is still in the future. */
export function isGachaUnreleased(gacha: Pick<CatalogGacha, "startAt">, nowMs = Date.now()): boolean {
  return gacha.startAt != null && gacha.startAt > nowMs
}

/** Removes unreleased gachas when hiding is enabled; otherwise returns the input unchanged. */
export function excludeUnreleasedGachas(
  gachas: readonly CatalogGacha[],
  hide: boolean,
  nowMs = Date.now(),
): readonly CatalogGacha[] {
  if (!hide) {
    return gachas
  }

  return gachas.filter((gacha) => !isGachaUnreleased(gacha, nowMs))
}

export function resolveGachaYear(gacha: CatalogGacha): number | null {
  if (gacha.startAt == null) {
    return null
  }

  return new Date(gacha.startAt).getFullYear()
}

export function collectGachaYears(gachas: readonly CatalogGacha[]): number[] {
  const years = new Set<number>()
  for (const gacha of gachas) {
    const year = resolveGachaYear(gacha)
    if (year != null) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}

export type GachaFilterOptions = {
  search?: string
  gachaType?: string | null
  status?: GachaStatus | null
  year?: number | null
  /** Keeps only gachas whose pool (details) or pickups contain every one of these cards. */
  cardIds?: readonly number[] | null
}

export function gachaContainsCard(gacha: CatalogGacha, cardId: number): boolean {
  return gacha.details.some((detail) => detail.cardId === cardId)
    || gacha.pickups.some((pickup) => pickup.cardId === cardId)
}

export function filterGachas(
  gachas: readonly CatalogGacha[],
  options: GachaFilterOptions,
  nowMs = Date.now(),
): CatalogGacha[] {
  const search = options.search?.trim().toLowerCase() ?? ""
  const gachaType = options.gachaType ?? null
  const status = options.status ?? null
  const year = options.year ?? null
  const cardIds = options.cardIds ?? []

  return gachas.filter((gacha) => {
    if (cardIds.length > 0 && !cardIds.every((cardId) => gachaContainsCard(gacha, cardId))) {
      return false
    }

    if (search && !gacha.name.toLowerCase().includes(search) && String(gacha.id) !== search) {
      return false
    }

    if (gachaType && gacha.gachaType !== gachaType) {
      return false
    }

    if (status && resolveGachaStatus(gacha, nowMs) !== status) {
      return false
    }

    if (year != null && resolveGachaYear(gacha) !== year) {
      return false
    }

    return true
  })
}

export function sortGachas(gachas: readonly CatalogGacha[], sortKey: GachaSortKey): CatalogGacha[] {
  const sorted = [...gachas]
  if (sortKey === "idAsc") {
    return sorted.sort((a, b) => a.id - b.id)
  }

  if (sortKey === "startAsc") {
    return sorted.sort((a, b) => (a.startAt ?? Number.MAX_SAFE_INTEGER) - (b.startAt ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
  }

  return sorted.sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0) || b.id - a.id)
}

export function countGachaPages(total: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(total / pageSize))
}

export function paginateGachas<T>(items: readonly T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) {
    return [...items]
  }

  const totalPages = countGachaPages(items.length, pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

/** Dedup pickup card ids by first occurrence, preserving order. */
export function dedupGachaPickupCardIds(pickups: readonly CatalogGachaPickup[]): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const pickup of pickups) {
    if (!seen.has(pickup.cardId)) {
      seen.add(pickup.cardId)
      result.push(pickup.cardId)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Rate math (ported from the Haruki Go bot)
// ---------------------------------------------------------------------------

export type GachaRateSummary = {
  /** rarity -> probability fraction (0..1) for a normal slot. */
  baseRates: Map<string, number>
  /** rarity guaranteed by the 10-pull slot, if any. */
  guaranteedRarity: "rarity_3" | "rarity_4" | null
  /** rarity -> probability fraction for the guaranteed slot; null when no guarantee. */
  guaranteedRates: Map<string, number> | null
  /** rarity -> number of distinct cards in the pool. */
  rarityCardCounts: Map<string, number>
  /** rarity -> total lottery weight of the pool. */
  rarityWeightTotals: Map<string, number>
  /** cardId -> accumulated lottery weight. */
  cardWeights: Map<number, number>
  /** cardId -> rarity used for bucketing (lowercased). */
  cardRarities: Map<number, string>
}

/** `over_rarity_4_once` wins over `over_rarity_3_once` when both are present. */
export function resolveGachaGuaranteedRarity(
  behaviors: readonly CatalogGachaBehavior[],
): "rarity_3" | "rarity_4" | null {
  let guaranteed: "rarity_3" | "rarity_4" | null = null
  for (const behavior of behaviors) {
    if (behavior.gachaBehaviorType === "over_rarity_4_once") {
      return "rarity_4"
    }

    if (behavior.gachaBehaviorType === "over_rarity_3_once") {
      guaranteed = "rarity_3"
    }
  }

  return guaranteed
}

export function buildGachaRateSummary(
  gacha: CatalogGacha,
  cardRarityByCardId: ReadonlyMap<number, string>,
): GachaRateSummary {
  const baseRates = new Map<string, number>()
  for (const row of gacha.rarityRates) {
    if (row.lotteryType !== "normal") {
      continue
    }

    baseRates.set(row.cardRarityType, row.rate / 100)
  }

  const cardWeights = new Map<number, number>()
  const cardRarities = new Map<number, string>()
  const rarityWeightTotals = new Map<string, number>()
  const rarityCardSets = new Map<string, Set<number>>()
  for (const detail of gacha.details) {
    const rarity = cardRarityByCardId.get(detail.cardId)?.toLowerCase()
    if (!rarity) {
      continue
    }

    cardWeights.set(detail.cardId, (cardWeights.get(detail.cardId) ?? 0) + detail.weight)
    cardRarities.set(detail.cardId, rarity)
    rarityWeightTotals.set(rarity, (rarityWeightTotals.get(rarity) ?? 0) + detail.weight)
    let cardSet = rarityCardSets.get(rarity)
    if (!cardSet) {
      cardSet = new Set<number>()
      rarityCardSets.set(rarity, cardSet)
    }

    cardSet.add(detail.cardId)
  }

  const rarityCardCounts = new Map<string, number>()
  for (const [rarity, cardSet] of rarityCardSets) {
    rarityCardCounts.set(rarity, cardSet.size)
  }

  const guaranteedRarity = resolveGachaGuaranteedRarity(gacha.behaviors)
  let guaranteedRates: Map<string, number> | null = null
  if (guaranteedRarity != null) {
    guaranteedRates = new Map(baseRates)
    let folded = guaranteedRates.get(guaranteedRarity) ?? 0
    folded += guaranteedRates.get("rarity_2") ?? 0
    guaranteedRates.set("rarity_2", 0)
    if (guaranteedRarity === "rarity_4") {
      folded += guaranteedRates.get("rarity_3") ?? 0
      guaranteedRates.set("rarity_3", 0)
    }

    guaranteedRates.set(guaranteedRarity, folded)
  }

  return {
    baseRates,
    guaranteedRarity,
    guaranteedRates,
    rarityCardCounts,
    rarityWeightTotals,
    cardWeights,
    cardRarities,
  }
}

/** Per-card fraction = (cardWeight / rarityWeightTotal) * rarityRateFraction. */
export function resolveGachaCardRate(summary: GachaRateSummary, cardId: number): number | null {
  const rarity = summary.cardRarities.get(cardId)
  if (!rarity) {
    return null
  }

  const weight = summary.cardWeights.get(cardId) ?? 0
  const totalWeight = summary.rarityWeightTotals.get(rarity) ?? 0
  const rarityRate = summary.baseRates.get(rarity) ?? 0
  if (weight <= 0 || totalWeight <= 0) {
    return null
  }

  return (weight / totalWeight) * rarityRate
}

export function formatGachaRatePercent(fraction: number | null | undefined, digits = 3): string {
  if (fraction == null || !Number.isFinite(fraction)) {
    return "—"
  }

  return `${(fraction * 100).toFixed(digits)}%`
}

/** Rarities present in either the rate table or the card pool, highest first. */
export function collectGachaRarities(summary: GachaRateSummary): string[] {
  const rarities = new Set<string>([...summary.baseRates.keys(), ...summary.rarityCardCounts.keys()])
  return [...rarities].sort((a, b) => rarityOrder(b) - rarityOrder(a))
}

function rarityOrder(rarity: string): number {
  if (rarity === "rarity_birthday") {
    return 2.5
  }

  const match = rarity.match(/\d+/)
  return match ? Number(match[0]) : 0
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Strips HTML-ish markup; the result is rendered as plain text (never v-html). */
export function stripGachaMarkup(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim()
}

// ---------------------------------------------------------------------------
// Asset URL candidates (probed client-side with an onerror fallback chain)
// ---------------------------------------------------------------------------

export function buildGachaLogoCandidates(
  gacha: Pick<CatalogGacha, "id" | "seq" | "assetbundleName">,
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference = "china",
): string[] {
  const paths: string[] = []
  const assetbundleName = gacha.assetbundleName
  if (assetbundleName) {
    // Non-jp dumps (and newer jp gachas) ship gacha art under ondemand/.
    paths.push(`ondemand/gacha/${assetbundleName}/logo/logo.png`)
    paths.push(`startapp/gacha/${assetbundleName}/logo/logo.png`)
    paths.push(`startapp/logo/${assetbundleName}.png`)
  }

  paths.push(`startapp/gacha/ab_gacha_${gacha.id}/logo/logo.png`)
  const digits = assetbundleName.match(/\d+/)?.[0]
  if (digits) {
    paths.push(`startapp/logo/banner_logo${digits}.png`)
  }

  if (gacha.seq != null) {
    paths.push(`startapp/logo/banner_logo${gacha.seq}.png`)
  }

  paths.push(`startapp/logo/banner_logo${gacha.id}.png`)
  return dedupAssetPaths(paths).map((path) => resolveSekaiGameAssetUrl(region, path, preference))
}

export function buildGachaBannerCandidates(
  gacha: Pick<CatalogGacha, "id" | "assetbundleName">,
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference = "china",
): string[] {
  const paths = [
    `startapp/home/banner/banner_gacha${gacha.id}/banner_gacha${gacha.id}.png`,
  ]
  if (gacha.assetbundleName) {
    // Non-jp dumps (and newer jp gachas) ship gacha art under ondemand/.
    paths.push(`ondemand/gacha/${gacha.assetbundleName}/screen/texture/bg_gacha${gacha.id}.png`)
  }
  paths.push(`startapp/gacha/ab_gacha_${gacha.id}/screen/texture/bg_gacha${gacha.id}.png`)
  if (gacha.assetbundleName) {
    paths.push(`startapp/home/banner/${gacha.assetbundleName}/${gacha.assetbundleName}.png`)
  }

  return dedupAssetPaths(paths).map((path) => resolveSekaiGameAssetUrl(region, path, preference))
}

/**
 * Rerun gachas ([復刻]/[复刻]/[回响]/[1回限定]…) ship no banner of their own;
 * their name is another gacha's full name with extra bracketed prefixes.
 * Maps such gachas to the original whose banner they can reuse. When several
 * gachas share the base name, the closest earlier id wins (the original
 * always precedes its reruns).
 */
export function buildGachaBannerAliasMap(
  gachas: readonly Pick<CatalogGacha, "id" | "name">[],
): Map<number, number> {
  const idsByName = new Map<string, number[]>()
  for (const gacha of gachas) {
    const name = gacha.name.trim()
    const ids = idsByName.get(name) ?? []
    ids.push(gacha.id)
    idsByName.set(name, ids)
  }

  const aliases = new Map<number, number>()
  for (const gacha of gachas) {
    let rest = gacha.name.trim()
    for (let depth = 0; depth < 3; depth++) {
      const stripped = rest.replace(/^\s*[[［][^\]］]*[\]］]\s*/u, "")
      if (stripped === rest || stripped === "") {
        break
      }
      rest = stripped

      const ids = (idsByName.get(rest) ?? []).filter((id) => id !== gacha.id)
      if (ids.length > 0) {
        const earlier = ids.filter((id) => id < gacha.id)
        aliases.set(gacha.id, earlier.length > 0 ? Math.max(...earlier) : Math.min(...ids))
        break
      }
    }
  }

  return aliases
}

/**
 * Combined display-image candidates, most-likely-first: probing the asset CDN
 * shows the home banner (`banner_gacha{id}`) is the only asset that reliably
 * exists, so it leads and the logo variants serve as fallbacks. Reruns get the
 * aliased original's banner right after their own. Some gachas (very old or
 * not yet mirrored) have no assets at all.
 */
export function buildGachaImageCandidates(
  gacha: Pick<CatalogGacha, "id" | "seq" | "assetbundleName">,
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference = "china",
  aliasGachaId?: number | null,
): string[] {
  const aliasBanners = aliasGachaId != null && aliasGachaId !== gacha.id
    ? buildGachaBannerCandidates({ id: aliasGachaId, assetbundleName: "" }, region, preference)
    : []

  return dedupAssetPaths([
    ...buildGachaBannerCandidates(gacha, region, preference),
    ...aliasBanners,
    ...buildGachaLogoCandidates(gacha, region, preference),
  ])
}

export function buildGachaCeilItemIconCandidates(
  assetbundleName: string,
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference = "china",
): string[] {
  const name = assetbundleName.trim()
  if (!name) {
    return []
  }

  return [
    `startapp/thumbnail/gacha_item/${name}.png`,
    `startapp/thumbnail/material/${name}.png`,
    `startapp/thumbnail/common_material/${name}.png`,
  ].map((path) => resolveSekaiGameAssetUrl(region, path, preference))
}

function dedupAssetPaths(paths: readonly string[]): string[] {
  return [...new Set(paths)]
}
