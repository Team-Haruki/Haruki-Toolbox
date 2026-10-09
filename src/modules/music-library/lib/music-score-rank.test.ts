import { describe, expect, it } from "bun:test"
import { buildClaimedMusicAchievementMap, normalizeMusicAchievementMasters } from "./music-rewards"
import {
  buildMusicScoreRankProgress,
  compareMusicScoreRankCurrent,
  compareMusicScoreRankRemaining,
  filterMusicScoreRankSongs,
  musicScoreRankOrder,
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

const song = (musicId: number) => ({ musicId, title: `Song ${musicId}`, assetbundleName: `jacket_s_${musicId}` })

function jewels(amount: number) {
  return { jewel: amount, coin: 0, shard: 0 }
}

describe("buildMusicScoreRankProgress", () => {
  it("lists the ranks the master defines, lowest first", () => {
    expect(buildMusicScoreRankProgress([song(1)], masters, new Map())!.ranks).toEqual(["C", "B", "A", "S"])
  })

  it("treats a song without any recorded rank as none, with everything remaining", () => {
    const [result] = buildMusicScoreRankProgress([song(1)], masters, new Map())!.songs
    expect(result.currentRank).toBeNull()
    expect(result.nextRank).toBe("C")
    expect(result.steps.map((step) => step.reached)).toEqual([false, false, false, false])
    expect(result.obtained).toEqual(jewels(0))
    expect(result.remaining).toEqual(jewels(90))
    expect(result.complete).toBe(false)
  })

  const singleRank = [
    { rank: "C", ids: [1], obtained: 10, remaining: 80, next: "B" },
    { rank: "B", ids: [1, 2], obtained: 20, remaining: 70, next: "A" },
    { rank: "A", ids: [1, 2, 3], obtained: 40, remaining: 50, next: "S" },
    { rank: "S", ids: [1, 2, 3, 4], obtained: 90, remaining: 0, next: null },
  ] as const

  for (const expected of singleRank) {
    it(`reports rank ${expected.rank} as the current rank`, () => {
      const claimed = buildClaimedMusicAchievementMap(expected.ids.map((id) => ({ musicId: 1, musicAchievementId: id })))
      const [result] = buildMusicScoreRankProgress([song(1)], masters, claimed)!.songs
      expect(result.currentRank).toBe(expected.rank)
      expect(result.nextRank).toBe(expected.next)
      expect(result.obtained).toEqual(jewels(expected.obtained))
      expect(result.remaining).toEqual(jewels(expected.remaining))
      expect(result.complete).toBe(expected.next === null)
      expect(result.steps.filter((step) => step.reached).map((step) => step.rank)).toEqual(expected.ids.map((id) => (["C", "B", "A", "S"] as const)[id - 1]))
    })
  }

  it("implies the lower ranks when the record has a gap (S without C)", () => {
    const claimed = buildClaimedMusicAchievementMap([{ musicId: 1, musicAchievementId: 4 }])
    const [result] = buildMusicScoreRankProgress([song(1)], masters, claimed)!.songs
    expect(result.currentRank).toBe("S")
    expect(result.steps.map((step) => step.reached)).toEqual([true, true, true, true])
    expect(result.obtained).toEqual(jewels(90))
    expect(result.remaining).toEqual(jewels(0))
    expect(result.complete).toBe(true)
  })

  it("uses the highest recorded rank when the gap is in the middle (A without B)", () => {
    const claimed = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 1 },
      { musicId: 1, musicAchievementId: 3 },
    ])
    const [result] = buildMusicScoreRankProgress([song(1)], masters, claimed)!.songs
    expect(result.currentRank).toBe("A")
    expect(result.remaining).toEqual(jewels(50))
  })

  it("merges achievements recorded from different live modes into one song state", () => {
    // The suite rows carry no mode, but a dump that did must not split the song.
    const claimed = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 1, playType: "solo" },
      { musicId: 1, musicAchievementId: 2, playType: "multi" },
      { musicId: 1, musicAchievementId: 3, liveType: "cheerful_carnival" },
    ])
    const [result] = buildMusicScoreRankProgress([song(1)], masters, claimed)!.songs
    expect(result.currentRank).toBe("A")
    expect(result.obtained).toEqual(jewels(40))
    expect(result.remaining).toEqual(jewels(50))
  })

  it("ignores combo achievements and achievements of unknown songs", () => {
    const claimed = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 21 },
      { musicId: 999, musicAchievementId: 4 },
    ])
    const progress = buildMusicScoreRankProgress([song(1)], masters, claimed)!
    expect(progress.songs[0].currentRank).toBeNull()
    expect(progress.summary.songs).toBe(1)
  })

  it("carries each rank's own reward for the stepper tooltips", () => {
    const [result] = buildMusicScoreRankProgress([song(1)], masters, new Map())!.songs
    expect(result.steps.map((step) => step.rewards.jewel)).toEqual([10, 10, 20, 50])
  })

  it("summarises obtained, remaining and songs per current rank", () => {
    const claimed = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 4 },
      { musicId: 2, musicAchievementId: 1 },
      { musicId: 2, musicAchievementId: 2 },
    ])
    const { summary } = buildMusicScoreRankProgress([song(1), song(2), song(3)], masters, claimed)!
    expect(summary).toEqual({
      songs: 3,
      complete: 1,
      obtained: jewels(110),
      remaining: jewels(160),
      byRank: { none: 1, C: 0, B: 1, A: 0, S: 1 },
    })
  })

  it("keeps a song listed once even when it is passed per difficulty", () => {
    const progress = buildMusicScoreRankProgress([song(1), song(2), song(1)], masters, new Map())!
    expect(progress.songs).toHaveLength(2)
    expect(progress.summary.songs).toBe(2)
  })

  it("returns null when the master has no score-rank achievements", () => {
    const combosOnly = masters.filter((master) => master.type === "combo")
    expect(buildMusicScoreRankProgress([song(1)], combosOnly, new Map())).toBeNull()
    expect(buildMusicScoreRankProgress([song(1)], [], new Map())).toBeNull()
  })

  it("ignores score-rank rows with an unknown rank value", () => {
    const withUnknown = normalizeMusicAchievementMasters(
      [...rawMusicAchievements, { id: 5, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_SS", resourceBoxId: 5 }],
      [],
      [...flatDetails, { resourceBoxId: 5, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceQuantity: 100 }],
    )
    const claimed = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 4 },
      { musicId: 1, musicAchievementId: 5 },
    ])
    const progress = buildMusicScoreRankProgress([song(1)], withUnknown, claimed)!
    expect(progress.ranks).toEqual(["C", "B", "A", "S"])
    expect(progress.songs[0].steps).toHaveLength(4)
    expect(progress.songs[0].currentRank).toBe("S")
    expect(progress.songs[0].obtained).toEqual(jewels(90))
    expect(progress.songs[0].remaining).toEqual(jewels(0))
    expect(progress.songs[0].complete).toBe(true)

    const onlyUnknown = normalizeMusicAchievementMasters(
      [{ id: 5, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_SS", resourceBoxId: 5 }],
      [],
      flatDetails,
    )
    expect(buildMusicScoreRankProgress([song(1)], onlyUnknown, claimed)).toBeNull()
  })
})

describe("filter and sort", () => {
  const claimed = buildClaimedMusicAchievementMap([
    { musicId: 1, musicAchievementId: 4 },
    { musicId: 2, musicAchievementId: 1 },
    { musicId: 2, musicAchievementId: 2 },
    { musicId: 4, musicAchievementId: 1 },
  ])
  // 1: S (maxed), 2: B, 3: none, 4: C
  const progress = buildMusicScoreRankProgress([song(1), song(2), song(3), song(4)], masters, claimed)!
  const ids = (songs: readonly { musicId: number }[]) => songs.map((entry) => entry.musicId)

  it("filters to songs with something left, or by current rank", () => {
    expect(ids(filterMusicScoreRankSongs(progress.songs, "all"))).toEqual([1, 2, 3, 4])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "remaining"))).toEqual([2, 3, 4])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "none"))).toEqual([3])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "C"))).toEqual([4])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "B"))).toEqual([2])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "A"))).toEqual([])
    expect(ids(filterMusicScoreRankSongs(progress.songs, "S"))).toEqual([1])
  })

  it("sorts by remaining crystals, song order, or current rank", () => {
    expect(ids(sortMusicScoreRankSongs(progress.songs, "remaining"))).toEqual([3, 4, 2, 1])
    expect(ids(sortMusicScoreRankSongs([...progress.songs].reverse(), "music"))).toEqual([1, 2, 3, 4])
    expect(ids(sortMusicScoreRankSongs(progress.songs, "rank"))).toEqual([3, 4, 2, 1])
  })

  it("orders ranks none < C < B < A < S", () => {
    expect([null, "C", "B", "A", "S"].map((rank) => musicScoreRankOrder(rank as never))).toEqual([-1, 0, 1, 2, 3])
    expect(compareMusicScoreRankCurrent({ musicId: 9, currentRank: "A" }, { musicId: 1, currentRank: "S" })).toBeLessThan(0)
    expect(compareMusicScoreRankCurrent({ musicId: 2, currentRank: "C" }, { musicId: 1, currentRank: "C" })).toBeGreaterThan(0)
  })

  it("breaks crystal ties by coins, shards, then id", () => {
    const base = jewels(0)
    expect(compareMusicScoreRankRemaining({ musicId: 1, remaining: { ...base, coin: 5 } }, { musicId: 2, remaining: base })).toBeLessThan(0)
    expect(compareMusicScoreRankRemaining({ musicId: 1, remaining: base }, { musicId: 2, remaining: { ...base, shard: 1 } })).toBeGreaterThan(0)
    expect(compareMusicScoreRankRemaining({ musicId: 2, remaining: base }, { musicId: 1, remaining: base })).toBeGreaterThan(0)
  })
})
