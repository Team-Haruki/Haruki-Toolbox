import {
  appendCatalogRecords,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import { normalizeMusicDifficulty, type MusicDifficulty } from "./music-difficulties"

/** Material id of the shard ("かけら") rewarded by append combo milestones. */
export const MUSIC_SHARD_MATERIAL_ID = 15

export type MusicRewardTotals = {
  jewel: number
  coin: number
  shard: number
}

/** Score ranks a song can reach, lowest first. */
export const MUSIC_SCORE_RANKS = ["C", "B", "A", "S"] as const

export type MusicScoreRank = (typeof MUSIC_SCORE_RANKS)[number]

/** "RANK_S" / "rank_s" / "S" -> "S"; null for anything else. */
export function normalizeMusicScoreRank(value: unknown): MusicScoreRank | null {
  const normalized = normalizeCatalogString(value).toUpperCase().replace(/^RANK_/, "")
  return (MUSIC_SCORE_RANKS as readonly string[]).includes(normalized)
    ? (normalized as MusicScoreRank)
    : null
}

export type MusicAchievementMaster = {
  id: number
  /** "score_rank" (per music) or "combo" (per music+difficulty). */
  type: string
  /** Raw `musicAchievementTypeValue` ("RANK_S", "0.25", ...). */
  value: string
  /** The rank of a "score_rank" achievement; null for other types or unknown values. */
  scoreRank: MusicScoreRank | null
  difficulty: MusicDifficulty | null
  rewards: MusicRewardTotals
}

export function emptyMusicRewardTotals(): MusicRewardTotals {
  return { jewel: 0, coin: 0, shard: 0 }
}

export function addMusicRewardTotals(target: MusicRewardTotals, source: MusicRewardTotals): void {
  target.jewel += source.jewel
  target.coin += source.coin
  target.shard += source.shard
}

export function hasMusicRewardTotals(totals: MusicRewardTotals): boolean {
  return totals.jewel > 0 || totals.coin > 0 || totals.shard > 0
}

function addMusicRewardRecord(
  totals: MusicRewardTotals,
  record: Record<string, unknown>,
): void {
  const resourceType = normalizeCatalogString(record.resourceType)
  const quantity = normalizeCatalogNumber(record.resourceQuantity) ?? 0
  if (resourceType === "jewel") {
    totals.jewel += quantity
  } else if (resourceType === "coin") {
    totals.coin += quantity
  } else if (
    resourceType === "material"
    && normalizeCatalogNumber(record.resourceId) === MUSIC_SHARD_MATERIAL_ID
  ) {
    totals.shard += quantity
  }
}

function buildMusicRewardTotalsByBox(
  rawResourceBoxes: unknown,
  rawResourceBoxDetails: unknown,
): Map<number, MusicRewardTotals> {
  const details: Record<string, unknown>[] = []
  for (const record of normalizeCatalogRecords(rawResourceBoxes)) {
    appendCatalogRecords(details, record.details)
  }
  appendCatalogRecords(details, rawResourceBoxDetails)

  const totalsByBox = new Map<number, MusicRewardTotals>()
  for (const record of details) {
    if (normalizeCatalogString(record.resourceBoxPurpose) !== "music_achievement") {
      continue
    }

    const boxId = normalizeCatalogNumber(record.resourceBoxId)
    if (boxId == null || boxId <= 0) {
      continue
    }

    const totals = totalsByBox.get(boxId) ?? emptyMusicRewardTotals()
    addMusicRewardRecord(totals, record)
    totalsByBox.set(boxId, totals)
  }
  return totalsByBox
}

function normalizeMusicAchievementRecord(
  record: Record<string, unknown>,
  totalsByBox: ReadonlyMap<number, MusicRewardTotals>,
): MusicAchievementMaster | null {
  const id = normalizeCatalogNumber(record.id)
  const type = normalizeCatalogString(record.musicAchievementType)
  if (id == null || id <= 0 || type === "") {
    return null
  }

  const boxId = normalizeCatalogNumber(record.resourceBoxId)
  const value = normalizeCatalogString(record.musicAchievementTypeValue)
  return {
    id,
    type,
    value,
    scoreRank: type === "score_rank" ? normalizeMusicScoreRank(value) : null,
    difficulty: normalizeMusicDifficulty(normalizeCatalogString(record.musicDifficultyType)),
    rewards: (boxId != null ? totalsByBox.get(boxId) : null) ?? emptyMusicRewardTotals(),
  }
}

/**
 * Resolves `musicAchievements` rows into typed masters with their rewards,
 * summed from the `music_achievement` resource boxes. Accepts the nested
 * `resourceBoxes` dump (jp/en) and merges the flat `resourceBoxDetails`
 * rows shipped by tw/kr/cn.
 */
export function normalizeMusicAchievementMasters(
  rawMusicAchievements: unknown,
  rawResourceBoxes: unknown,
  rawResourceBoxDetails?: unknown,
): MusicAchievementMaster[] {
  const totalsByBox = buildMusicRewardTotalsByBox(rawResourceBoxes, rawResourceBoxDetails)

  const masters: MusicAchievementMaster[] = []
  for (const record of normalizeCatalogRecords(rawMusicAchievements)) {
    const master = normalizeMusicAchievementRecord(record, totalsByBox)
    if (master) {
      masters.push(master)
    }
  }

  return masters
}

/**
 * musicId -> claimed musicAchievementIds from the suite `userMusicAchievements`.
 * Achievements are per song, not per live mode: a rank or combo reached in
 * any mode (solo, multi, ...) is the song's, so only the ids are read and any
 * mode or play-type field on a record is ignored.
 */
export function buildClaimedMusicAchievementMap(raw: unknown): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>()
  for (const record of normalizeCatalogRecords(raw)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const achievementId = normalizeCatalogNumber(record.musicAchievementId)
    if (musicId == null || musicId <= 0 || achievementId == null || achievementId <= 0) {
      continue
    }

    let set = map.get(musicId)
    if (!set) {
      set = new Set()
      map.set(musicId, set)
    }
    set.add(achievementId)
  }

  return map
}

/** Sums the unclaimed rewards of `achievements` across the given musics. */
export function sumRemainingMusicRewards(
  musicIds: readonly number[],
  achievements: readonly MusicAchievementMaster[],
  claimed: ReadonlyMap<number, ReadonlySet<number>>,
): MusicRewardTotals {
  const totals = emptyMusicRewardTotals()
  for (const musicId of musicIds) {
    const claimedSet = claimed.get(musicId)
    for (const achievement of achievements) {
      if (claimedSet?.has(achievement.id)) {
        continue
      }

      addMusicRewardTotals(totals, achievement.rewards)
    }
  }

  return totals
}
