import {
  appendCatalogRecords,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  pushCatalogGroup,
} from "@/shared/sekai/catalog"
import type { RankBorderMasterHonor, RankBorderMasterHonorGroup } from "@/modules/rank-border/lib/master-data-types"

/**
 * Ranking-reward resolution:
 *
 *   events[].eventRankingRewardRanges[].eventRankingRewards[].resourceBoxId
 *     → resourceBoxes (purpose `event_ranking_reward`)
 *         jp/en: `details[]` embedded in the box record
 *         tw/kr/cn: flat `resourceBoxDetails` rows keyed by `resourceBoxId`
 *       → honors (resourceType `honor`, `resourceId` = honor id)
 *           event honors (`honor_top_*`) draw on `honorGroups.backgroundAssetbundleName`
 *       → generic resources (jewel, coin, material, tickets…) as type + quantity
 */

export const EVENT_RANKING_REWARD_PURPOSE = "event_ranking_reward"

/**
 * One `events[].eventRankingRewardRanges` row. Nuverse dumps (tw/kr/cn) omit
 * `id`, `eventId` and `isToRankBorder`; only the rank span and the reward
 * box ids are guaranteed.
 */
export type EventRankingRewardRange = {
  fromRank: number
  toRank: number
  isToRankBorder: boolean
  /** `resourceBoxes` ids (purpose `event_ranking_reward`) in reward order. */
  resourceBoxIds: number[]
}

export type EventRewardHonor = {
  id: number
  name: string
  assetbundleName: string
  honorRarity: string | null
  /** Event honors: the group background the rank plate is drawn on. */
  backgroundAssetbundleName: string | null
  /** The master rows the badge renderer composes from (`buildHonorView`). */
  master: RankBorderMasterHonor
  group: RankBorderMasterHonorGroup | null
}

export type EventRewardResource = {
  resourceType: string
  resourceId: number | null
  resourceLevel: number | null
  quantity: number
}

export type EventRewardsIndex = {
  honors: Map<number, EventRewardHonor>
  /** resourceBoxId → contents, restricted to event ranking reward boxes. */
  boxes: Map<number, EventRewardResource[]>
  /** False when the region ships neither box file (cn): contents are unknown. */
  hasBoxData: boolean
}

export type EventRankingReward =
  | { kind: "honor"; key: string; honor: EventRewardHonor; level: number | null; quantity: number }
  | { kind: "resource"; key: string; resourceType: string; resourceId: number | null; quantity: number }

export type EventRankingRewardRow = EventRankingRewardRange & {
  rewards: EventRankingReward[]
}

export function normalizeEventRankingRewardRanges(value: unknown): EventRankingRewardRange[] {
  const ranges: EventRankingRewardRange[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const fromRank = normalizeCatalogNumber(record.fromRank)
    const toRank = normalizeCatalogNumber(record.toRank)
    if (fromRank == null || toRank == null || fromRank <= 0 || toRank < fromRank) {
      continue
    }
    const resourceBoxIds: number[] = []
    for (const reward of normalizeCatalogRecords(record.eventRankingRewards)) {
      const boxId = normalizeCatalogNumber(reward.resourceBoxId)
      if (boxId != null && boxId > 0 && !resourceBoxIds.includes(boxId)) {
        resourceBoxIds.push(boxId)
      }
    }
    ranges.push({
      fromRank,
      toRank,
      isToRankBorder: record.isToRankBorder === true,
      resourceBoxIds,
    })
  }
  return ranges.sort((a, b) => a.fromRank - b.fromRank || a.toRank - b.toRank)
}

function normalizeRewardResource(record: Record<string, unknown>): EventRewardResource | null {
  const resourceType = normalizeCatalogString(record.resourceType)
  if (!resourceType) {
    return null
  }
  return {
    resourceType,
    resourceId: normalizeCatalogNumber(record.resourceId),
    resourceLevel: normalizeCatalogNumber(record.resourceLevel),
    quantity: normalizeCatalogNumber(record.resourceQuantity) ?? 1,
  }
}

function buildHonorGroups(rawGroups: unknown): Map<number, RankBorderMasterHonorGroup> {
  const groups = new Map<number, RankBorderMasterHonorGroup>()
  for (const record of normalizeCatalogRecords(rawGroups)) {
    const id = normalizeCatalogNumber(record.id)
    if (id != null) {
      groups.set(id, record as RankBorderMasterHonorGroup)
    }
  }
  return groups
}

function buildHonors(rawHonors: unknown, groups: ReadonlyMap<number, RankBorderMasterHonorGroup>): Map<number, EventRewardHonor> {
  const honors = new Map<number, EventRewardHonor>()
  for (const record of normalizeCatalogRecords(rawHonors)) {
    const id = normalizeCatalogNumber(record.id)
    const assetbundleName = normalizeCatalogString(record.assetbundleName)
    if (id == null || !assetbundleName) {
      continue
    }
    const groupId = normalizeCatalogNumber(record.groupId)
    const group = groupId != null ? groups.get(groupId) ?? null : null
    honors.set(id, {
      id,
      name: normalizeCatalogString(record.name) || `#${id}`,
      assetbundleName,
      honorRarity: normalizeCatalogString(record.honorRarity) || null,
      backgroundAssetbundleName: normalizeCatalogString(group?.backgroundAssetbundleName) || null,
      master: record as RankBorderMasterHonor,
      group,
    })
  }
  return honors
}

function isRankingRewardBox(record: Record<string, unknown>): boolean {
  return normalizeCatalogString(record.resourceBoxPurpose) === EVENT_RANKING_REWARD_PURPOSE
}

/** jp/en: details embedded in the box record. */
function collectEmbeddedBoxResources(boxes: Map<number, EventRewardResource[]>, rawBoxes: unknown) {
  for (const record of normalizeCatalogRecords(rawBoxes)) {
    const boxId = normalizeCatalogNumber(record.id)
    if (!isRankingRewardBox(record) || boxId == null) {
      continue
    }
    for (const detail of normalizeCatalogRecords(record.details)) {
      const resource = normalizeRewardResource(detail)
      if (resource) {
        pushCatalogGroup(boxes, boxId, resource)
      }
    }
  }
}

/** tw/kr/cn: one flat table with 100k+ rows; append instead of spreading. */
function collectFlatBoxResources(boxes: Map<number, EventRewardResource[]>, rawDetails: unknown) {
  const detailRows: Record<string, unknown>[] = []
  appendCatalogRecords(detailRows, rawDetails)
  for (const record of detailRows) {
    const boxId = normalizeCatalogNumber(record.resourceBoxId)
    if (!isRankingRewardBox(record) || boxId == null) {
      continue
    }
    const resource = normalizeRewardResource(record)
    if (resource) {
      pushCatalogGroup(boxes, boxId, resource)
    }
  }
}

export function buildEventRewardsIndex(files: Record<string, unknown>): EventRewardsIndex {
  const honors = buildHonors(files.honors, buildHonorGroups(files.honorGroups))
  const boxes = new Map<number, EventRewardResource[]>()
  collectEmbeddedBoxResources(boxes, files.resourceBoxes)
  collectFlatBoxResources(boxes, files.resourceBoxDetails)
  return { honors, boxes, hasBoxData: boxes.size > 0 }
}

export function resolveEventRankingRewards(
  ranges: readonly EventRankingRewardRange[],
  index: EventRewardsIndex,
): EventRankingRewardRow[] {
  return ranges.map((range) => {
    const rewards: EventRankingReward[] = []
    for (const boxId of range.resourceBoxIds) {
      const contents = index.boxes.get(boxId) ?? []
      contents.forEach((resource, position) => {
        const key = `${boxId}:${position}`
        if (resource.resourceType === "honor" && resource.resourceId != null) {
          const honor = index.honors.get(resource.resourceId)
          if (honor) {
            rewards.push({ kind: "honor", key, honor, level: resource.resourceLevel, quantity: resource.quantity })
            return
          }
        }
        rewards.push({
          kind: "resource",
          key,
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          quantity: resource.quantity,
        })
      })
    }
    return { ...range, rewards }
  })
}
