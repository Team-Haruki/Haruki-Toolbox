/**
 * Union of every training tab's master-file set.
 *
 * The training section prefetches these as soon as its layout mounts so that
 * switching between tabs does not pay a cold master-data fetch each time — the
 * per-page `ensureRegionData` calls then resolve straight from the (coverage-
 * based) cache. `ensureRegionData` dedupes/merges in-flight requests, so the
 * first tab's own subset fetch coalesces with this prefetch rather than
 * duplicating it.
 *
 * Keep in sync with the per-page `TRAINING_*_MASTER_FILES` constants. Being a
 * superset is harmless: any file missing here simply falls back to the page's
 * own on-demand load, i.e. today's behaviour.
 */
export const TRAINING_PREFETCH_MASTER_FILES = [
  "areaItems",
  "areaItemLevels",
  "shopItems",
  "resourceBoxes",
  "resourceBoxDetails",
  "gameCharacters",
  "gameCharacterUnits",
  "bonds",
  "bondsRewards",
  "levels",
  "materials",
  "characterMissionV2s",
  "characterMissionV2ParameterGroups",
  "challengeLiveHighScoreRewards",
  "challengeLiveStages",
  "characterRanks",
  "mysekaiGateLevels",
] as const
