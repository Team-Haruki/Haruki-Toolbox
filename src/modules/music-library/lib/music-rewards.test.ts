import { describe, expect, it } from "bun:test"
import {
  buildClaimedMusicAchievementMap,
  hasMusicRewardTotals,
  normalizeMusicAchievementMasters,
  sumRemainingMusicRewards,
} from "./music-rewards"

const rawMusicAchievements = [
  { id: 1, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_C", resourceBoxId: 1 },
  { id: 4, musicAchievementType: "score_rank", musicAchievementTypeValue: "RANK_S", resourceBoxId: 4 },
  { id: 21, musicAchievementType: "combo", musicDifficultyType: "master", musicAchievementTypeValue: "0.25", resourceBoxId: 21 },
  { id: 24, musicAchievementType: "combo", musicDifficultyType: "master", musicAchievementTypeValue: "1", resourceBoxId: 24 },
  { id: 28, musicAchievementType: "combo", musicDifficultyType: "append", musicAchievementTypeValue: "1", resourceBoxId: 28 },
]

const flatDetails = [
  { resourceBoxId: 1, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceId: null, resourceQuantity: 10 },
  { resourceBoxId: 4, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceId: null, resourceQuantity: 50 },
  { resourceBoxId: 21, resourceBoxPurpose: "music_achievement", resourceType: "coin", resourceId: null, resourceQuantity: 3000 },
  { resourceBoxId: 24, resourceBoxPurpose: "music_achievement", resourceType: "jewel", resourceId: null, resourceQuantity: 50 },
  { resourceBoxId: 28, resourceBoxPurpose: "music_achievement", resourceType: "material", resourceId: 15, resourceQuantity: 10 },
  // Non-shard materials and other purposes must be ignored.
  { resourceBoxId: 28, resourceBoxPurpose: "music_achievement", resourceType: "material", resourceId: 3, resourceQuantity: 99 },
  { resourceBoxId: 21, resourceBoxPurpose: "shop_item", resourceType: "coin", resourceId: null, resourceQuantity: 99999 },
]

describe("normalizeMusicAchievementMasters", () => {
  const masters = normalizeMusicAchievementMasters(rawMusicAchievements, [], flatDetails)

  it("types achievements and resolves their reward totals", () => {
    expect(masters).toHaveLength(5)
    const rankS = masters.find((master) => master.id === 4)!
    expect(rankS.type).toBe("score_rank")
    expect(rankS.difficulty).toBeNull()
    expect(rankS.rewards).toEqual({ jewel: 50, coin: 0, shard: 0 })

    const masterCombo = masters.find((master) => master.id === 21)!
    expect(masterCombo.difficulty).toBe("master")
    expect(masterCombo.rewards).toEqual({ jewel: 0, coin: 3000, shard: 0 })

    const appendFc = masters.find((master) => master.id === 28)!
    expect(appendFc.rewards).toEqual({ jewel: 0, coin: 0, shard: 10 })
  })

  it("flattens the nested resourceBoxes dump (jp/en)", () => {
    const nested = normalizeMusicAchievementMasters(rawMusicAchievements, [
      { id: 1, resourceBoxPurpose: "music_achievement", details: [flatDetails[0]] },
    ])
    expect(nested.find((master) => master.id === 1)?.rewards).toEqual({ jewel: 10, coin: 0, shard: 0 })
  })
})

describe("buildClaimedMusicAchievementMap", () => {
  it("groups claimed achievement ids by music", () => {
    const map = buildClaimedMusicAchievementMap([
      { musicId: 1, musicAchievementId: 1 },
      { musicId: 1, musicAchievementId: 4 },
      { musicId: 2, musicAchievementId: 21 },
      { musicId: 0, musicAchievementId: 1 },
      "junk",
    ])
    expect([...map.get(1)!].sort((a, b) => a - b)).toEqual([1, 4])
    expect(map.get(2)!.has(21)).toBe(true)
    expect(map.has(0)).toBe(false)
  })
})

describe("sumRemainingMusicRewards", () => {
  const masters = normalizeMusicAchievementMasters(rawMusicAchievements, [], flatDetails)
  const claimed = buildClaimedMusicAchievementMap([
    { musicId: 1, musicAchievementId: 21 },
    { musicId: 1, musicAchievementId: 24 },
  ])

  it("sums only unclaimed achievements per music", () => {
    const combos = masters.filter((master) => master.type === "combo" && master.difficulty === "master")
    // Music 1 claimed both master combos; music 2 claimed none.
    expect(sumRemainingMusicRewards([1, 2], combos, claimed)).toEqual({ jewel: 50, coin: 3000, shard: 0 })
    expect(sumRemainingMusicRewards([1], combos, claimed)).toEqual({ jewel: 0, coin: 0, shard: 0 })
  })

  it("hasMusicRewardTotals reflects emptiness", () => {
    expect(hasMusicRewardTotals({ jewel: 0, coin: 0, shard: 0 })).toBe(false)
    expect(hasMusicRewardTotals({ jewel: 1, coin: 0, shard: 0 })).toBe(true)
  })
})
