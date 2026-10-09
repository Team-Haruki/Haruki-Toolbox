import {
  MUSIC_SCORE_RANKS,
  addMusicRewardTotals,
  emptyMusicRewardTotals,
  type MusicAchievementMaster,
  type MusicRewardTotals,
  type MusicScoreRank,
} from "./music-rewards"

export type MusicScoreRankSongInput = {
  musicId: number
  title: string
  assetbundleName: string
}

export type MusicScoreRankStep = {
  rank: MusicScoreRank
  /** At or below the song's current rank. */
  reached: boolean
  /** Reward of this rank's achievement(s). */
  rewards: MusicRewardTotals
}

export type MusicScoreRankSong = MusicScoreRankSongInput & {
  /** One step per rank the master defines, lowest first. */
  steps: MusicScoreRankStep[]
  /** Highest rank recorded in the snapshot; null when none is. */
  currentRank: MusicScoreRank | null
  /** The rank after `currentRank`; null once the song is maxed. */
  nextRank: MusicScoreRank | null
  /** Reward of `nextRank`; null once the song is maxed. */
  nextRewards: MusicRewardTotals | null
  /** Rewards of the ranks up to `currentRank`. */
  obtained: MusicRewardTotals
  /** Rewards of the ranks above `currentRank`. */
  remaining: MusicRewardTotals
  /** `currentRank` is the top rank. */
  complete: boolean
}

/** "none" for songs without any recorded rank, else the current rank. */
export type MusicScoreRankBucket = "none" | MusicScoreRank

export type MusicScoreRankSummary = {
  songs: number
  complete: number
  obtained: MusicRewardTotals
  remaining: MusicRewardTotals
  /** Songs per current rank. */
  byRank: Record<MusicScoreRankBucket, number>
}

export type MusicScoreRankProgress = {
  /** Ranks the master defines, lowest first (normally C, B, A, S). */
  ranks: MusicScoreRank[]
  /** In input order; sort with `sortMusicScoreRankSongs`. */
  songs: MusicScoreRankSong[]
  summary: MusicScoreRankSummary
}

const RANK_ORDER: Record<MusicScoreRank, number> = { C: 0, B: 1, A: 2, S: 3 }

/** Position in the C → S progression; -1 for none. */
export function musicScoreRankOrder(rank: MusicScoreRank | null): number {
  return rank == null ? -1 : RANK_ORDER[rank]
}

/**
 * Per-song score-rank progress. Score rank is progressive (C → B → A → S),
 * so a song has one current rank: the highest `score_rank` achievement the
 * snapshot records for it. Reaching a rank implies the ranks below, so a
 * record with a gap (S without C) still counts as S with everything below
 * obtained. Remaining rewards are those of the ranks above the current one.
 *
 * `achievements` may contain every achievement type; only `score_rank`
 * rows with a known rank value count. Returns null when the master defines
 * no score rank, so a region without the table renders nothing.
 */
export function buildMusicScoreRankProgress(
  songs: readonly MusicScoreRankSongInput[],
  achievements: readonly MusicAchievementMaster[],
  claimed: ReadonlyMap<number, ReadonlySet<number>>,
): MusicScoreRankProgress | null {
  const mastersByRank = new Map<MusicScoreRank, MusicAchievementMaster[]>()
  for (const master of achievements) {
    if (master.type !== "score_rank" || master.scoreRank == null) {
      continue
    }
    const list = mastersByRank.get(master.scoreRank) ?? []
    list.push(master)
    mastersByRank.set(master.scoreRank, list)
  }
  const ranks = MUSIC_SCORE_RANKS.filter((rank) => mastersByRank.has(rank))
  if (ranks.length === 0) {
    return null
  }

  const rewardsByRank = new Map<MusicScoreRank, MusicRewardTotals>()
  for (const rank of ranks) {
    const rewards = emptyMusicRewardTotals()
    for (const master of mastersByRank.get(rank) ?? []) {
      addMusicRewardTotals(rewards, master.rewards)
    }
    rewardsByRank.set(rank, rewards)
  }

  const summary: MusicScoreRankSummary = {
    songs: 0,
    complete: 0,
    obtained: emptyMusicRewardTotals(),
    remaining: emptyMusicRewardTotals(),
    byRank: { none: 0, C: 0, B: 0, A: 0, S: 0 },
  }
  const seen = new Set<number>()
  const result: MusicScoreRankSong[] = []
  for (const song of songs) {
    if (seen.has(song.musicId)) {
      continue
    }
    seen.add(song.musicId)

    const claimedSet = claimed.get(song.musicId)
    let currentRank: MusicScoreRank | null = null
    for (const rank of ranks) {
      if ((mastersByRank.get(rank) ?? []).some((master) => claimedSet?.has(master.id) === true)) {
        currentRank = rank
      }
    }

    const currentOrder = musicScoreRankOrder(currentRank)
    const obtained = emptyMusicRewardTotals()
    const remaining = emptyMusicRewardTotals()
    let nextRank: MusicScoreRank | null = null
    const steps = ranks.map((rank): MusicScoreRankStep => {
      const rewards = rewardsByRank.get(rank) ?? emptyMusicRewardTotals()
      const reached = RANK_ORDER[rank] <= currentOrder
      addMusicRewardTotals(reached ? obtained : remaining, rewards)
      if (!reached && nextRank == null) {
        nextRank = rank
      }
      return { rank, reached, rewards }
    })

    const complete = nextRank == null
    result.push({
      musicId: song.musicId,
      title: song.title,
      assetbundleName: song.assetbundleName,
      steps,
      currentRank,
      nextRank,
      nextRewards: nextRank == null ? null : (rewardsByRank.get(nextRank) ?? null),
      obtained,
      remaining,
      complete,
    })

    summary.songs += 1
    summary.byRank[currentRank ?? "none"] += 1
    if (complete) {
      summary.complete += 1
    }
    addMusicRewardTotals(summary.obtained, obtained)
    addMusicRewardTotals(summary.remaining, remaining)
  }

  return { ranks, songs: result, summary }
}

export const MUSIC_SCORE_RANK_FILTERS = ["all", "remaining", "none", ...MUSIC_SCORE_RANKS] as const

export type MusicScoreRankFilter = (typeof MUSIC_SCORE_RANK_FILTERS)[number]

export function isMusicScoreRankFilter(value: string): value is MusicScoreRankFilter {
  return (MUSIC_SCORE_RANK_FILTERS as readonly string[]).includes(value)
}

export const MUSIC_SCORE_RANK_SORTS = ["remaining", "music", "rank"] as const

export type MusicScoreRankSort = (typeof MUSIC_SCORE_RANK_SORTS)[number]

export function isMusicScoreRankSort(value: string): value is MusicScoreRankSort {
  return (MUSIC_SCORE_RANK_SORTS as readonly string[]).includes(value)
}

export function filterMusicScoreRankSongs<T extends Pick<MusicScoreRankSong, "complete" | "currentRank">>(
  songs: readonly T[],
  filter: MusicScoreRankFilter,
): T[] {
  switch (filter) {
    case "all":
      return [...songs]
    case "remaining":
      return songs.filter((song) => !song.complete)
    case "none":
      return songs.filter((song) => song.currentRank == null)
    default:
      return songs.filter((song) => song.currentRank === filter)
  }
}

/** Most crystals left first (then coins, shards), ties by music id. */
export function compareMusicScoreRankRemaining(
  left: Pick<MusicScoreRankSong, "musicId" | "remaining">,
  right: Pick<MusicScoreRankSong, "musicId" | "remaining">,
): number {
  return right.remaining.jewel - left.remaining.jewel
    || right.remaining.coin - left.remaining.coin
    || right.remaining.shard - left.remaining.shard
    || left.musicId - right.musicId
}

/** Lowest current rank first (none, C, B, A, S), ties by music id. */
export function compareMusicScoreRankCurrent(
  left: Pick<MusicScoreRankSong, "musicId" | "currentRank">,
  right: Pick<MusicScoreRankSong, "musicId" | "currentRank">,
): number {
  return musicScoreRankOrder(left.currentRank) - musicScoreRankOrder(right.currentRank)
    || left.musicId - right.musicId
}

export function sortMusicScoreRankSongs<T extends Pick<MusicScoreRankSong, "musicId" | "remaining" | "currentRank">>(
  songs: readonly T[],
  sort: MusicScoreRankSort,
): T[] {
  const sorted = [...songs]
  if (sort === "remaining") {
    sorted.sort(compareMusicScoreRankRemaining)
  } else if (sort === "rank") {
    sorted.sort(compareMusicScoreRankCurrent)
  } else {
    sorted.sort((left, right) => left.musicId - right.musicId)
  }
  return sorted
}
