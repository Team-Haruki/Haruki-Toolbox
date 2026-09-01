import {
  resolveCardAttrRoundIconUrl,
  resolveCardFrameImageUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
  resolveSekaiGameAssetUrl,
  resolveTrainRankImageUrl,
} from "@/shared/sekai/data-sources"
import type { SekaiRegion } from "@/types"
import type {
  RankBorderMasterBondsHonor,
  RankBorderMasterBondsHonorWord,
  RankBorderMasterCard,
  RankBorderMasterGameCharacterUnit,
  RankBorderMasterHonor,
  RankBorderMasterHonorGroup,
} from "./master-data-types"
import {
  isRankBorderLatestResult,
  type RankBorderLatest,
  type RankBorderLine,
} from "./rank-border"
import { FC_AP_HONOR_IDS } from "./rank-border-constants"
import type {
  RankBorderHonorLevelStar,
  RankBorderHonorView,
} from "./rank-border-types"

/**
 * Pure honor / leader-card visual resolution.
 *
 * All lookups run against a caller-supplied context (master maps + region +
 * asset endpoint), so the results can be memoized into row view-models once
 * per data refresh instead of being recomputed in render functions.
 */
export interface HonorVisualContext {
  cardById: ReadonlyMap<number, RankBorderMasterCard>
  honorById: ReadonlyMap<number, RankBorderMasterHonor>
  honorGroupById: ReadonlyMap<number, RankBorderMasterHonorGroup>
  bondsHonorById: ReadonlyMap<number, RankBorderMasterBondsHonor>
  bondsHonorWordById: ReadonlyMap<number, RankBorderMasterBondsHonorWord>
  gameCharacterUnitById: ReadonlyMap<number, RankBorderMasterGameCharacterUnit>
  region: SekaiRegion
  assetEndpoint: string
  /** True when the tracker endpoint is the local mock (uses bundled card art). */
  localMockAssets: boolean
}

export type ProfileResult = RankBorderLatest | RankBorderLine | null

export type RankBorderLeaderVisual = {
  thumbnailUrl: string | null
  cardLabel: string | null
  frameUrl: string | null
  attrIconUrl: string | null
  rareIconUrl: string | null
  rareCount: number
  masterRankUrl: string | null
  masterRankLabel: string | null
  levelLabel: string | null
}

export function isLatestResult(result: ProfileResult): result is RankBorderLatest {
  return isRankBorderLatestResult(result)
}

export function resolveLeaderVisual(result: ProfileResult, ctx: HonorVisualContext): RankBorderLeaderVisual | null {
  if (!isLatestResult(result)) {
    return null
  }

  const rarity = leaderCardRarity(result, ctx)
  const rareCount = resolveRareCount(rarity)
  return {
    thumbnailUrl: leaderThumbnailUrl(result, ctx),
    cardLabel: leaderCardLabel(result, ctx),
    frameUrl: rarity ? resolveCardFrameImageUrl(rarity) : null,
    attrIconUrl: leaderAttrIconUrl(result, ctx),
    rareIconUrl: rarity
      ? rarity === "rarity_birthday"
        ? resolveRareBirthdayImageUrl()
        : resolveRareStarImageUrl(resolveCardDisplayAfterTraining(result, rarity))
      : null,
    rareCount,
    masterRankUrl: result.cardMasterRank != null && result.cardMasterRank > 0
      ? resolveTrainRankImageUrl(result.cardMasterRank)
      : null,
    masterRankLabel: result.cardMasterRank != null ? `MR${result.cardMasterRank}` : null,
    levelLabel: result.cardLevel != null ? `Lv.${result.cardLevel}` : null,
  }
}

function leaderThumbnailUrl(result: RankBorderLatest, ctx: HonorVisualContext) {
  if (!result.cardId) {
    return null
  }

  const card = ctx.cardById.get(result.cardId)
  const assetBundleName = normalizeTextValue(card?.assetbundleName)
  if (!assetBundleName) {
    return null
  }

  const trainedArt = resolveCardTrainedArt(result)
  if (ctx.localMockAssets) {
    return `/rank-border/card/${assetBundleName}${trainedArt ? "_after_training" : "_normal"}.png`
  }

  return resolveSekaiCardThumbnailUrl(ctx.region, assetBundleName, trainedArt, ctx.assetEndpoint)
}

function leaderAttrIconUrl(result: RankBorderLatest, ctx: HonorVisualContext) {
  if (!result.cardId) {
    return null
  }

  const card = ctx.cardById.get(result.cardId)
  const attr = normalizeTextValue(card?.attr)?.toLowerCase()
  return attr ? resolveCardAttrRoundIconUrl(attr) : null
}

function leaderCardRarity(result: RankBorderLatest, ctx: HonorVisualContext) {
  if (!result.cardId) {
    return null
  }

  return normalizeTextValue(ctx.cardById.get(result.cardId)?.cardRarityType)
}

function leaderCardLabel(result: RankBorderLatest, ctx: HonorVisualContext) {
  if (!result.cardId) {
    return null
  }

  return normalizeTextValue(ctx.cardById.get(result.cardId)?.prefix) ?? `#${result.cardId}`
}

function resolveRareCount(rarity: string | null) {
  if (!rarity) {
    return 0
  }

  if (rarity === "rarity_birthday") {
    return 1
  }

  const match = rarity.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function resolveCardTrainedArt(result: RankBorderLatest) {
  const defaultImage = normalizeTextValue(result.cardDefaultImage)?.toLowerCase() ?? ""
  if (["special_training", "after_training", "card_after_training", "trained"].includes(defaultImage)) {
    return true
  }

  if (["normal", "original", "before_training", "card_normal"].includes(defaultImage)) {
    return false
  }

  return normalizeTextValue(result.cardSpecialTrainingStatus)?.toLowerCase() === "done"
}

function resolveCardDisplayAfterTraining(result: RankBorderLatest, rarity: string | null) {
  if (rarity === "rarity_3" || rarity === "rarity_4") {
    return true
  }

  return resolveCardTrainedArt(result)
}

export function buildProfileHonorViews(
  result: ProfileResult,
  ctx: HonorVisualContext,
  limit = 3,
  keyScope = "profile",
): RankBorderHonorView[] {
  if (!isLatestResult(result)) {
    return []
  }

  return result.profileHonors
    .slice(0, limit)
    .map((honor, index) => {
      const honorId = honor.honorId ?? honor.honorId2
      const masterHonor = honorId ? ctx.honorById.get(honorId) ?? null : null
      const bondsHonor = honorId ? ctx.bondsHonorById.get(honorId) ?? null : null
      if (!masterHonor && bondsHonor) {
        return resolveBondsHonorView(honor, bondsHonor, honorId, index, keyScope, ctx)
      }

      const groupId = normalizePositiveNumber(masterHonor?.groupId ?? masterHonor?.groupID)
      const masterGroup = groupId ? ctx.honorGroupById.get(groupId) ?? null : null
      return {
        key: `${keyScope}:${honor.seq ?? index}:${honorId ?? "unknown"}`,
        label: normalizeTextValue(masterHonor?.name) ?? (honorId ? `#${honorId}` : "-"),
        ...resolveHonorVisual(
          masterHonor,
          masterGroup,
          honorId ?? null,
          honor.honorLevel,
          resolveFcApHonorCount(honorId ?? null, honor.honorCount),
          "sub",
          ctx,
        ),
        level: honor.honorLevel,
      }
    })
}

function resolveFcApHonorCount(honorId: number | null, count: number | null) {
  if (honorId == null || !FC_AP_HONOR_IDS.has(honorId)) {
    return null
  }

  return count
}

function resolveHonorVisual(
  honor: RankBorderMasterHonor | null,
  group: RankBorderMasterHonorGroup | null,
  honorId: number | null,
  level: number | null,
  count: number | null,
  mode: "main" | "sub",
  ctx: HonorVisualContext,
): Omit<RankBorderHonorView, "key" | "label" | "level"> {
  const levelVisual = resolveHonorLevelVisual(honor, level)
  const assetBundleName = normalizeTextValue(honor?.assetbundleName) ?? normalizeTextValue(levelVisual?.assetbundleName)
  const rarity = normalizeTextValue(honor?.honorRarity) ?? normalizeTextValue(levelVisual?.honorRarity)
  const backgroundAssetBundleName = resolveHonorBackgroundAssetName(group, assetBundleName)
  const groupType = honorId != null && FC_AP_HONOR_IDS.has(honorId)
    ? "fc_ap"
    : resolveHonorGroupType(group, backgroundAssetBundleName, assetBundleName)
  const resolvedRarity = rarity ?? resolveHonorRarityFromAssetName(assetBundleName)
  const baseUrl = resolveHonorBaseUrl(groupType, backgroundAssetBundleName, assetBundleName, mode, ctx)
  const rankUrl = assetBundleName && honorUsesRankLayer(groupType, assetBundleName)
    ? resolveHonorRankUrl(groupType, assetBundleName, mode, ctx)
    : null

  return {
    type: "normal",
    groupType,
    honorId,
    baseUrl,
    rankUrl: rankUrl && rankUrl !== baseUrl ? rankUrl : null,
    rankPlacement: resolveHonorRankPlacement(groupType, assetBundleName),
    frameUrl: resolveHonorFrameUrl(group, backgroundAssetBundleName, assetBundleName, resolvedRarity, mode, ctx),
    framePlacement: resolvedRarity === "low" ? "low" : "full",
    scrollUrl: assetBundleName && groupType === "fc_ap"
      ? resolveSekaiGameAssetUrl(ctx.region, `startapp/honor/${assetBundleName}/scroll.png`, ctx.assetEndpoint)
      : null,
    levelIconUrl: honorUsesLevelIconLayer(groupType)
      ? "/rank-border/honor/icon_degreeLv.png"
      : null,
    level6IconUrl: honorUsesLevelIconLayer(groupType)
      ? "/rank-border/honor/icon_degreeLv6.png"
      : null,
    fcApCount: assetBundleName && groupType === "fc_ap" && count != null
      ? String(count)
      : null,
    bondsLeftBgUrl: null,
    bondsRightBgUrl: null,
    bondsLeftIconUrl: null,
    bondsRightIconUrl: null,
  }
}

function resolveBondsHonorView(
  honor: RankBorderLatest["profileHonors"][number],
  bondsHonor: RankBorderMasterBondsHonor,
  honorId: number | null,
  index: number,
  keyScope: string,
  ctx: HonorVisualContext,
): RankBorderHonorView {
  const slots = resolveBondsHonorDisplaySlots(bondsHonor, honor.bondsHonorViewType, ctx)
  const rarity = normalizeTextValue(bondsHonor.honorRarity)
  const word = honor.bondsHonorWordId ? ctx.bondsHonorWordById.get(honor.bondsHonorWordId) ?? null : null
  return {
    key: `${keyScope}:${honor.seq ?? index}:bonds:${honorId ?? "unknown"}:${honor.bondsHonorViewType ?? ""}`,
    label: normalizeTextValue(word?.name) ?? normalizeTextValue(bondsHonor.name) ?? (honorId ? `#${honorId}` : "-"),
    type: "bonds",
    groupType: "bonds",
    honorId,
    baseUrl: null,
    rankUrl: null,
    rankPlacement: "event",
    frameUrl: rarity ? `/rank-border/honor/frame_degree_s_${honorRarityRank(rarity)}.png` : null,
    framePlacement: rarity === "low" ? "low" : "full",
    scrollUrl: null,
    levelIconUrl: "/rank-border/honor/icon_degreeLv.png",
    level6IconUrl: "/rank-border/honor/icon_degreeLv6.png",
    fcApCount: null,
    bondsLeftBgUrl: slots.leftCharacterId ? `/rank-border/honor/bonds/${slots.leftCharacterId}_sub.png` : null,
    bondsRightBgUrl: slots.rightCharacterId ? `/rank-border/honor/bonds/${slots.rightCharacterId}_sub.png` : null,
    bondsLeftIconUrl: slots.leftUnitId ? resolveBondsHonorCharacterUrl(slots.leftUnitId, ctx) : null,
    bondsRightIconUrl: slots.rightUnitId ? resolveBondsHonorCharacterUrl(slots.rightUnitId, ctx) : null,
    level: honor.honorLevel,
  }
}

function resolveBondsHonorDisplaySlots(
  bondsHonor: RankBorderMasterBondsHonor,
  viewType: string | null,
  ctx: HonorVisualContext,
) {
  let leftUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId1 ?? bondsHonor.gameCharacterUnitID1)
  let rightUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId2 ?? bondsHonor.gameCharacterUnitID2)
  const normalizedViewType = normalizeTextValue(viewType)?.toLowerCase() ?? ""
  if (bondsHonor.configurableUnitVirtualSinger && normalizedViewType.includes("unit_virtual_singer")) {
    const originalLeftUnitId = leftUnitId
    const originalRightUnitId = rightUnitId
    leftUnitId = resolveUnitVirtualSingerUnitId(originalLeftUnitId, originalRightUnitId, ctx)
    rightUnitId = resolveUnitVirtualSingerUnitId(originalRightUnitId, originalLeftUnitId, ctx)
  }

  if (normalizedViewType.startsWith("reverse")) {
    const originalLeftUnitId = leftUnitId
    leftUnitId = rightUnitId
    rightUnitId = originalLeftUnitId
  }

  return {
    leftUnitId,
    rightUnitId,
    leftCharacterId: resolveGameCharacterIdByUnitId(leftUnitId, ctx),
    rightCharacterId: resolveGameCharacterIdByUnitId(rightUnitId, ctx),
  }
}

function resolveUnitVirtualSingerUnitId(
  candidateUnitId: number | null,
  pairedUnitId: number | null,
  ctx: HonorVisualContext,
) {
  if (!candidateUnitId) {
    return candidateUnitId
  }

  const candidate = ctx.gameCharacterUnitById.get(candidateUnitId)
  const candidateCharacterId = normalizePositiveNumber(candidate?.gameCharacterId ?? candidate?.gameCharacterID)
  if (!candidate || !candidateCharacterId || candidateCharacterId < 21 || !pairedUnitId) {
    return candidateUnitId
  }

  const paired = ctx.gameCharacterUnitById.get(pairedUnitId)
  const pairedUnit = normalizeTextValue(paired?.unit)
  if (!paired || !pairedUnit || pairedUnit === "piapro") {
    return candidateUnitId
  }

  for (let unitId = 27; unitId <= 56; unitId += 1) {
    const unit = ctx.gameCharacterUnitById.get(unitId)
    if (
      normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID) === candidateCharacterId
      && normalizeTextValue(unit?.unit) === pairedUnit
    ) {
      return unitId
    }
  }

  return candidateUnitId
}

function resolveGameCharacterIdByUnitId(unitId: number | null, ctx: HonorVisualContext) {
  if (!unitId) {
    return null
  }

  const unit = ctx.gameCharacterUnitById.get(unitId)
  return normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID)
}

function resolveHonorLevelVisual(honor: RankBorderMasterHonor | null, level: number | null) {
  if (!honor?.levels?.length) {
    return null
  }

  const requestedLevel = level ?? 0
  let first: NonNullable<RankBorderMasterHonor["levels"]>[number] | null = null
  let best: NonNullable<RankBorderMasterHonor["levels"]>[number] | null = null
  for (const item of honor.levels) {
    if (!normalizeTextValue(item.assetbundleName) && !normalizeTextValue(item.honorRarity)) {
      continue
    }

    first ??= item
    if (item.level === requestedLevel) {
      return item
    }

    if (requestedLevel > 0 && item.level != null && item.level <= requestedLevel) {
      if (!best || (item.level ?? 0) > (best.level ?? 0)) {
        best = item
      }
    }
  }

  return best ?? first
}

function resolveHonorBackgroundAssetName(group: RankBorderMasterHonorGroup | null, assetBundleName: string | null) {
  return normalizeTextValue(group?.backgroundAssetbundleName)
    ?? normalizeTextValue(group?.backgroundAssetBundleName)
    ?? deriveHonorBackgroundAssetName(assetBundleName)
    ?? null
}

function deriveHonorBackgroundAssetName(assetBundleName: string | null) {
  if (!assetBundleName || !assetBundleName.includes("event") || !assetBundleName.includes("top")) {
    return null
  }

  return assetBundleName.replace(/^honor_top_\d+_?/, "honor_bg_")
}

function resolveHonorGroupType(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
) {
  const groupType = normalizeTextValue(group?.honorType) ?? ""
  const isWorldLink = groupType === "wl_event"
    || groupType === "world_link"
    || Boolean(backgroundAssetBundleName?.includes("event_wl") || assetBundleName?.includes("event_wl"))
  return isWorldLink ? "wl_event" : groupType
}

function honorUsesRankLayer(groupType: string, assetBundleName: string) {
  return groupType === "event"
    || groupType === "wl_event"
    || groupType === "rank_match"
    || groupType === "sekai_echo"
    || isWorldLinkRankAssetName(assetBundleName)
}

function honorUsesLevelIconLayer(groupType: string) {
  return groupType === "character" || groupType === "achievement" || groupType === "bonds"
}

function resolveHonorBaseUrl(
  groupType: string,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
  mode: "main" | "sub",
  ctx: HonorVisualContext,
) {
  if (groupType === "rank_match" && backgroundAssetBundleName) {
    return resolveSekaiGameAssetUrl(
      ctx.region,
      `startapp/rank_live/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
      ctx.assetEndpoint,
    )
  }

  if (backgroundAssetBundleName) {
    return resolveSekaiGameAssetUrl(
      ctx.region,
      `startapp/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
      ctx.assetEndpoint,
    )
  }

  if (isCompactTopRankHonorAssetName(assetBundleName)) {
    return resolveHonorRankUrl(groupType, assetBundleName, mode, ctx)
  }

  if (!assetBundleName) {
    return null
  }
  return resolveSekaiGameAssetUrl(ctx.region, `startapp/honor/${assetBundleName}/degree_${mode}.png`, ctx.assetEndpoint)
}

function resolveHonorRankUrl(groupType: string, assetBundleName: string, mode: "main" | "sub", ctx: HonorVisualContext) {
  const path = groupType === "rank_match"
    ? `startapp/rank_live/honor/${assetBundleName}/${mode}.png`
    : `startapp/honor/${assetBundleName}/rank_${mode}.png`
  return resolveSekaiGameAssetUrl(ctx.region, path, ctx.assetEndpoint)
}

function resolveBondsHonorCharacterUrl(unitId: number, ctx: HonorVisualContext) {
  return resolveSekaiGameAssetUrl(
    ctx.region,
    `startapp/bonds_honor/character/chr_sd_${String(unitId).padStart(2, "0")}_01.png`,
    ctx.assetEndpoint,
  )
}

function resolveHonorFrameUrl(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
  rarity: string | null,
  mode: "main" | "sub",
  ctx: HonorVisualContext,
) {
  if (!rarity) {
    return null
  }

  const rarityRank = honorRarityRank(rarity)
  const frameName = normalizeTextValue(group?.frameName)
    ?? deriveHonorFrameName(assetBundleName)
  if (isBirthdayHonor(group, backgroundAssetBundleName, assetBundleName) && rarityRank <= 1) {
    return null
  }

  if (frameName && usesGroupHonorFrame(frameName, rarityRank)) {
    return resolveSekaiGameAssetUrl(
      ctx.region,
      `startapp/honor_frame/${frameName}/frame_degree_${mode[0]}_${rarityRank}.png`,
      ctx.assetEndpoint,
    )
  }

  return `/rank-border/honor/frame_degree_${mode[0]}_${rarityRank}.png`
}

function isBirthdayHonor(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
) {
  const frameName = normalizeTextValue(group?.frameName) ?? ""
  return normalizeTextValue(group?.honorType) === "birthday"
    || frameName.startsWith("honor_frame_birthday")
    || Boolean(backgroundAssetBundleName?.startsWith("honor_bg_birthday"))
    || Boolean(assetBundleName?.startsWith("honor_bg_birthday"))
}

function deriveHonorFrameName(assetBundleName: string | null) {
  if (!assetBundleName) {
    return null
  }

  const normalized = assetBundleName.trim()
  if (normalized.startsWith("honor_bg_event_")) {
    return normalized.replace(/^honor_bg_/, "")
  }

  if (normalized.startsWith("honor_top_")) {
    const background = deriveHonorBackgroundAssetName(normalized)
    if (background?.startsWith("honor_bg_event_")) {
      return background.replace(/^honor_bg_/, "")
    }
  }

  return null
}

function resolveHonorRarityFromAssetName(assetBundleName: string | null) {
  if (!assetBundleName) {
    return null
  }

  if (assetBundleName.includes("000001")) {
    return "highest"
  }

  if (assetBundleName.includes("0001000")) {
    return "middle"
  }

  if (assetBundleName.includes("000100")) {
    return "high"
  }

  return null
}

function usesGroupHonorFrame(frameName: string, rarityRank: number) {
  const startRare = frameName.startsWith("event") ? 3 : 2
  return rarityRank >= startRare
}

function resolveHonorRankPlacement(groupType: string, assetBundleName: string | null): RankBorderHonorView["rankPlacement"] {
  if (groupType === "rank_match") {
    return "rank_match"
  }

  if (isWorldLinkRankAssetName(assetBundleName)) {
    return "full"
  }

  return "event"
}

function isWorldLinkRankAssetName(assetBundleName: string | null) {
  const normalized = normalizeTextValue(assetBundleName)?.toLowerCase() ?? ""
  return normalized.startsWith("honor_top_") && normalized.includes("event")
}

function isCompactTopRankHonorAssetName(assetBundleName: string | null): assetBundleName is string {
  const normalized = normalizeTextValue(assetBundleName)?.toLowerCase() ?? ""
  return /^honor_top_\d+$/.test(normalized)
}

function honorRarityRank(rarity: string) {
  if (rarity === "middle") {
    return 2
  }

  if (rarity === "high") {
    return 3
  }

  if (rarity === "highest") {
    return 4
  }

  return 1
}

export function honorSvgId(honor: RankBorderHonorView, suffix: string) {
  return `rank-border-honor-${sanitizeDomId(honor.key)}-${suffix}`
}

export function sanitizeDomId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-")
}

export function honorFrameSvgAttrs(honor: RankBorderHonorView) {
  return honor.framePlacement === "low"
    ? { x: 8, y: 0, width: 164, height: 80 }
    : { x: 0, y: 0, width: 180, height: 80 }
}

export function honorRankSvgAttrs(honor: RankBorderHonorView) {
  if (honor.rankPlacement === "full") {
    return { x: 0, y: 0, width: 180, height: 80 }
  }

  return honor.rankPlacement === "rank_match"
    ? { x: 17, y: 42, width: 120, height: 38 }
    : { x: 34, y: 42, width: 120, height: 38 }
}

export function honorLevelStars(honor: RankBorderHonorView): RankBorderHonorLevelStar[] {
  if (honor.groupType === "fc_ap") {
    return []
  }

  const level = Math.max(0, honor.level ?? 0)
  const normalizedLevel = level > 10 ? level - 10 : level
  const stars: RankBorderHonorLevelStar[] = []
  if (honor.levelIconUrl) {
    for (let index = 0; index < Math.min(normalizedLevel, 5); index += 1) {
      stars.push({
        key: `${honor.key}:lv:${index}`,
        url: honor.levelIconUrl,
        slot: index,
        layer: 1,
      })
    }
  }
  if (honor.level6IconUrl) {
    for (let index = 5; index < normalizedLevel; index += 1) {
      stars.push({
        key: `${honor.key}:lv6:${index}`,
        url: honor.level6IconUrl,
        slot: index - 5,
        layer: 2,
      })
    }
  }
  return stars
}

function normalizePositiveNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function normalizeTextValue(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
