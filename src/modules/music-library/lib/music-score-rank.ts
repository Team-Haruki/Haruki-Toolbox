import {
  MUSIC_SCORE_RANKS,
  addMusicRewardTotals,
  emptyMusicRewardTotals,
  hasMusicRewardTotals,
  type MusicAchievementMaster,
  type MusicRewardTotals,
  type MusicScoreRank,
} from "./music-rewards"

export type MusicScoreRankSongInput = {
  musicId: number
  title: string
  assetbundleName: string
}

export type MusicScoreRankState = {
  rank: MusicScoreRank
  /** The rank's achievement is recorded in the snapshot (`userMusicAchievements`). */
  reached: boolean
  /** Reward of this rank's achievement(s). */
  rewards: MusicRewardTotals
}

export type MusicScoreRankSong = MusicScoreRankSongInput & {
  /** One entry per rank present in the master, lowest rank first. */
  ranks: MusicScoreRankState[]
  /** Highest reached rank; null when none is reached. */
  highestRank: MusicScoreRank | null
  /** Rewards of the score-rank achievements already recorded for this song. */
  obtained: MusicRewardTotals
  /** Rewards of the score-rank achievements not yet recorded for this song. */
  remaining: MusicRewardTotals
  /** Nothing left to obtain from score ranks on this song. */
  complete: boolean
}

export type MusicScoreRankSummary = {
  songs: number
  complete: number
  obtained: MusicRewardTotals
  remaining: MusicRewardTotals
}

export type MusicScoreRankProgress = {
  /** Ranks the master defines, lowest first (normally C, B, A, S). */
  ranks: MusicScoreRank[]
  /** In input order; sort with `sortMusicScoreRankSongs`. */
  songs: MusicScoreRankSong[]
  summary: MusicScoreRankSummary
}

/**
 * Per-song score-rank (C/B/A/S) progress: which rank achievements the
 * snapshot records for each song and what their rewards still add up to.
 *
 * `achievements` may contain every achievement type; only `score_rank`
 * rows count. Rows whose value is not a known rank still contribute to the
 * obtained / remaining totals (so they agree with the page total) but get no
 * rank entry. Returns null when the master has no score-rank achievements at
 * all, so a region without the table renders nothing.
 */
export function buildMusicScoreRankProgress(
  songs: readonly MusicScoreRankSongInput[],
  achievements: readonly MusicAchievementMaster[],
  claimed: ReadonlyMap<number, ReadonlySet<number>>,
): MusicScoreRankProgress | null {
  const scoreRankMasters = achievements.filter((achievement) => achievement.type === "score_rank")
  if (scoreRankMasters.length === 0) {
    return null
  }

  const mastersByRank = new Map<MusicScoreRank, MusicAchievementMaster[]>()
  for (const master of scoreRankMasters) {
    if (master.scoreRank == null) {
      continue
    }
    const list = mastersByRank.get(master.scoreRank) ?? []
    list.push(master)
    mastersByRank.set(master.scoreRank, list)
  }
  const ranks = MUSIC_SCORE_RANKS.filter((rank) => mastersByRank.has(rank))

  const summary: MusicScoreRankSummary = {
    songs: 0,
    complete: 0,
    obtained: emptyMusicRewardTotals(),
    remaining: emptyMusicRewardTotals(),
  }
  const seen = new Set<number>()
  const result: MusicScoreRankSong[] = []
  for (const song of songs) {
    if (seen.has(song.musicId)) {
      continue
    }
    seen.add(song.musicId)

    const claimedSet = claimed.get(song.musicId)
    const obtained = emptyMusicRewardTotals()
    const remaining = emptyMusicRewardTotals()
    for (const master of scoreRankMasters) {
      addMusicRewardTotals(claimedSet?.has(master.id) ? obtained : remaining, master.rewards)
    }

    let highestRank: MusicScoreRank | null = null
    const states = ranks.map((rank): MusicScoreRankState => {
      const masters = mastersByRank.get(rank) ?? []
      const rewards = emptyMusicRewardTotals()
      for (const master of masters) {
        addMusicRewardTotals(rewards, master.rewards)
      }
      const reached = masters.every((master) => claimedSet?.has(master.id) === true)
      if (reached) {
        highestRank = rank
      }
      return { rank, reached, rewards }
    })

    const complete = !hasMusicRewardTotals(remaining)
    result.push({
      musicId: song.musicId,
      title: song.title,
      assetbundleName: song.assetbundleName,
      ranks: states,
      highestRank,
      obtained,
      remaining,
      complete,
    })

    summary.songs += 1
    if (complete) {
      summary.complete += 1
    }
    addMusicRewardTotals(summary.obtained, obtained)
    addMusicRewardTotals(summary.remaining, remaining)
  }

  return { ranks, songs: result, summary }
}

export const MUSIC_SCORE_RANK_FILTERS = ["all", "remaining"] as const

export type MusicScoreRankFilter = (typeof MUSIC_SCORE_RANK_FILTERS)[number]

export function isMusicScoreRankFilter(value: string): value is MusicScoreRankFilter {
  return (MUSIC_SCORE_RANK_FILTERS as readonly string[]).includes(value)
}

export const MUSIC_SCORE_RANK_SORTS = ["remaining", "music"] as const

export type MusicScoreRankSort = (typeof MUSIC_SCORE_RANK_SORTS)[number]

export function isMusicScoreRankSort(value: string): value is MusicScoreRankSort {
  return (MUSIC_SCORE_RANK_SORTS as readonly string[]).includes(value)
}

export function filterMusicScoreRankSongs<T extends Pick<MusicScoreRankSong, "complete">>(
  songs: readonly T[],
  filter: MusicScoreRankFilter,
): T[] {
  return filter === "remaining" ? songs.filter((song) => !song.complete) : [...songs]
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

export function sortMusicScoreRankSongs<T extends Pick<MusicScoreRankSong, "musicId" | "remaining">>(
  songs: readonly T[],
  sort: MusicScoreRankSort,
): T[] {
  const sorted = [...songs]
  if (sort === "remaining") {
    sorted.sort(compareMusicScoreRankRemaining)
  } else {
    sorted.sort((left, right) => left.musicId - right.musicId)
  }
  return sorted
}
