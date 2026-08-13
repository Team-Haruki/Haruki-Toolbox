import { describe, expect, it } from "bun:test"
import {
  aggregateMusicResultFlags,
  buildMusicProgress,
  resolveMusicProgressStatus,
} from "./music-progress"

const NOW = 1_700_000_000_000

const RAW_MUSICS = [
  { id: 1, title: "Tell Your World", assetbundleName: "jacket_s_001", releasedAt: NOW - 1000, publishedAt: NOW - 2000 },
  { id: 2, title: "Bitter Choco Decoration", assetbundleName: "jacket_s_002", releasedAt: NOW - 1000 },
  // Not yet released on this server: excluded from every total.
  { id: 3, title: "Future Song", assetbundleName: "jacket_s_003", releasedAt: NOW + 1000 },
  // No releasedAt: falls back to publishedAt.
  { id: 4, title: "Legacy Song", assetbundleName: "jacket_s_004", publishedAt: NOW - 1000 },
  { title: "broken record without id" },
]

const RAW_DIFFICULTIES = [
  { id: 1, musicId: 1, musicDifficulty: "master", playLevel: 26 },
  // Append exists only for music 1 (most songs have no append chart).
  { id: 2, musicId: 1, musicDifficulty: "append", playLevel: 27 },
  { id: 3, musicId: 2, musicDifficulty: "master", playLevel: 26 },
  { id: 4, musicId: 3, musicDifficulty: "master", playLevel: 30 },
  { id: 5, musicId: 4, musicDifficulty: "master", playLevel: 24 },
]

describe("aggregateMusicResultFlags", () => {
  it("merges multiple results per (music, difficulty) across play types", () => {
    const flags = aggregateMusicResultFlags([
      { musicId: 1, musicDifficultyType: "master", playType: "solo", playResult: "clear", fullComboFlg: false, fullPerfectFlg: false },
      { musicId: 1, musicDifficultyType: "master", playType: "multi", playResult: "not_clear", fullComboFlg: true, fullPerfectFlg: false },
    ])

    expect(flags.get(1)?.master).toEqual({ cleared: true, fullCombo: true, allPerfect: false })
  })

  it("treats full perfect as full combo and cleared", () => {
    const flags = aggregateMusicResultFlags([
      { musicId: 2, musicDifficultyType: "expert", playType: "multi", playResult: "full_perfect", fullComboFlg: false, fullPerfectFlg: true },
    ])

    expect(flags.get(2)?.expert).toEqual({ cleared: true, fullCombo: true, allPerfect: true })
  })

  it("keeps difficulties independent and ignores malformed rows", () => {
    const flags = aggregateMusicResultFlags([
      { musicId: 1, musicDifficultyType: "easy", playResult: "clear", fullComboFlg: false, fullPerfectFlg: false },
      { musicId: 1, musicDifficultyType: "not_a_difficulty", playResult: "clear" },
      { musicDifficultyType: "master", playResult: "clear" },
      "junk",
    ])

    expect(flags.get(1)?.easy?.cleared).toBe(true)
    expect(flags.get(1)?.master).toBeUndefined()
    expect(flags.size).toBe(1)
  })

  it("returns an empty map for non-array input", () => {
    expect(aggregateMusicResultFlags(undefined).size).toBe(0)
    expect(aggregateMusicResultFlags(null).size).toBe(0)
  })
})

describe("resolveMusicProgressStatus", () => {
  it("maps flags to the strongest status", () => {
    expect(resolveMusicProgressStatus(undefined)).toBe("unplayed")
    expect(resolveMusicProgressStatus({ cleared: false, fullCombo: false, allPerfect: false })).toBe("unplayed")
    expect(resolveMusicProgressStatus({ cleared: true, fullCombo: false, allPerfect: false })).toBe("clear")
    expect(resolveMusicProgressStatus({ cleared: true, fullCombo: true, allPerfect: false })).toBe("fullCombo")
    expect(resolveMusicProgressStatus({ cleared: true, fullCombo: true, allPerfect: true })).toBe("allPerfect")
  })
})

describe("buildMusicProgress", () => {
  it("merges multiple results per song and computes cumulative summaries", () => {
    const progress = buildMusicProgress({
      rawMusics: RAW_MUSICS,
      rawMusicDifficulties: RAW_DIFFICULTIES,
      rawUserMusicResults: [
        { musicId: 1, musicDifficultyType: "master", playType: "solo", playResult: "clear", fullComboFlg: false, fullPerfectFlg: false },
        { musicId: 1, musicDifficultyType: "master", playType: "multi", playResult: "full_perfect", fullComboFlg: true, fullPerfectFlg: true },
        { musicId: 2, musicDifficultyType: "master", playType: "multi", playResult: "full_combo", fullComboFlg: true, fullPerfectFlg: false },
      ],
      now: NOW,
    })

    const master = progress.master
    // Music 3 is unreleased; musics 1, 2, 4 count.
    expect(master.summary).toEqual({ total: 3, cleared: 2, fullCombo: 2, allPerfect: 1 })

    const level26 = master.levels.find((row) => row.playLevel === 26)
    expect(level26).toBeDefined()
    expect(level26?.total).toBe(2)
    expect(level26?.allPerfect).toBe(1)
    expect(level26?.fullComboOnly).toBe(1)
    expect(level26?.clearOnly).toBe(0)
    expect(level26?.unplayed).toBe(0)
    expect(level26?.songs.map((song) => song.status)).toEqual(["allPerfect", "fullCombo"])

    const level24 = master.levels.find((row) => row.playLevel === 24)
    expect(level24?.unplayed).toBe(1)
  })

  it("counts append only for songs that have an append chart in masterdata", () => {
    const progress = buildMusicProgress({
      rawMusics: RAW_MUSICS,
      rawMusicDifficulties: RAW_DIFFICULTIES,
      rawUserMusicResults: [
        // Result reported for a difficulty that does not exist in masterdata.
        { musicId: 2, musicDifficultyType: "append", playType: "multi", playResult: "clear", fullComboFlg: false, fullPerfectFlg: false },
      ],
      now: NOW,
    })

    expect(progress.append.summary).toEqual({ total: 1, cleared: 0, fullCombo: 0, allPerfect: 0 })
    expect(progress.append.levels).toHaveLength(1)
    expect(progress.append.levels[0]?.songs[0]?.musicId).toBe(1)
    expect(progress.append.levels[0]?.songs[0]?.status).toBe("unplayed")
  })

  it("ignores results for musics absent from masterdata", () => {
    const progress = buildMusicProgress({
      rawMusics: RAW_MUSICS,
      rawMusicDifficulties: RAW_DIFFICULTIES,
      rawUserMusicResults: [
        { musicId: 999, musicDifficultyType: "master", playType: "solo", playResult: "full_perfect", fullComboFlg: true, fullPerfectFlg: true },
      ],
      now: NOW,
    })

    expect(progress.master.summary).toEqual({ total: 3, cleared: 0, fullCombo: 0, allPerfect: 0 })
    const allSongIds = progress.master.levels.flatMap((row) => row.songs.map((song) => song.musicId))
    expect(allSongIds).not.toContain(999)
  })

  it("handles empty results with all songs unplayed", () => {
    const progress = buildMusicProgress({
      rawMusics: RAW_MUSICS,
      rawMusicDifficulties: RAW_DIFFICULTIES,
      rawUserMusicResults: [],
      now: NOW,
    })

    expect(progress.master.summary).toEqual({ total: 3, cleared: 0, fullCombo: 0, allPerfect: 0 })
    expect(progress.easy.summary.total).toBe(0)
    expect(progress.easy.levels).toHaveLength(0)
    for (const row of progress.master.levels) {
      expect(row.unplayed).toBe(row.total)
    }
  })

  it("sorts level rows descending by play level", () => {
    const progress = buildMusicProgress({
      rawMusics: RAW_MUSICS,
      rawMusicDifficulties: RAW_DIFFICULTIES,
      rawUserMusicResults: [],
      now: NOW,
    })

    expect(progress.master.levels.map((row) => row.playLevel)).toEqual([26, 24])
  })

  it("excludes musics without any release timestamp", () => {
    const progress = buildMusicProgress({
      rawMusics: [{ id: 5, title: "No dates", assetbundleName: "jacket_s_005" }],
      rawMusicDifficulties: [{ id: 9, musicId: 5, musicDifficulty: "master", playLevel: 20 }],
      rawUserMusicResults: [],
      now: NOW,
    })

    expect(progress.master.summary.total).toBe(0)
  })
})
