import { markRaw } from "vue"
import { readSekaiMasterFile, readSekaiMasterFiles, writeSekaiMasterFiles } from "@/shared/sekai/cache"
import type { SekaiRegion } from "@/types"

/**
 * The master tables the deck page itself needs: card pickers, override
 * lists, result rendering and user-data preparation. The engine's full set
 * (~50 MB of JSON) stays inside the workers; the page only ever holds these.
 */
export const DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES = [
  "cards",
  "cardEpisodes",
  "cardRarities",
  "characterRanks",
  "areaItemLevels",
  "areaItems",
  "areas",
  "gameCharacters",
  "gameCharacterUnits",
  "unitProfiles",
  "mysekaiGates",
  "mysekaiGateLevels",
  "eventTotalPowerLimits",
  "eventCardBonusLimits",
  "eventSkillScoreUpLimits",
] as const

/**
 * cards.json is 35 MB for jp and 94% of it is `cardParameters` (per-level
 * stat rows) that only the engine reads. The page keeps a lite copy without
 * those rows, derived once per master version and cached next to the full
 * file so later visits never deserialize the full table again.
 */
export const DECK_RECOMMEND_CARD_LITE_DROPPED_FIELDS = [
  "cardParameters",
  "specialTrainingCosts",
  "masterLessonAchieveResources",
] as const

const CARDS_LITE_FILE = "cards__lite"

export function stripCardParameters(cards: unknown): unknown {
  if (!Array.isArray(cards)) {
    return cards
  }
  return cards.map((card) => {
    if (card === null || typeof card !== "object" || Array.isArray(card)) {
      return card
    }
    const lite: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(card as Record<string, unknown>)) {
      if (!(DECK_RECOMMEND_CARD_LITE_DROPPED_FIELDS as readonly string[]).includes(key)) {
        lite[key] = value
      }
    }
    return lite
  })
}

type CacheSlot = {
  key: string
  data: Record<string, unknown>
}

let cached: CacheSlot | null = null
const inflight = new Map<string, Promise<Record<string, unknown>>>()

function cacheKey(region: SekaiRegion, masterVersion: string): string {
  return `${region}:${masterVersion}`
}

/**
 * Reads the page-side tables for a region, one copy per master version.
 * The result is non-reactive (`markRaw`): it feeds pure builders and would
 * otherwise cost a proxy per card on first access.
 */
export function readDeckRecommendMainThreadMaster(
  region: SekaiRegion,
  masterVersion: string,
): Promise<Record<string, unknown>> {
  const key = cacheKey(region, masterVersion)
  if (cached?.key === key) {
    return Promise.resolve(cached.data)
  }

  let pending = inflight.get(key)
  if (!pending) {
    pending = loadMainThreadMaster(region, masterVersion)
      .then((data) => {
        cached = { key, data }
        return data
      })
      .finally(() => {
        inflight.delete(key)
      })
    inflight.set(key, pending)
  }
  return pending
}

export function peekDeckRecommendMainThreadMaster(region: SekaiRegion, masterVersion: string): Record<string, unknown> | null {
  return cached?.key === cacheKey(region, masterVersion) ? cached.data : null
}

/** Test seam. */
export function resetDeckRecommendMainThreadMasterCache(): void {
  cached = null
  inflight.clear()
}

async function loadMainThreadMaster(region: SekaiRegion, masterVersion: string): Promise<Record<string, unknown>> {
  const otherFiles = DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES.filter((fileName) => fileName !== "cards")
  const [tables, cards] = await Promise.all([
    readSekaiMasterFiles(region, otherFiles, masterVersion),
    readLiteCards(region, masterVersion),
  ])
  if (cards != null) {
    tables.cards = cards
  }
  return markRaw(tables)
}

async function readLiteCards(region: SekaiRegion, masterVersion: string): Promise<unknown> {
  const lite = await readSekaiMasterFile(region, CARDS_LITE_FILE, masterVersion)
  if (lite != null) {
    return lite
  }

  const full = await readSekaiMasterFile(region, "cards", masterVersion)
  if (full == null) {
    return null
  }
  const stripped = stripCardParameters(full)
  // Persist the lite copy for the next visit; a failure here only costs
  // another strip next time.
  void writeSekaiMasterFiles(region, masterVersion, { [CARDS_LITE_FILE]: stripped }).catch(() => undefined)
  return stripped
}
