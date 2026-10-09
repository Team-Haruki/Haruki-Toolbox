import { describe, expect, it } from "bun:test"
import { buildClaimedMusicAchievementMap, normalizeMusicAchievementMasters } from "./music-rewards"
import {
  buildMusicScoreRankProgress,
  compareMusicScoreRankRemaining,
  filterMusicScoreRankSongs,
  sortMusicScoreRankSongs,
} from "./music-score-rank"

// The jp/cn master: four score ranks (ids 1-4) plus per-difficulty combos.
const rawMusicAchievements = [
  { id: 1, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_C", resourceBoxId: 1 },
  { id: 2, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_B", resourceBoxId: 2 },
  { id: 3, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_A", resourceBoxId: 3 },
  { id: 4, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_S", resourceBoxId: 4 },
  { id: 21, musicAchievementType: "combo", musicDifficultyType: "master", musicAchievementTypeValue: "1", resourceBoxId: 21 },
]

const flatDetails = [
  { resourceBoxId: 1, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 10 },
  { resourceBoxId: 2, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 10 },
  { resourceBoxId: 3, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 20 },
  { resourceBoxId: 4, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 50 },
  { resourceBoxId: 21, resourceBoxPurpose: "music_achievement", resourceType: "coin", resourceQuantity: 3000 },
]

const masters = normalizeMusicAchievementMasters(rawMusicAchievements, [], flatDetails)

const songs = [
  { musicId: 1, title: "Tell Your World", assetbundleName: "jacket_s_001" },
  { musicId: 2, title: "Bitter Choco Decoration", assetbundleName: "jacket_s_002" },
  { musicId: 3, title: "Never played", assetbundleName: "jacket_s_003" },
]

const claimed = buildClaimedMusicAchievementMap([
  // Song 1: every rank, plus a combo that must not count as a score rank.
  { musicId: 1, musicAchievementId: 1 },
  { musicId: 1, musicAchievementId: 2 },
  { musicId: 1, musicAchievementId: 3 },
  { musicId: 1, musicAchievementId: 4 },
  { musicId: 1, musicAchievementId: 21 },
  // Song 2: C and B only.
  { musicId: 2, musicAchievementId: 1 },
  { musicId: 2, musicAchievementId: 2 },
  // A song the master does not know; ignored.
  { musicId: 999, musicAchievementId: 4 },
])

describe("buildMusicScoreRankProgress", () => {
  const progress = buildMusicScoreRankProgress(songs, masters, claimed)!

  it("lists the ranks the master defines, lowest first", () => {
    expect(progress.ranks).toEqual(["C", "B", "A", "S"])
  })

  it("marks reached ranks and the crystals still obtainable per song", () => {
    const [full, partial, none] = progress.songs

    expect(full.ranks.map((state) => state.reached)).toEqual([true, true, true, true])
    expect(full.highestRank).toBe("S")
    expect(full.obtained).toEqual({ jewel: 90, coin: 0, shard: 0 })
    expect(full.remaining).toEqual({ jewel: 0, coin: 0, shard: 0 })
    expect(full.complete).toBe(true)

    expect(partial.ranks.map((state) => state.reached)).toEqual([true, true, false, false])
    expect(partial.highestRank).toBe("B")
    expect(partial.obtained).toEqual({ jewel: 20, coin: 0, shard: 0 })
    expect(partial.remaining).toEqual({ jewel: 70, coin: 0, shard: 0 })
    expect(partial.complete).toBe(false)

    expect(none.ranks.map((state) => state.reached)).toEqual([false, false, false, false])
    expect(none.highestRank).toBeNull()
    expect(none.remaining).toEqual({ jewel: 90, coin: 0, shard: 0 })
  })

  it("carries each rank's own reward for the badges", () => {
    expect(progress.songs[1].ranks.map((state) => state.rewards.jewel)).toEqual([10, 10, 20, 50])
  })

  it("summarises obtained vs remaining over the released songs", () => {
    expect(progress.summary).toEqual({
      songs: 3,
      complete: 1,
      obtained: { jewel: 110, coin: 0, shard: 0 },
      remaining: { jewel: 160, coin: 0, shard: 0 },
    })
  })

  it("keeps a song listed once even when it is passed per difficulty", () => {
    const duplicated = buildMusicScoreRankProgress([...songs, songs[0]], masters, claimed)!
    expect(duplicated.songs).toHaveLength(3)
    expect(duplicated.summary.songs).toBe(3)
  })

  it("returns null when the master has no score-rank achievements", () => {
    const combosOnly = masters.filter((master) => master.type === "combo")
    expect(buildMusicScoreRankProgress(songs, combosOnly, claimed)).toBeNull()
    expect(buildMusicScoreRankProgress(songs, [], claimed)).toBeNull()
  })

  it("counts unknown rank values in the totals without showing a badge", () => {
    const withUnknown = normalizeMusicAchievementMasters(
      [...rawMusicAchievements, { id: 5, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_SS", resourceBoxId: 5 }],
      [],
      [...flatDetails, { resourceBoxId: 5, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 100 }],
    )
    const result = buildMusicScoreRankProgress(songs, withUnknown, claimed)!
    expect(result.ranks).toEqual(["C", "B", "A", "S"])
    expect(result.songs[0].ranks).toHaveLength(4)
    expect(result.songs[0].remaining.jewel).toBe(100)
    expect(result.songs[0].complete).toBe(false)
  })

  it("treats a song without any claim record as nothing reached", () => {
    const result = buildMusicScoreRankProgress(songs, masters, new Map())!
    expect(result.songs.every((song) => song.highestRank === null)).toBe(true)
    expect(result.summary.obtained.jewel).toBe(0)
    expect(result.summary.remaining.jewel).toBe(270)
  })
})

describe("filter and sort", () => {
  const progress = buildMusicScoreRankProgress(songs, masters, claimed)!

  it("filters to songs with something left", () => {
    expect(filterMusicScoreRankSongs(progress.songs, "remaining").map((song) => song.musicId)).toEqual([2, 3])
    expect(filterMusicScoreRankSongs(progress.songs, "all")).toHaveLength(3)
  })

  it("sorts by remaining crystals, then by music id", () => {
    expect(sortMusicScoreRankSongs(progress.songs, "remaining").map((song) => song.musicId)).toEqual([3, 2, 1])
    expect(sortMusicScoreRankSongs([...progress.songs].reverse(), "music").map((song) => song.musicId)).toEqual([1, 2, 3])
  })

  it("breaks crystal ties by coins, shards, then id", () => {
    const base = { jewel: 0, coin: 0, shard: 0 }
    expect(compareMusicScoreRankRemaining({ musicId: 1, remaining: { ...base, coin: 5 } }, { musicId: 2, remaining: base })).toBeLessThan(0)
    expect(compareMusicScoreRankRemaining({ musicId: 1, remaining: base }, { musicId: 2, remaining: { ...base, shard: 1 } })).toBeGreaterThan(0)
    expect(compareMusicScoreRankRemaining({ musicId: 2, remaining: base }, { musicId: 1, remaining: base })).toBeGreaterThan(0)
  })
})
