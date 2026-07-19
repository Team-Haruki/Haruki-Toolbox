import { describe, expect, it } from "bun:test"
import {
  buildChallengeBoxRewardMap,
  buildChallengeGrid,
  collectClaimedChallengeRewardIds,
  estimateChallengeMaxScore,
  normalizeChallengeRewardMasters,
  resolveChallengeDisplayMax,
  sortChallengeCells,
  summarizeChallengeCells,
  type ChallengeCell,
} from "./challenge-live"

const rewardMasters = normalizeChallengeRewardMasters([
  { id: 1, characterId: 1, highScore: 100_000, resourceBoxId: 1 },
  { id: 2, characterId: 1, highScore: 200_000, resourceBoxId: 2 },
  { id: 3, characterId: 2, highScore: 100_000, resourceBoxId: 3 },
])

const boxDetails = [
  // Box 1: 100 jewels + 10 shards.
  { resourceBoxId: 1, resourceBoxPurpose: "challenge_live_high_score", resourceType: "jewel", resourceId: null, resourceQuantity: 100 },
  { resourceBoxId: 1, resourceBoxPurpose: "challenge_live_high_score", resourceType: "material", resourceId: 15, resourceQuantity: 10 },
  // Box 2: 150 jewels + a non-shard material that must be ignored.
  { resourceBoxId: 2, resourceBoxPurpose: "challenge_live_high_score", resourceType: "jewel", resourceId: null, resourceQuantity: 150 },
  { resourceBoxId: 2, resourceBoxPurpose: "challenge_live_high_score", resourceType: "material", resourceId: 3, resourceQuantity: 5 },
  // Box 3: shards only.
  { resourceBoxId: 3, resourceBoxPurpose: "challenge_live_high_score", resourceType: "material", resourceId: 15, resourceQuantity: 20 },
  // Other purposes must be filtered out even with a matching box id.
  { resourceBoxId: 1, resourceBoxPurpose: "shop_item", resourceType: "jewel", resourceId: null, resourceQuantity: 9999 },
]

describe("buildChallengeBoxRewardMap", () => {
  it("groups flat detail rows by box and sums jewels and material-15 shards", () => {
    const map = buildChallengeBoxRewardMap(boxDetails)
    expect(map.get(1)).toEqual({ jewel: 100, shard: 10 })
    expect(map.get(2)).toEqual({ jewel: 150, shard: 0 })
    expect(map.get(3)).toEqual({ jewel: 0, shard: 20 })
  })

  it("ignores rows with other purposes and malformed rows", () => {
    const map = buildChallengeBoxRewardMap([
      { resourceBoxId: 7, resourceBoxPurpose: "shop_item", resourceType: "jewel", resourceQuantity: 100 },
      { resourceBoxPurpose: "challenge_live_high_score", resourceType: "jewel", resourceQuantity: 100 },
      "garbage",
      null,
    ])
    expect(map.size).toBe(0)
  })
})

describe("collectClaimedChallengeRewardIds", () => {
  it("collects claimed reward ids", () => {
    const claimed = collectClaimedChallengeRewardIds([
      { characterId: 1, challengeLiveHighScoreRewardId: 1 },
      { characterId: 2, challengeLiveHighScoreRewardId: 3 },
      { characterId: 2 },
    ])
    expect([...claimed].sort((a, b) => a - b)).toEqual([1, 3])
  })
})

describe("buildChallengeGrid", () => {
  const boxRewards = buildChallengeBoxRewardMap(boxDetails)

  it("always renders 26 cells with zeros for absent characters", () => {
    const cells = buildChallengeGrid({
      results: [],
      stages: [],
      rewardMasters: [],
      boxRewards,
      claimedRewardIds: new Set(),
    })
    expect(cells).toHaveLength(26)
    expect(cells[0]).toEqual({
      characterId: 1,
      highScore: 0,
      stage: 0,
      hasData: false,
      unclaimedJewel: 0,
      unclaimedShard: 0,
    })
    expect(cells[25]?.characterId).toBe(26)
  })

  it("maps scores, keeps the max stage rank, and sums unclaimed rewards", () => {
    const cells = buildChallengeGrid({
      results: [{ characterId: 1, highScore: 1_016_569 }],
      stages: [
        { characterId: 1, rank: 1 },
        { characterId: 1, rank: 3 },
        { characterId: 1, rank: 2 },
      ],
      rewardMasters,
      boxRewards,
      claimedRewardIds: new Set([1]),
    })

    const first = cells[0]
    expect(first?.highScore).toBe(1_016_569)
    expect(first?.stage).toBe(3)
    expect(first?.hasData).toBe(true)
    // Reward 1 is claimed, so only box 2 counts for character 1.
    expect(first?.unclaimedJewel).toBe(150)
    expect(first?.unclaimedShard).toBe(0)

    const second = cells[1]
    expect(second?.hasData).toBe(false)
    expect(second?.unclaimedJewel).toBe(0)
    expect(second?.unclaimedShard).toBe(20)
  })

  it("counts every unclaimed reward when nothing is claimed", () => {
    const cells = buildChallengeGrid({
      results: [],
      stages: [],
      rewardMasters,
      boxRewards,
      claimedRewardIds: new Set(),
    })
    expect(cells[0]?.unclaimedJewel).toBe(250)
    expect(cells[0]?.unclaimedShard).toBe(10)
  })
})

describe("estimateChallengeMaxScore", () => {
  it("floors at 3,000,000 for jp and 2,500,000 otherwise", () => {
    expect(estimateChallengeMaxScore(rewardMasters, "jp")).toBe(3_000_000)
    expect(estimateChallengeMaxScore(rewardMasters, "kr")).toBe(2_500_000)
    expect(estimateChallengeMaxScore(rewardMasters, null)).toBe(2_500_000)
  })

  it("uses the highest reward threshold when above the floor", () => {
    const highRewards = normalizeChallengeRewardMasters([
      { id: 1, characterId: 1, highScore: 4_000_000, resourceBoxId: 1 },
      // Out-of-roster characters must not contribute.
      { id: 2, characterId: 30, highScore: 9_000_000, resourceBoxId: 2 },
    ])
    expect(estimateChallengeMaxScore(highRewards, "jp")).toBe(4_000_000)
  })
})

describe("resolveChallengeDisplayMax", () => {
  it("raises the display max to the player max when it exceeds thresholds", () => {
    const cells: ChallengeCell[] = [
      { characterId: 1, highScore: 3_500_000, stage: 4, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
    ]
    expect(resolveChallengeDisplayMax(rewardMasters, cells, "jp")).toBe(3_500_000)
    expect(resolveChallengeDisplayMax(rewardMasters, [], "jp")).toBe(3_000_000)
  })
})

describe("sortChallengeCells", () => {
  const cells: ChallengeCell[] = [
    { characterId: 1, highScore: 100, stage: 1, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
    { characterId: 2, highScore: 300, stage: 2, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
    { characterId: 3, highScore: 300, stage: 1, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
  ]

  it("sorts by character id by default", () => {
    expect(sortChallengeCells([...cells].reverse(), "character").map((cell) => cell.characterId)).toEqual([1, 2, 3])
  })

  it("sorts by score descending with character id as tiebreak", () => {
    expect(sortChallengeCells(cells, "score").map((cell) => cell.characterId)).toEqual([2, 3, 1])
  })
})

describe("summarizeChallengeCells", () => {
  it("reports the top scorer and the count of characters with data", () => {
    const summary = summarizeChallengeCells([
      { characterId: 1, highScore: 100, stage: 1, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
      { characterId: 2, highScore: 500, stage: 2, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
      { characterId: 3, highScore: 0, stage: 1, hasData: true, unclaimedJewel: 0, unclaimedShard: 0 },
      { characterId: 4, highScore: 0, stage: 0, hasData: false, unclaimedJewel: 0, unclaimedShard: 0 },
    ])
    expect(summary.top?.characterId).toBe(2)
    expect(summary.withDataCount).toBe(3)
  })

  it("returns a null top when nobody has a score", () => {
    const summary = summarizeChallengeCells([
      { characterId: 1, highScore: 0, stage: 0, hasData: false, unclaimedJewel: 0, unclaimedShard: 0 },
    ])
    expect(summary.top).toBeNull()
    expect(summary.withDataCount).toBe(0)
  })
})
