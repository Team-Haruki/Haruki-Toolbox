import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/** Challenge live always renders the full character roster (IDs 1..26). */
export const CHALLENGE_CHARACTER_COUNT = 26

/** Resource box purpose used by challenge live high score rewards. */
export const CHALLENGE_RESOURCE_BOX_PURPOSE = "challenge_live_high_score"

/** Material resource id of the "crystal shard" reward. */
export const CHALLENGE_SHARD_MATERIAL_ID = 15

export const CHALLENGE_SORT_MODES = ["character", "score"] as const

export type ChallengeSortMode = (typeof CHALLENGE_SORT_MODES)[number]

/** Row from the `challengeLiveHighScoreRewards` masterdata file. */
export type ChallengeRewardMaster = {
  id: number
  characterId: number
  highScore: number
  resourceBoxId: number
}

/** Aggregated reward content of one challenge-live resource box. */
export type ChallengeBoxReward = {
  jewel: number
  shard: number
}

export type ChallengeCell = {
  characterId: number
  highScore: number
  /** Highest stage rank reached; 0 when the character has no stage data. */
  stage: number
  hasData: boolean
  unclaimedJewel: number
  unclaimedShard: number
}

export type ChallengeSummary = {
  top: ChallengeCell | null
  withDataCount: number
}

/** Tolerantly parses the `challengeLiveHighScoreRewards` masterdata list. */
export function normalizeChallengeRewardMasters(raw: unknown): ChallengeRewardMaster[] {
  const rewards: ChallengeRewardMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const id = normalizeCatalogNumber(record.id)
    const characterId = normalizeCatalogNumber(record.characterId)
    const resourceBoxId = normalizeCatalogNumber(record.resourceBoxId)
    if (id == null || characterId == null || resourceBoxId == null) {
      continue
    }

    rewards.push({
      id,
      characterId,
      highScore: normalizeCatalogNumber(record.highScore) ?? 0,
      resourceBoxId,
    })
  }

  return rewards
}

/**
 * Builds the jewel/shard content per resource box from the flat
 * `resourceBoxDetails` masterdata list (rows are not nested per box in this
 * dump): keeps only `challenge_live_high_score` rows, groups them by
 * `resourceBoxId`, and sums jewel quantities plus material-15 shard
 * quantities — mirroring `pickChallengeRewards` in the Go implementation.
 */
export function buildChallengeBoxRewardMap(rawDetails: unknown): Map<number, ChallengeBoxReward> {
  const map = new Map<number, ChallengeBoxReward>()
  for (const record of normalizeCatalogRecords(rawDetails)) {
    if (normalizeCatalogString(record.resourceBoxPurpose) !== CHALLENGE_RESOURCE_BOX_PURPOSE) {
      continue
    }

    const resourceBoxId = normalizeCatalogNumber(record.resourceBoxId)
    if (resourceBoxId == null) {
      continue
    }

    const quantity = normalizeCatalogNumber(record.resourceQuantity) ?? 0
    const resourceType = normalizeCatalogString(record.resourceType).toLowerCase()

    let entry = map.get(resourceBoxId)
    if (entry == null) {
      entry = { jewel: 0, shard: 0 }
      map.set(resourceBoxId, entry)
    }

    if (resourceType === "jewel") {
      entry.jewel += quantity
    } else if (resourceType === "material" && normalizeCatalogNumber(record.resourceId) === CHALLENGE_SHARD_MATERIAL_ID) {
      entry.shard += quantity
    }
  }

  return map
}

/** Collects claimed reward ids from `userChallengeLiveSoloHighScoreRewards`. */
export function collectClaimedChallengeRewardIds(raw: unknown): Set<number> {
  const claimed = new Set<number>()
  for (const record of normalizeCatalogRecords(raw)) {
    const rewardId = normalizeCatalogNumber(record.challengeLiveHighScoreRewardId)
    if (rewardId != null) {
      claimed.add(rewardId)
    }
  }

  return claimed
}

export type BuildChallengeGridInput = {
  /** Suite `userChallengeLiveSoloResults`. */
  results: unknown
  /** Suite `userChallengeLiveSoloStages`. */
  stages: unknown
  rewardMasters: readonly ChallengeRewardMaster[]
  boxRewards: ReadonlyMap<number, ChallengeBoxReward>
  claimedRewardIds: ReadonlySet<number>
}

/**
 * Ports `BuildChallengeLiveDetailsRequest`: always 26 cells (zeros when the
 * character has no data), high score from results, stage = max stage rank,
 * and unclaimed jewel/shard totals from the not-yet-claimed reward rows.
 */
export function buildChallengeGrid(input: BuildChallengeGridInput): ChallengeCell[] {
  const scoreByCharacter = new Map<number, number>()
  for (const record of normalizeCatalogRecords(input.results)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (characterId == null) {
      continue
    }
    scoreByCharacter.set(characterId, normalizeCatalogNumber(record.highScore) ?? 0)
  }

  const rankByCharacter = new Map<number, number>()
  for (const record of normalizeCatalogRecords(input.stages)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    const rank = normalizeCatalogNumber(record.rank) ?? 0
    if (characterId == null) {
      continue
    }
    if (rank > (rankByCharacter.get(characterId) ?? 0)) {
      rankByCharacter.set(characterId, rank)
    }
  }

  const rewardsByCharacter = new Map<number, ChallengeRewardMaster[]>()
  for (const reward of input.rewardMasters) {
    const list = rewardsByCharacter.get(reward.characterId)
    if (list == null) {
      rewardsByCharacter.set(reward.characterId, [reward])
    } else {
      list.push(reward)
    }
  }

  const cells: ChallengeCell[] = []
  for (let characterId = 1; characterId <= CHALLENGE_CHARACTER_COUNT; characterId += 1) {
    let unclaimedJewel = 0
    let unclaimedShard = 0
    for (const reward of rewardsByCharacter.get(characterId) ?? []) {
      if (input.claimedRewardIds.has(reward.id)) {
        continue
      }
      const box = input.boxRewards.get(reward.resourceBoxId)
      if (box == null) {
        continue
      }
      unclaimedJewel += box.jewel
      unclaimedShard += box.shard
    }

    const highScore = scoreByCharacter.get(characterId) ?? 0
    const stage = rankByCharacter.get(characterId) ?? 0
    cells.push({
      characterId,
      highScore,
      stage,
      hasData: highScore > 0 || stage > 0,
      unclaimedJewel,
      unclaimedShard,
    })
  }

  return cells
}

/**
 * Ports `estimateChallengeMaxScore`: the highest reward threshold across
 * characters 1..26, floored at 3,000,000 for the JP server and 2,500,000
 * otherwise.
 */
export function estimateChallengeMaxScore(
  rewardMasters: readonly ChallengeRewardMaster[],
  region: string | null,
): number {
  let maxScore = 0
  for (const reward of rewardMasters) {
    if (reward.characterId < 1 || reward.characterId > CHALLENGE_CHARACTER_COUNT) {
      continue
    }
    if (reward.highScore > maxScore) {
      maxScore = reward.highScore
    }
  }

  const minScore = region === "jp" ? 3_000_000 : 2_500_000
  return maxScore < minScore ? minScore : maxScore
}

/**
 * Display maximum for the score progress bar: the estimated masterdata max
 * raised to the actual player max when the player exceeds every threshold.
 */
export function resolveChallengeDisplayMax(
  rewardMasters: readonly ChallengeRewardMaster[],
  cells: readonly ChallengeCell[],
  region: string | null,
): number {
  let displayMax = estimateChallengeMaxScore(rewardMasters, region)
  for (const cell of cells) {
    if (cell.highScore > displayMax) {
      displayMax = cell.highScore
    }
  }

  return displayMax
}

/** Sorts cells by character id (default) or high score descending. */
export function sortChallengeCells(
  cells: readonly ChallengeCell[],
  mode: ChallengeSortMode,
): ChallengeCell[] {
  const sorted = [...cells]
  if (mode === "score") {
    sorted.sort((a, b) => b.highScore - a.highScore || a.characterId - b.characterId)
  } else {
    sorted.sort((a, b) => a.characterId - b.characterId)
  }

  return sorted
}

/** Header summary: best-scoring character plus how many characters have data. */
export function summarizeChallengeCells(cells: readonly ChallengeCell[]): ChallengeSummary {
  let top: ChallengeCell | null = null
  let withDataCount = 0
  for (const cell of cells) {
    if (cell.hasData) {
      withDataCount += 1
    }
    if (cell.highScore > 0 && (top == null || cell.highScore > top.highScore)) {
      top = cell
    }
  }

  return { top, withDataCount }
}
