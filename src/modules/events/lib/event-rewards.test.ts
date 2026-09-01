import { describe, expect, test } from "bun:test"
import {
  buildEventRewardsIndex,
  normalizeEventRankingRewardRanges,
  resolveEventRankingRewards,
} from "./event-rewards"

// jp/en shape: ids and flags present, details embedded in the box.
const JP_RANGES = [
  {
    id: 6850,
    eventId: 215,
    fromRank: 2,
    toRank: 2,
    isToRankBorder: false,
    eventRankingRewards: [{ id: 6850, eventRankingRewardRangeId: 6850, seq: 1, resourceBoxId: 6850, rewardConditionType: "none" }],
  },
  {
    id: 6849,
    eventId: 215,
    fromRank: 1,
    toRank: 1,
    isToRankBorder: false,
    eventRankingRewards: [{ resourceBoxId: 6849 }, { resourceBoxId: 6849 }],
  },
  {
    id: 6863,
    eventId: 215,
    fromRank: 51,
    toRank: 100,
    isToRankBorder: true,
    eventRankingRewards: [{ resourceBoxId: 6863 }],
  },
  { fromRank: 10, toRank: 5, eventRankingRewards: [] },
  { fromRank: "x", toRank: 3 },
]

const HONORS = [
  { id: 8631, seq: 1, groupId: 674, honorRarity: "highest", name: "1位", assetbundleName: "honor_top_000001", levels: [] },
  { id: 8632, seq: 2, groupId: 674, honorRarity: "highest", name: "2位", assetbundleName: "honor_top_000002", levels: [] },
  { id: 657, seq: 3, groupId: 12, honorRarity: "high", name: "1位", assetbundleName: "honor_0657", levels: [] },
  { id: 999, name: "broken" },
]

const HONOR_GROUPS = [
  { id: 674, name: "Mix&Make Party Time!!", honorType: "event", backgroundAssetbundleName: "honor_bg_event_partytime" },
  { id: 12, name: "Old event", honorType: "event" },
]

const JP_BOXES = [
  {
    resourceBoxPurpose: "event_ranking_reward",
    id: 6849,
    resourceBoxType: "expand",
    details: [
      { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 6849, seq: 1, resourceType: "honor", resourceId: 8631, resourceLevel: 1, resourceQuantity: 1 },
      { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 6849, seq: 2, resourceType: "jewel", resourceQuantity: 3000 },
      { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 6849, seq: 3, resourceType: "material", resourceId: 205, resourceQuantity: 25 },
    ],
  },
  {
    resourceBoxPurpose: "event_ranking_reward",
    id: 6850,
    resourceBoxType: "expand",
    details: [
      { resourceBoxPurpose: "event_ranking_reward", resourceBoxId: 6850, seq: 1, resourceType: "honor", resourceId: 424242, resourceQuantity: 1 },
    ],
  },
  // Same id under another purpose must not collide with the event box.
  {
    resourceBoxPurpose: "shop_item",
    id: 6849,
    resourceBoxType: "expand",
    details: [{ resourceBoxPurpose: "shop_item", resourceBoxId: 6849, seq: 1, resourceType: "coin", resourceQuantity: 1 }],
  },
]

// tw/kr/cn shape: bare boxes plus a flat detail table.
const TW_BOXES = [
  { assetbundleName: null, resourceBoxPurpose: "event_ranking_reward", name: null, id: 5795, resourceBoxType: "expand" },
]
const TW_DETAILS = [
  { resourceBoxId: 5795, resourceQuantity: 3000, resourceId: null, resourceBoxPurpose: "event_ranking_reward", resourceLevel: null, resourceType: "jewel" },
  { resourceBoxId: 5795, resourceQuantity: 1, resourceId: 657, resourceBoxPurpose: "event_ranking_reward", resourceLevel: 1, resourceType: "honor" },
  { resourceBoxId: 5795, resourceQuantity: 9, resourceId: null, resourceBoxPurpose: "shop_item", resourceLevel: null, resourceType: "coin" },
]

describe("normalizeEventRankingRewardRanges", () => {
  test("keeps valid ranges sorted by rank and dedupes box ids", () => {
    const ranges = normalizeEventRankingRewardRanges(JP_RANGES)
    expect(ranges).toEqual([
      { fromRank: 1, toRank: 1, isToRankBorder: false, resourceBoxIds: [6849] },
      { fromRank: 2, toRank: 2, isToRankBorder: false, resourceBoxIds: [6850] },
      { fromRank: 51, toRank: 100, isToRankBorder: true, resourceBoxIds: [6863] },
    ])
  })

  test("tolerates the Nuverse shape without ids or border flags", () => {
    expect(normalizeEventRankingRewardRanges([{ fromRank: 1, toRank: 1, eventRankingRewards: [{ resourceBoxId: 5795, rewardConditionType: "none" }] }]))
      .toEqual([{ fromRank: 1, toRank: 1, isToRankBorder: false, resourceBoxIds: [5795] }])
    expect(normalizeEventRankingRewardRanges(undefined)).toEqual([])
  })
})

describe("buildEventRewardsIndex", () => {
  test("indexes honors with group backgrounds and embedded box details", () => {
    const index = buildEventRewardsIndex({ honors: HONORS, honorGroups: HONOR_GROUPS, resourceBoxes: JP_BOXES, resourceBoxDetails: [] })
    expect(index.hasBoxData).toBe(true)
    expect(index.honors.get(8631)).toEqual({
      id: 8631,
      name: "1位",
      assetbundleName: "honor_top_000001",
      honorRarity: "highest",
      backgroundAssetbundleName: "honor_bg_event_partytime",
    })
    expect(index.honors.get(657)?.backgroundAssetbundleName).toBeNull()
    expect(index.honors.has(999)).toBe(false)
    expect(index.boxes.get(6849)).toEqual([
      { resourceType: "honor", resourceId: 8631, resourceLevel: 1, quantity: 1 },
      { resourceType: "jewel", resourceId: null, resourceLevel: null, quantity: 3000 },
      { resourceType: "material", resourceId: 205, resourceLevel: null, quantity: 25 },
    ])
  })

  test("reads the flat detail table on Nuverse dumps, ignoring other purposes", () => {
    const index = buildEventRewardsIndex({ honors: HONORS, honorGroups: [], resourceBoxes: TW_BOXES, resourceBoxDetails: TW_DETAILS })
    expect(index.boxes.get(5795)).toEqual([
      { resourceType: "jewel", resourceId: null, resourceLevel: null, quantity: 3000 },
      { resourceType: "honor", resourceId: 657, resourceLevel: 1, quantity: 1 },
    ])
  })

  test("reports missing box data", () => {
    const index = buildEventRewardsIndex({ honors: HONORS, honorGroups: [], resourceBoxes: [], resourceBoxDetails: [] })
    expect(index.hasBoxData).toBe(false)
    expect(index.honors.size).toBe(3)
  })
})

describe("resolveEventRankingRewards", () => {
  const index = buildEventRewardsIndex({ honors: HONORS, honorGroups: HONOR_GROUPS, resourceBoxes: JP_BOXES, resourceBoxDetails: [] })
  const ranges = normalizeEventRankingRewardRanges(JP_RANGES)

  test("expands boxes into honor and resource rewards", () => {
    const rows = resolveEventRankingRewards(ranges, index)
    expect(rows[0].rewards).toEqual([
      { kind: "honor", key: "6849:0", honor: index.honors.get(8631)!, level: 1, quantity: 1 },
      { kind: "resource", key: "6849:1", resourceType: "jewel", resourceId: null, quantity: 3000 },
      { kind: "resource", key: "6849:2", resourceType: "material", resourceId: 205, quantity: 25 },
    ])
  })

  test("unknown honors degrade to a generic resource and unknown boxes to nothing", () => {
    const rows = resolveEventRankingRewards(ranges, index)
    expect(rows[1].rewards).toEqual([{ kind: "resource", key: "6850:0", resourceType: "honor", resourceId: 424242, quantity: 1 }])
    expect(rows[2].rewards).toEqual([])
    expect(rows[2].isToRankBorder).toBe(true)
  })
})
