import { computed, ref, shallowRef, watch, type ComputedRef, type Ref, type ShallowRef } from "vue"
import {
  addSimulatorCost,
  drawBatch,
  drawTen,
  mulberry32,
  tallyDrawResults,
  type GachaDrawResult,
  type GachaRng,
  type GachaSimulatorModel,
  type GachaSimulatorPull,
  type GachaSimulatorTally,
} from "@/modules/gachas/lib/gacha-simulator"

export type GachaSimulatorDraw = GachaDrawResult & {
  /** Stable render key within a batch. */
  key: number
  /** First time this card shows up in the session. */
  isNew: boolean
}

export type GachaSimulatorState = {
  /** Results of the most recent pull. */
  lastBatch: ShallowRef<GachaSimulatorDraw[]>
  lastPull: ShallowRef<GachaSimulatorPull | null>
  /** Per-rarity counts over every pull of the session. */
  tally: ComputedRef<GachaSimulatorTally[]>
  drawCount: Ref<number>
  batchCount: Ref<number>
  spent: ShallowRef<ReadonlyMap<string, number>>
  hasPulled: ComputedRef<boolean>
  canPull: ComputedRef<boolean>
  pullSingle: () => void
  pullTen: () => void
  reset: () => void
}

const FREE_SINGLE: GachaSimulatorPull = {
  behaviorType: "normal",
  spinCount: 1,
  costResourceType: null,
  costResourceQuantity: null,
  executeLimit: null,
  guaranteeRarity: null,
}

function randomSeed(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    return buffer[0] ?? Date.now()
  }
  return Date.now() >>> 0
}

/**
 * Session state of the fan-made pull simulator: the last batch, cumulative
 * tally, spend by resource and the "NEW" bookkeeping. Resets whenever the
 * model (gacha, region or wish picks) changes.
 */
export function useGachaSimulator(model: Ref<GachaSimulatorModel | null>): GachaSimulatorState {
  const lastBatch = shallowRef<GachaSimulatorDraw[]>([])
  const lastPull = shallowRef<GachaSimulatorPull | null>(null)
  const history = shallowRef<GachaDrawResult[]>([])
  const spent = shallowRef<ReadonlyMap<string, number>>(new Map())
  const drawCount = ref(0)
  const batchCount = ref(0)
  let seen = new Set<number>()
  let rng: GachaRng = mulberry32(randomSeed())

  function reset() {
    lastBatch.value = []
    lastPull.value = null
    history.value = []
    spent.value = new Map()
    drawCount.value = 0
    batchCount.value = 0
    seen = new Set()
    rng = mulberry32(randomSeed())
  }

  function commit(results: GachaDrawResult[], pull: GachaSimulatorPull) {
    if (results.length === 0) {
      return
    }
    const batch = results.map((result, index): GachaSimulatorDraw => {
      const isNew = !seen.has(result.cardId)
      seen.add(result.cardId)
      return { ...result, key: index, isNew }
    })
    lastBatch.value = batch
    lastPull.value = pull
    history.value = [...history.value, ...results]
    spent.value = addSimulatorCost(spent.value, pull)
    drawCount.value += results.length
    batchCount.value += 1
  }

  function pullSingle() {
    const current = model.value
    if (!current || current.buckets.length === 0) {
      return
    }
    const pull = { ...(current.single ?? FREE_SINGLE), spinCount: 1 }
    commit(drawBatch(current, pull, rng), pull)
  }

  function pullTen() {
    const current = model.value
    if (!current || current.buckets.length === 0) {
      return
    }
    const pull = current.ten ?? { ...FREE_SINGLE, spinCount: 10 }
    commit(drawTen(current, rng), { ...pull, spinCount: 10 })
  }

  watch(model, () => {
    reset()
  })

  return {
    lastBatch,
    lastPull,
    tally: computed(() => tallyDrawResults(history.value)),
    drawCount,
    batchCount,
    spent,
    hasPulled: computed(() => batchCount.value > 0),
    canPull: computed(() => (model.value?.buckets.length ?? 0) > 0),
    pullSingle,
    pullTen,
    reset,
  }
}
