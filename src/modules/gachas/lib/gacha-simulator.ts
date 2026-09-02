import type { CatalogGacha, CatalogGachaBehavior } from "@/modules/gachas/lib/gacha-catalog"
import { GACHA_NORMAL_LOTTERY, resolveGachaRarityOrder } from "@/modules/gachas/lib/gacha-rates"

/**
 * Fan-made pull simulator. Every probability comes from the record's
 * `gachaCardRarityRates` rows (one bucket per lotteryType × rarity) and the
 * card weights in `gachaDetails`; the 10th-pull guarantee is the rule the
 * matching `gachaBehaviors` row declares (`over_rarity_3_once` /
 * `over_rarity_4_once`), applied by folding the excluded rarities' share
 * into the guaranteed rarity — which is how the in-game rate sheet states
 * the guaranteed slot (★3 97 % / ★4 3 % for a ≥3★ guarantee).
 */

export type GachaRng = () => number

/** Small seeded PRNG so tests (and "share this roll") are reproducible. */
export function mulberry32(seed: number): GachaRng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type GachaSimulatorBucket = {
  lotteryType: string
  rarity: string
  /** Percentage share as written in master data (88.5, 3, 3.2…). */
  rate: number
  cardIds: number[]
  weights: number[]
  totalWeight: number
}

export type GachaGuaranteeRarity = "rarity_3" | "rarity_4"

export type GachaSimulatorPull = {
  behaviorType: string
  spinCount: number
  costResourceType: string | null
  costResourceQuantity: number | null
  executeLimit: number | null
  /** Rarity the last pull of the batch is guaranteed to reach, when the behavior declares one. */
  guaranteeRarity: GachaGuaranteeRarity | null
}

export type GachaSimulatorModel = {
  buckets: GachaSimulatorBucket[]
  totalRate: number
  /** Cards treated as the player's wish picks (empty when the gacha has no wish). */
  wishCardIds: number[]
  wishSelectCount: number
  single: GachaSimulatorPull | null
  ten: GachaSimulatorPull | null
}

export type GachaDrawResult = {
  cardId: number
  rarity: string
  lotteryType: string
  /** Drawn from the guaranteed slot of a multi-pull. */
  guaranteed: boolean
}

export type GachaSimulatorOptions = {
  /** Overrides the default wish selection (pickups eligible for the wish). */
  wishCardIds?: readonly number[]
}

export function resolveGuaranteeRarity(behaviorType: string): GachaGuaranteeRarity | null {
  if (behaviorType === "over_rarity_4_once") {
    return "rarity_4"
  }
  if (behaviorType === "over_rarity_3_once") {
    return "rarity_3"
  }
  return null
}

const RESOURCE_PREFERENCE: Record<string, number> = {
  jewel: 0,
  gacha_ticket: 1,
  paid_jewel: 2,
}

function resourceRank(behavior: CatalogGachaBehavior): number {
  if (behavior.costResourceType == null) {
    return 3
  }
  return RESOURCE_PREFERENCE[behavior.costResourceType] ?? 4
}

function toPull(behavior: CatalogGachaBehavior): GachaSimulatorPull {
  return {
    behaviorType: behavior.gachaBehaviorType,
    spinCount: behavior.spinCount ?? 1,
    costResourceType: behavior.costResourceType,
    costResourceQuantity: behavior.costResourceQuantity,
    executeLimit: behavior.executeLimit,
    guaranteeRarity: resolveGuaranteeRarity(behavior.gachaBehaviorType),
  }
}

function pickBehavior(candidates: readonly CatalogGachaBehavior[]): CatalogGachaBehavior | null {
  const sorted = [...candidates].sort((a, b) => {
    // Repeatable (no executeLimit) before once-only offers, then the
    // everyday resource before paid ones, then the record order.
    const repeat = Number(a.executeLimit != null) - Number(b.executeLimit != null)
    if (repeat !== 0) {
      return repeat
    }
    return resourceRank(a) - resourceRank(b)
  })
  return sorted[0] ?? null
}

/** The ×1 and ×10 buttons: the behaviors a player would use day to day. */
export function resolveSimulatorPulls(
  behaviors: readonly CatalogGachaBehavior[],
): { single: GachaSimulatorPull | null; ten: GachaSimulatorPull | null } {
  const singles = behaviors.filter((behavior) => (behavior.spinCount ?? 1) === 1)
  const tens = behaviors.filter((behavior) => (behavior.spinCount ?? 1) >= 10)
  const preferredSingles = singles.filter((behavior) => behavior.gachaSpinnableType !== "colorful_pass")
  const single = pickBehavior(preferredSingles.length > 0 ? preferredSingles : singles)
  const ten = pickBehavior(tens)
  return {
    single: single ? toPull(single) : null,
    ten: ten ? toPull(ten) : null,
  }
}

/** Default wish picks: pickup cards flagged `isWish`, capped by `wishSelectCount`. */
export function selectDefaultWishCards(gacha: Pick<CatalogGacha, "wishSelectCount" | "pickups" | "details">): number[] {
  if (gacha.wishSelectCount <= 0) {
    return []
  }
  const wishable = new Set(gacha.details.filter((detail) => detail.isWish).map((detail) => detail.cardId))
  const picks: number[] = []
  for (const pickup of gacha.pickups) {
    if (wishable.has(pickup.cardId) && !picks.includes(pickup.cardId)) {
      picks.push(pickup.cardId)
    }
    if (picks.length >= gacha.wishSelectCount) {
      break
    }
  }
  return picks
}

type PoolCard = { cardId: number; weight: number }

function toPoolCards(cards: ReadonlyMap<number, number>): PoolCard[] {
  return [...cards].map(([cardId, weight]) => ({ cardId, weight }))
}

/**
 * Cards a special lottery draws from: `categorized_wish` (and any unknown
 * wish lottery) takes every wished card of the rarity, `rate_choice_first`
 * / `rate_choice_second` the first / second wish pick. Wished cards no
 * special lottery claims stay in the normal bucket, so every pool card
 * remains drawable.
 */
function wishPoolForLottery(lotteryType: string, wished: readonly PoolCard[]): PoolCard[] {
  if (wished.length === 0) {
    return []
  }
  if (lotteryType === "rate_choice_first") {
    return wished.slice(0, 1)
  }
  if (lotteryType === "rate_choice_second") {
    return wished.length > 1 ? wished.slice(1, 2) : wished.slice(0, 1)
  }
  return [...wished]
}

export function buildGachaSimulatorModel(
  gacha: CatalogGacha,
  cardRarityByCardId: ReadonlyMap<number, string>,
  options: GachaSimulatorOptions = {},
): GachaSimulatorModel {
  const cardsByRarity = new Map<string, Map<number, number>>()
  for (const detail of gacha.details) {
    const rarity = cardRarityByCardId.get(detail.cardId)?.toLowerCase()
    if (!rarity || detail.weight <= 0) {
      continue
    }
    let cards = cardsByRarity.get(rarity)
    if (!cards) {
      cards = new Map()
      cardsByRarity.set(rarity, cards)
    }
    cards.set(detail.cardId, (cards.get(detail.cardId) ?? 0) + detail.weight)
  }

  const wishCardIds = gacha.wishSelectCount > 0
    ? [...(options.wishCardIds ?? selectDefaultWishCards(gacha))]
    : []

  // Special lottery pools per `lotteryType rarity` (in wish-pick order) and
  // the cards they claim away from the normal lottery of that rarity.
  const specialPools = new Map<string, PoolCard[]>()
  const claimedByRarity = new Map<string, Set<number>>()
  for (const row of gacha.rarityRates) {
    if (row.lotteryType === GACHA_NORMAL_LOTTERY) {
      continue
    }
    const rarityCards = cardsByRarity.get(row.cardRarityType)
    if (!rarityCards) {
      continue
    }
    const key = `${row.lotteryType} ${row.cardRarityType}`
    if (specialPools.has(key)) {
      continue
    }
    const wished = wishCardIds
      .filter((cardId) => rarityCards.has(cardId))
      .map((cardId) => ({ cardId, weight: rarityCards.get(cardId) ?? 0 }))
    const pool = wishPoolForLottery(row.lotteryType, wished)
    specialPools.set(key, pool)
    let claimed = claimedByRarity.get(row.cardRarityType)
    if (!claimed) {
      claimed = new Set()
      claimedByRarity.set(row.cardRarityType, claimed)
    }
    for (const card of pool) {
      claimed.add(card.cardId)
    }
  }

  const buckets: GachaSimulatorBucket[] = []
  for (const row of gacha.rarityRates) {
    if (row.rate <= 0) {
      continue
    }
    const rarityCards = cardsByRarity.get(row.cardRarityType)
    if (!rarityCards || rarityCards.size === 0) {
      continue
    }
    let pool: PoolCard[]
    if (row.lotteryType === GACHA_NORMAL_LOTTERY) {
      const claimed = claimedByRarity.get(row.cardRarityType)
      const all = toPoolCards(rarityCards)
      const rest = claimed && claimed.size > 0 ? all.filter((card) => !claimed.has(card.cardId)) : all
      pool = rest.length > 0 ? rest : all
    } else {
      // A wish lottery without any wished card of this rarity draws from the whole rarity.
      const special = specialPools.get(`${row.lotteryType} ${row.cardRarityType}`) ?? []
      pool = special.length > 0 ? special : toPoolCards(rarityCards)
    }
    if (pool.length === 0) {
      continue
    }
    buckets.push({
      lotteryType: row.lotteryType,
      rarity: row.cardRarityType,
      rate: row.rate,
      cardIds: pool.map((card) => card.cardId),
      weights: pool.map((card) => card.weight),
      totalWeight: pool.reduce((sum, card) => sum + card.weight, 0),
    })
  }

  const { single, ten } = resolveSimulatorPulls(gacha.behaviors)

  return {
    buckets,
    totalRate: buckets.reduce((sum, bucket) => sum + bucket.rate, 0),
    wishCardIds,
    wishSelectCount: gacha.wishSelectCount,
    single,
    ten,
  }
}

/** Rank used by guarantees: birthday members count as ★3 for "★3 or above". */
function guaranteeRank(rarity: string): number {
  return rarity === "rarity_birthday" ? 3 : resolveGachaRarityOrder(rarity)
}

/**
 * Buckets for the guaranteed slot: rarities below the guarantee are dropped
 * and their share is folded into the guaranteed rarity's buckets, keeping
 * every higher rarity at its listed rate.
 */
export function applyGuarantee(
  buckets: readonly GachaSimulatorBucket[],
  guarantee: GachaGuaranteeRarity | null,
): GachaSimulatorBucket[] {
  if (!guarantee) {
    return [...buckets]
  }
  const minimum = guaranteeRank(guarantee)
  const kept = buckets.filter((bucket) => guaranteeRank(bucket.rarity) >= minimum)
  if (kept.length === 0) {
    return [...buckets]
  }
  const folded = buckets
    .filter((bucket) => guaranteeRank(bucket.rarity) < minimum)
    .reduce((sum, bucket) => sum + bucket.rate, 0)
  if (folded <= 0) {
    return kept
  }
  // The folded share lands on the guaranteed rarity itself (★3 97 % on a
  // birthday gacha keeps birthday at 3 %); equal-rank rarities only step
  // in when the guaranteed rarity has no bucket at all.
  let targets = kept.filter((bucket) => bucket.rarity === guarantee)
  if (targets.length === 0) {
    targets = kept.filter((bucket) => guaranteeRank(bucket.rarity) === minimum)
  }
  if (targets.length === 0) {
    targets = kept
  }
  const targetTotal = targets.reduce((sum, bucket) => sum + bucket.rate, 0)
  return kept.map((bucket) => {
    if (!targets.includes(bucket)) {
      return bucket
    }
    const share = targetTotal > 0 ? bucket.rate / targetTotal : 1 / targets.length
    return { ...bucket, rate: bucket.rate + folded * share }
  })
}

export function drawOnce(
  buckets: readonly GachaSimulatorBucket[],
  rng: GachaRng,
  guaranteed = false,
): GachaDrawResult | null {
  const total = buckets.reduce((sum, bucket) => sum + bucket.rate, 0)
  if (total <= 0) {
    return null
  }
  let roll = rng() * total
  let chosen = buckets[buckets.length - 1] ?? null
  for (const bucket of buckets) {
    if (roll < bucket.rate) {
      chosen = bucket
      break
    }
    roll -= bucket.rate
  }
  if (!chosen || chosen.cardIds.length === 0) {
    return null
  }
  let weightRoll = rng() * chosen.totalWeight
  let cardId = chosen.cardIds[chosen.cardIds.length - 1]!
  for (let index = 0; index < chosen.cardIds.length; index += 1) {
    const weight = chosen.weights[index] ?? 0
    if (weightRoll < weight) {
      cardId = chosen.cardIds[index]!
      break
    }
    weightRoll -= weight
  }
  return { cardId, rarity: chosen.rarity, lotteryType: chosen.lotteryType, guaranteed }
}

/** A multi-pull: `spinCount - 1` regular draws, then the guaranteed slot. */
export function drawBatch(model: GachaSimulatorModel, pull: GachaSimulatorPull, rng: GachaRng): GachaDrawResult[] {
  const results: GachaDrawResult[] = []
  const count = Math.max(1, pull.spinCount)
  for (let index = 0; index < count - 1; index += 1) {
    const result = drawOnce(model.buckets, rng)
    if (result) {
      results.push(result)
    }
  }
  const last = drawOnce(applyGuarantee(model.buckets, pull.guaranteeRarity), rng, pull.guaranteeRarity != null)
  if (last) {
    results.push(last)
  }
  return results
}

export function drawTen(model: GachaSimulatorModel, rng: GachaRng): GachaDrawResult[] {
  const pull = model.ten ?? {
    behaviorType: "normal",
    spinCount: 10,
    costResourceType: null,
    costResourceQuantity: null,
    executeLimit: null,
    guaranteeRarity: null,
  }
  return drawBatch(model, { ...pull, spinCount: 10 }, rng)
}

export type GachaSimulatorTally = {
  rarity: string
  count: number
}

/**
 * Adds one batch to running per-rarity counts without mutating the input.
 * Cost is O(batch + rarities), independent of how many pulls came before.
 */
export function addDrawResultsToCounts(
  counts: ReadonlyMap<string, number>,
  results: readonly GachaDrawResult[],
): Map<string, number> {
  const next = new Map(counts)
  for (const result of results) {
    next.set(result.rarity, (next.get(result.rarity) ?? 0) + 1)
  }
  return next
}

/** Tally rows from running per-rarity counts, highest rarity first. */
export function tallyFromCounts(counts: ReadonlyMap<string, number>): GachaSimulatorTally[] {
  return [...counts.entries()]
    .map(([rarity, count]) => ({ rarity, count }))
    .sort((a, b) => resolveGachaRarityOrder(b.rarity) - resolveGachaRarityOrder(a.rarity))
}

/** Counts per rarity, highest rarity first. */
export function tallyDrawResults(results: readonly GachaDrawResult[]): GachaSimulatorTally[] {
  return tallyFromCounts(addDrawResultsToCounts(new Map(), results))
}

/** Adds one pull's cost to the running per-resource total. */
export function addSimulatorCost(
  spent: ReadonlyMap<string, number>,
  pull: GachaSimulatorPull,
): Map<string, number> {
  const next = new Map(spent)
  if (pull.costResourceType && pull.costResourceQuantity != null && pull.costResourceQuantity > 0) {
    next.set(pull.costResourceType, (next.get(pull.costResourceType) ?? 0) + pull.costResourceQuantity)
  }
  return next
}

/**
 * cardId → fraction (0..1) of a single pull, summed over every lottery
 * bucket the card sits in (a wished ★4 draws from both the normal and the
 * wish lottery). Percentages are read literally from master data, so the
 * values line up with the rate table rather than with a renormalized pool.
 */
export function buildGachaCardRateMap(model: Pick<GachaSimulatorModel, "buckets">): Map<number, number> {
  const rates = new Map<number, number>()
  for (const bucket of model.buckets) {
    if (bucket.totalWeight <= 0) {
      continue
    }
    for (let index = 0; index < bucket.cardIds.length; index += 1) {
      const cardId = bucket.cardIds[index]!
      const weight = bucket.weights[index] ?? 0
      const fraction = (bucket.rate / 100) * (weight / bucket.totalWeight)
      rates.set(cardId, (rates.get(cardId) ?? 0) + fraction)
    }
  }
  return rates
}
