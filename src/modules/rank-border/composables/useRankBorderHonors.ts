import { ref, type ComputedRef, type Ref } from "vue"
import {
  resolveCardAttrRoundIconUrl,
  resolveCardFrameImageUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
  resolveSekaiGameAssetUrl,
  resolveTrainRankImageUrl,
} from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import {
  useRankBorderMasterOptions,
  type RankBorderMasterBondsHonor,
  type RankBorderMasterBondsHonorWord,
  type RankBorderMasterCard,
  type RankBorderMasterGameCharacterUnit,
  type RankBorderMasterHonor,
  type RankBorderMasterHonorGroup,
} from "./useRankBorderMasterOptions"
import {
  isRankBorderLatestResult,
  normalizeTrackerEndpoint,
  type RankBorderLatest,
  type RankBorderLine,
} from "../lib/rank-border"
import {
  FC_AP_HONOR_IDS,
  IMAGE_PRELOAD_CACHE_LIMIT,
  IMAGE_RETRY_BACKOFF_LIMIT,
  IMAGE_RETRY_COUNT_ATTRIBUTE,
  IMAGE_RETRY_DELAY_MS,
  IMAGE_RETRY_LIMIT,
  IMAGE_RETRY_MAX_DELAY_MS,
  IMAGE_RETRY_ORIGINAL_ATTRIBUTE,
  IMAGE_RETRY_PARAM,
} from "../lib/rank-border-constants"
import type {
  DetailState,
  RankBorderHonorLevelStar,
  RankBorderHonorView,
  RankBorderLineRow,
  RecoverableImageTarget,
} from "../lib/rank-border-types"

/**
 * HONOR / LEADER-CARD / IMAGE-PRELOAD rendering subsystem for the rank-border
 * view.
 *
 * Owns the leader-card visuals, the profile-honor rendering pipeline (including
 * bonds honors, honor frames/ranks/levels), and the image preload + recovery
 * machinery used to render those assets. Everything returned keeps the original
 * declaration names so the view's <template> and remaining script reference them
 * unchanged.
 */
export interface UseRankBorderHonorsDeps {
  cardById: ComputedRef<Map<number, RankBorderMasterCard>>
  honorById: ComputedRef<Map<number, RankBorderMasterHonor>>
  honorGroupById: ComputedRef<Map<number, RankBorderMasterHonorGroup>>
  bondsHonorById: ComputedRef<Map<number, RankBorderMasterBondsHonor>>
  bondsHonorWordById: ComputedRef<Map<number, RankBorderMasterBondsHonorWord>>
  gameCharacterUnitById: ComputedRef<Map<number, RankBorderMasterGameCharacterUnit>>
  selectedRegion: Ref<SekaiRegion>
  trackerEndpoint: Ref<string>
  masterOptions: ReturnType<typeof useRankBorderMasterOptions>
}

export function useRankBorderHonors(deps: UseRankBorderHonorsDeps) {
  const {
    cardById,
    honorById,
    honorGroupById,
    bondsHonorById,
    bondsHonorWordById,
    gameCharacterUnitById,
    selectedRegion,
    trackerEndpoint,
    masterOptions,
  } = deps
  const settingsStore = useSettingsStore()

  const profileAssetsLoading = ref(false)
  const preloadedImageSources = ref(new Map<string, "loading" | "loaded" | "failed">())
  const queuedImagePreloads = new Set<string>()

  function normalizeTextValue(value: unknown) {
    if (typeof value !== "string") {
      return null
    }

    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  function isLocalMockTrackerEndpoint(endpoint: string) {
    const normalized = normalizeTrackerEndpoint(endpoint)
    return normalized === "http://127.0.0.1:18777" || normalized === "http://localhost:18777"
  }

  type ProfileResult = RankBorderLatest | RankBorderLine | null

  function isLatestResult(result: ProfileResult): result is RankBorderLatest {
    return isRankBorderLatestResult(result)
  }

  function leaderThumbnailUrl(result: ProfileResult) {
    if (!isLatestResult(result) || !result.cardId) {
      return null
    }

    const card = cardById.value.get(result.cardId)
    const assetBundleName = normalizeTextValue(card?.assetbundleName)
    if (!assetBundleName) {
      return null
    }

    const trainedArt = resolveCardTrainedArt(result)
    if (isLocalMockTrackerEndpoint(trackerEndpoint.value)) {
      return `/rank-border/card/${assetBundleName}${trainedArt ? "_after_training" : "_normal"}.png`
    }

    return resolveSekaiCardThumbnailUrl(
      selectedRegion.value,
      assetBundleName,
      trainedArt,
      settingsStore.currentAssetEndpoint,
    )
  }

  function leaderCardFrameUrl(result: ProfileResult) {
    const rarity = leaderCardRarity(result)
    return rarity ? resolveCardFrameImageUrl(rarity) : null
  }

  function leaderAttrIconUrl(result: ProfileResult) {
    if (!isLatestResult(result) || !result.cardId) {
      return null
    }

    const card = cardById.value.get(result.cardId)
    const attr = normalizeTextValue(card?.attr)?.toLowerCase()
    return attr ? resolveCardAttrRoundIconUrl(attr) : null
  }

  function leaderRareIconUrl(result: ProfileResult) {
    const rarity = leaderCardRarity(result)
    if (!rarity) {
      return null
    }

    return rarity === "rarity_birthday"
      ? resolveRareBirthdayImageUrl()
      : resolveRareStarImageUrl(resolveCardDisplayAfterTraining(result))
  }

  function leaderRareCount(result: ProfileResult) {
    const rarity = leaderCardRarity(result)
    if (!rarity) {
      return 0
    }

    if (rarity === "rarity_birthday") {
      return 1
    }

    const match = rarity.match(/\d+/)
    return match ? Number(match[0]) : 0
  }

  function leaderMasterRankUrl(result: ProfileResult) {
    if (!isLatestResult(result) || result.cardMasterRank == null || result.cardMasterRank <= 0) {
      return null
    }

    return resolveTrainRankImageUrl(result.cardMasterRank)
  }

  function leaderCardRarity(result: ProfileResult) {
    if (!isLatestResult(result) || !result.cardId) {
      return null
    }

    const card = cardById.value.get(result.cardId)
    return normalizeTextValue(card?.cardRarityType)
  }

  function leaderCardLabel(result: ProfileResult) {
    if (!isLatestResult(result) || !result.cardId) {
      return null
    }

    const card = cardById.value.get(result.cardId)
    return normalizeTextValue(card?.prefix) ?? `#${result.cardId}`
  }

  function leaderLevelLabel(result: ProfileResult) {
    return isLatestResult(result) && result.cardLevel != null ? `Lv.${result.cardLevel}` : null
  }

  function leaderMasterRankLabel(result: ProfileResult) {
    return isLatestResult(result) && result.cardMasterRank != null ? `MR${result.cardMasterRank}` : null
  }

  function profileHonorViews(result: ProfileResult, limit = 3, keyScope = "profile"): RankBorderHonorView[] {
    if (!isLatestResult(result)) {
      return []
    }

    return result.profileHonors
      .slice(0, limit)
      .map((honor, index) => {
        const honorId = honor.honorId ?? honor.honorId2
        const masterHonor = honorId ? honorById.value.get(honorId) ?? null : null
        const bondsHonor = honorId ? bondsHonorById.value.get(honorId) ?? null : null
        if (!masterHonor && bondsHonor) {
          return resolveBondsHonorView(honor, bondsHonor, honorId, index, keyScope)
        }

        const groupId = normalizePositiveNumber(masterHonor?.groupId ?? masterHonor?.groupID)
        const masterGroup = groupId ? honorGroupById.value.get(groupId) ?? null : null
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

  function rowHonorKeyScope(row: RankBorderLineRow) {
    return `row-${row.rank}-${sanitizeDomId(row.detail?.userId ?? "line")}`
  }

  function detailHonorKeyScope(value: DetailState) {
    return `detail-${value.source}-${value.result.rank}-${sanitizeDomId(isLatestResult(value.result) ? value.result.userId ?? value.query : value.query)}`
  }

  function resolveHonorVisual(
    honor: RankBorderMasterHonor | null,
    group: RankBorderMasterHonorGroup | null,
    honorId: number | null,
    level: number | null,
    count: number | null,
    mode: "main" | "sub",
  ): Omit<RankBorderHonorView, "key" | "label" | "level"> {
    const levelVisual = resolveHonorLevelVisual(honor, level)
    const assetBundleName = normalizeTextValue(honor?.assetbundleName) ?? normalizeTextValue(levelVisual?.assetbundleName)
    const rarity = normalizeTextValue(honor?.honorRarity) ?? normalizeTextValue(levelVisual?.honorRarity)
    const backgroundAssetBundleName = resolveHonorBackgroundAssetName(group, assetBundleName)
    const groupType = honorId != null && FC_AP_HONOR_IDS.has(honorId)
      ? "fc_ap"
      : resolveHonorGroupType(group, backgroundAssetBundleName, assetBundleName)
    const resolvedRarity = rarity ?? resolveHonorRarityFromAssetName(assetBundleName)
    const baseUrl = resolveHonorBaseUrl(groupType, backgroundAssetBundleName, assetBundleName, mode)
    const rankUrl = assetBundleName && honorUsesRankLayer(groupType, assetBundleName)
      ? resolveHonorRankUrl(groupType, assetBundleName, mode)
      : null

    return {
      type: "normal",
      groupType,
      honorId,
      baseUrl,
      rankUrl: rankUrl && rankUrl !== baseUrl ? rankUrl : null,
      rankPlacement: resolveHonorRankPlacement(groupType, assetBundleName),
      frameUrl: resolveHonorFrameUrl(group, backgroundAssetBundleName, assetBundleName, resolvedRarity, mode),
      framePlacement: resolvedRarity === "low" ? "low" : "full",
      scrollUrl: assetBundleName && honorUsesScrollLayer(groupType)
        ? resolveHonorScrollUrl(assetBundleName)
        : null,
      levelIconUrl: honorUsesLevelIconLayer(groupType)
        ? "/rank-border/honor/icon_degreeLv.png"
        : null,
      level6IconUrl: honorUsesLevelIconLayer(groupType)
        ? "/rank-border/honor/icon_degreeLv6.png"
        : null,
      fcApCount: assetBundleName && honorUsesScrollLevel(groupType, assetBundleName) && count != null
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
  ): RankBorderHonorView {
    const slots = resolveBondsHonorDisplaySlots(bondsHonor, honor.bondsHonorViewType)
    const rarity = normalizeTextValue(bondsHonor.honorRarity)
    const word = honor.bondsHonorWordId ? bondsHonorWordById.value.get(honor.bondsHonorWordId) ?? null : null
    return {
      key: `${keyScope}:${honor.seq ?? index}:bonds:${honorId ?? "unknown"}:${honor.bondsHonorViewType ?? ""}`,
      label: normalizeTextValue(word?.name) ?? normalizeTextValue(bondsHonor.name) ?? (honorId ? `#${honorId}` : "-"),
      type: "bonds",
      groupType: "bonds",
      honorId,
      baseUrl: null,
      rankUrl: null,
      rankPlacement: "event",
      frameUrl: resolveBondsHonorFrameUrl(rarity, "sub"),
      framePlacement: rarity === "low" ? "low" : "full",
      scrollUrl: null,
      levelIconUrl: "/rank-border/honor/icon_degreeLv.png",
      level6IconUrl: "/rank-border/honor/icon_degreeLv6.png",
      fcApCount: null,
      bondsLeftBgUrl: slots.leftCharacterId ? `/rank-border/honor/bonds/${slots.leftCharacterId}_sub.png` : null,
      bondsRightBgUrl: slots.rightCharacterId ? `/rank-border/honor/bonds/${slots.rightCharacterId}_sub.png` : null,
      bondsLeftIconUrl: slots.leftUnitId ? resolveBondsHonorCharacterUrl(slots.leftUnitId) : null,
      bondsRightIconUrl: slots.rightUnitId ? resolveBondsHonorCharacterUrl(slots.rightUnitId) : null,
      level: honor.honorLevel,
    }
  }

  function resolveBondsHonorDisplaySlots(bondsHonor: RankBorderMasterBondsHonor, viewType: string | null) {
    let leftUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId1 ?? bondsHonor.gameCharacterUnitID1)
    let rightUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId2 ?? bondsHonor.gameCharacterUnitID2)
    if (bondsHonor.configurableUnitVirtualSinger && bondsHonorUsesUnitVirtualSinger(viewType)) {
      const originalLeftUnitId = leftUnitId
      const originalRightUnitId = rightUnitId
      leftUnitId = resolveUnitVirtualSingerUnitId(originalLeftUnitId, originalRightUnitId)
      rightUnitId = resolveUnitVirtualSingerUnitId(originalRightUnitId, originalLeftUnitId)
    }

    if (bondsHonorViewTypeIsReverse(viewType)) {
      const originalLeftUnitId = leftUnitId
      leftUnitId = rightUnitId
      rightUnitId = originalLeftUnitId
    }

    return {
      leftUnitId,
      rightUnitId,
      leftCharacterId: resolveGameCharacterIdByUnitId(leftUnitId),
      rightCharacterId: resolveGameCharacterIdByUnitId(rightUnitId),
    }
  }

  function normalizePositiveNumber(value: unknown): number | null {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  function resolveUnitVirtualSingerUnitId(candidateUnitId: number | null, pairedUnitId: number | null) {
    if (!candidateUnitId) {
      return candidateUnitId
    }

    const candidate = gameCharacterUnitById.value.get(candidateUnitId)
    const candidateCharacterId = normalizePositiveNumber(candidate?.gameCharacterId ?? candidate?.gameCharacterID)
    if (!candidate || !candidateCharacterId || candidateCharacterId < 21 || !pairedUnitId) {
      return candidateUnitId
    }

    const paired = gameCharacterUnitById.value.get(pairedUnitId)
    const pairedUnit = normalizeTextValue(paired?.unit)
    if (!paired || !pairedUnit || pairedUnit === "piapro") {
      return candidateUnitId
    }

    for (let unitId = 27; unitId <= 56; unitId += 1) {
      const unit = gameCharacterUnitById.value.get(unitId)
      if (
        normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID) === candidateCharacterId
        && normalizeTextValue(unit?.unit) === pairedUnit
      ) {
        return unitId
      }
    }

    return candidateUnitId
  }

  function resolveGameCharacterIdByUnitId(unitId: number | null) {
    if (!unitId) {
      return null
    }

    const unit = gameCharacterUnitById.value.get(unitId)
    return normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID)
  }

  function bondsHonorViewTypeIsReverse(viewType: string | null) {
    return (normalizeTextValue(viewType)?.toLowerCase() ?? "").startsWith("reverse")
  }

  function bondsHonorUsesUnitVirtualSinger(viewType: string | null) {
    return (normalizeTextValue(viewType)?.toLowerCase() ?? "").includes("unit_virtual_singer")
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
    if (isWorldLinkHonorGroup(groupType, backgroundAssetBundleName, assetBundleName)) {
      return "wl_event"
    }

    return groupType
  }

  function isWorldLinkHonorGroup(groupType: string, backgroundAssetBundleName: string | null, assetBundleName: string | null) {
    return groupType === "wl_event"
      || groupType === "world_link"
      || Boolean(backgroundAssetBundleName?.includes("event_wl") || assetBundleName?.includes("event_wl"))
  }

  function honorUsesRankLayer(groupType: string, assetBundleName: string) {
    return groupType === "event"
      || groupType === "wl_event"
      || groupType === "rank_match"
      || groupType === "sekai_echo"
      || isWorldLinkRankAssetName(assetBundleName)
  }

  function honorUsesScrollLayer(groupType: string) {
    return groupType === "fc_ap"
  }

  function honorUsesScrollLevel(groupType: string, assetBundleName: string | null) {
    return groupType === "fc_ap" && assetBundleName != null
  }

  function honorUsesLevelIconLayer(groupType: string) {
    return groupType === "character" || groupType === "achievement" || groupType === "bonds"
  }

  function resolveHonorBaseUrl(
    groupType: string,
    backgroundAssetBundleName: string | null,
    assetBundleName: string | null,
    mode: "main" | "sub",
  ) {
    if (groupType === "rank_match" && backgroundAssetBundleName) {
      return resolveSekaiGameAssetUrl(
        selectedRegion.value,
        `startapp/rank_live/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
        settingsStore.currentAssetEndpoint,
      )
    }

    if (backgroundAssetBundleName) {
      return resolveSekaiGameAssetUrl(
        selectedRegion.value,
        `startapp/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
        settingsStore.currentAssetEndpoint,
      )
    }

    if (isCompactTopRankHonorAssetName(assetBundleName)) {
      return resolveHonorRankUrl(groupType, assetBundleName, mode)
    }

    const path = assetBundleName ? `startapp/honor/${assetBundleName}/degree_${mode}.png` : null
    if (!path) {
      return null
    }
    return resolveSekaiGameAssetUrl(selectedRegion.value, path, settingsStore.currentAssetEndpoint)
  }

  function resolveHonorRankUrl(groupType: string, assetBundleName: string, mode: "main" | "sub") {
    const path = groupType === "rank_match"
      ? `startapp/rank_live/honor/${assetBundleName}/${mode}.png`
      : `startapp/honor/${assetBundleName}/rank_${mode}.png`
    return resolveSekaiGameAssetUrl(selectedRegion.value, path, settingsStore.currentAssetEndpoint)
  }

  function resolveHonorScrollUrl(assetBundleName: string) {
    return resolveSekaiGameAssetUrl(
      selectedRegion.value,
      `startapp/honor/${assetBundleName}/scroll.png`,
      settingsStore.currentAssetEndpoint,
    )
  }

  function resolveBondsHonorCharacterUrl(unitId: number) {
    return resolveSekaiGameAssetUrl(
      selectedRegion.value,
      `startapp/bonds_honor/character/chr_sd_${String(unitId).padStart(2, "0")}_01.png`,
      settingsStore.currentAssetEndpoint,
    )
  }

  function resolveBondsHonorFrameUrl(rarity: string | null, mode: "main" | "sub") {
    if (!rarity) {
      return null
    }

    return `/rank-border/honor/frame_degree_${mode[0]}_${honorRarityRank(rarity)}.png`
  }

  function resolveHonorFrameUrl(
    group: RankBorderMasterHonorGroup | null,
    backgroundAssetBundleName: string | null,
    assetBundleName: string | null,
    rarity: string | null,
    mode: "main" | "sub",
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
        selectedRegion.value,
        `startapp/honor_frame/${frameName}/frame_degree_${mode[0]}_${rarityRank}.png`,
        settingsStore.currentAssetEndpoint,
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

  function isCompactTopRankHonorAssetName(assetBundleName: string | null) {
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

  function resolveCardTrainedArt(result: RankBorderLatest) {
    const defaultImage = normalizeTextValue(result.cardDefaultImage)?.toLowerCase() ?? ""
    if (["special_training", "after_training", "card_after_training", "trained"].includes(defaultImage)) {
      return true
    }

    if (["normal", "original", "before_training", "card_normal"].includes(defaultImage)) {
      return false
    }

    return normalizeTextValue(result.cardSpecialTrainingStatus)?.toLowerCase() === "done"
  }

  function resolveCardDisplayAfterTraining(result: ProfileResult) {
    if (!isLatestResult(result)) {
      return false
    }

    const rarity = leaderCardRarity(result)
    if (rarity === "rarity_3" || rarity === "rarity_4") {
      return true
    }

    return resolveCardTrainedArt(result)
  }

  function honorSvgId(honor: RankBorderHonorView, suffix: string) {
    return `rank-border-honor-${sanitizeDomId(honor.key)}-${suffix}`
  }

  function sanitizeDomId(value: string) {
    return value.replace(/[^A-Za-z0-9_-]/g, "-")
  }

  function honorFrameSvgAttrs(honor: RankBorderHonorView) {
    return honor.framePlacement === "low"
      ? { x: 8, y: 0, width: 164, height: 80 }
      : { x: 0, y: 0, width: 180, height: 80 }
  }

  function honorRankSvgAttrs(honor: RankBorderHonorView) {
    if (honor.rankPlacement === "full") {
      return { x: 0, y: 0, width: 180, height: 80 }
    }

    return honor.rankPlacement === "rank_match"
      ? { x: 17, y: 42, width: 120, height: 38 }
      : { x: 34, y: 42, width: 120, height: 38 }
  }

  function honorLevelStars(honor: RankBorderHonorView) {
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

  function loadedHonorLevelStars(honor: RankBorderHonorView) {
    return honorLevelStars(honor)
      .map((star) => ({
        ...star,
        url: preloadedRankBorderImageUrl(star.url),
      }))
      .filter((star): star is RankBorderHonorLevelStar => star.url != null)
  }

  function preloadedRankBorderImageUrl(source: string | null | undefined) {
    const normalizedSource = normalizeImageSource(source)
    if (!normalizedSource) {
      return null
    }

    const status = preloadedImageSources.value.get(normalizedSource)
    if (status === "loaded") {
      return normalizedSource
    }

    if (status == null) {
      queueRankBorderImagePreload(normalizedSource)
    }

    return null
  }

  function isRankBorderImageLoaded(source: string | null | undefined) {
    const normalizedSource = normalizeImageSource(source)
    if (!normalizedSource) {
      return false
    }

    const status = preloadedImageSources.value.get(normalizedSource)
    if (status === "loaded") {
      return true
    }

    if (status == null) {
      queueRankBorderImagePreload(normalizedSource)
    }

    return false
  }

  function areRankBorderImagesLoaded(...sources: Array<string | null | undefined>) {
    let allLoaded = true
    for (const source of sources) {
      if (!isRankBorderImageLoaded(source)) {
        allLoaded = false
      }
    }

    return allLoaded
  }

  function normalizeImageSource(source: string | null | undefined) {
    if (!source) {
      return null
    }

    const trimmed = source.trim()
    return trimmed ? stripImageRetryParam(trimmed) : null
  }

  async function preloadRankBorderImage(source: string, retryCount = 0) {
    queuedImagePreloads.delete(source)
    const normalizedSource = normalizeImageSource(source)
    if (!normalizedSource) {
      return
    }

    const currentStatus = preloadedImageSources.value.get(normalizedSource)
    if (currentStatus === "loaded" || currentStatus === "loading") {
      return
    }

    updatePreloadedImageSource(normalizedSource, "loading")
    try {
      await loadRankBorderImage(normalizedSource)
      updatePreloadedImageSource(normalizedSource, "loaded")
    } catch {
      if (retryCount >= IMAGE_RETRY_LIMIT) {
        updatePreloadedImageSource(normalizedSource, "failed")
        return
      }

      window.setTimeout(() => {
        updatePreloadedImageSource(normalizedSource, "failed")
        void preloadRankBorderImage(normalizedSource, retryCount + 1)
      }, recoverableImageRetryDelay(retryCount + 1))
    }
  }

  function queueRankBorderImagePreload(source: string) {
    if (queuedImagePreloads.has(source)) {
      return
    }

    queuedImagePreloads.add(source)
    window.setTimeout(() => {
      void preloadRankBorderImage(source)
    }, 0)
  }

  function loadRankBorderImage(source: string) {
    return new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.decoding = "async"
      image.onload = () => {
        if (typeof image.decode === "function") {
          void image.decode().then(resolve, resolve)
          return
        }

        resolve()
      }
      image.onerror = () => reject(new Error("image load failed"))
      image.src = source
    })
  }

  function updatePreloadedImageSource(source: string, status: "loading" | "loaded" | "failed") {
    const nextSources = new Map(preloadedImageSources.value)
    if (!nextSources.has(source) && nextSources.size >= IMAGE_PRELOAD_CACHE_LIMIT) {
      const oldestSource = nextSources.keys().next().value
      if (oldestSource != null) {
        nextSources.delete(oldestSource)
      }
    }

    nextSources.set(source, status)
    preloadedImageSources.value = nextSources
  }

  function hideBrokenImage(event: Event) {
    if (event.target instanceof HTMLImageElement || event.target instanceof SVGImageElement) {
      retryRecoverableImage(event.target)
    }
  }

  function resetRecoveredImage(event: Event) {
    if (event.target instanceof HTMLImageElement || event.target instanceof SVGImageElement) {
      showRecoverableImage(event.target)
      event.target.removeAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE)
      event.target.removeAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE)
    }
  }

  function retryRecoverableImage(target: RecoverableImageTarget) {
    const currentSource = recoverableImageSource(target)
    if (!currentSource) {
      hideRecoverableImage(target)
      return
    }

    const strippedSource = stripImageRetryParam(currentSource)
    const storedSource = target.getAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE)
    const storedSourceMatches = storedSource != null && stripImageRetryParam(storedSource) === strippedSource
    const originalSource = storedSourceMatches
      ? storedSource
      : strippedSource
    target.setAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE, originalSource)
    hideRecoverableImage(target)
    const retryCount = storedSourceMatches
      ? Number(target.getAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE) ?? "0")
      : 0
    if (retryCount >= IMAGE_RETRY_LIMIT) {
      return
    }

    const nextRetryCount = retryCount + 1
    target.setAttribute(IMAGE_RETRY_COUNT_ATTRIBUTE, String(nextRetryCount))
    window.setTimeout(() => {
      if (!target.isConnected || target.getAttribute(IMAGE_RETRY_ORIGINAL_ATTRIBUTE) !== originalSource) {
        return
      }

      setRecoverableImageSource(target, appendImageRetryParam(originalSource, nextRetryCount))
    }, recoverableImageRetryDelay(nextRetryCount))
  }

  function recoverableImageRetryDelay(retryCount: number) {
    const backoffStep = Math.min(retryCount - 1, IMAGE_RETRY_BACKOFF_LIMIT)
    return Math.min(IMAGE_RETRY_DELAY_MS * 2 ** backoffStep, IMAGE_RETRY_MAX_DELAY_MS)
  }

  function recoverableImageSource(target: RecoverableImageTarget) {
    if (target instanceof HTMLImageElement) {
      return target.getAttribute("src") || target.currentSrc || target.src
    }

    return target.getAttribute("href")
      || target.getAttributeNS("http://www.w3.org/1999/xlink", "href")
  }

  function setRecoverableImageSource(target: RecoverableImageTarget, source: string) {
    if (target instanceof HTMLImageElement) {
      target.src = source
      return
    }

    target.setAttribute("href", source)
    target.setAttributeNS("http://www.w3.org/1999/xlink", "href", source)
  }

  function hideRecoverableImage(target: RecoverableImageTarget) {
    if (target instanceof HTMLImageElement) {
      target.style.visibility = "hidden"
      return
    }

    target.style.visibility = "hidden"
    target.setAttribute("visibility", "hidden")
  }

  function showRecoverableImage(target: RecoverableImageTarget) {
    if (target instanceof HTMLImageElement) {
      target.style.visibility = ""
      return
    }

    target.style.visibility = ""
    target.removeAttribute("visibility")
  }

  function appendImageRetryParam(source: string, retryCount: number) {
    const [baseSource, hash = ""] = source.split("#", 2)
    const separator = baseSource.includes("?") ? "&" : "?"
    const nextSource = `${stripImageRetryParam(baseSource)}${separator}${IMAGE_RETRY_PARAM}=${retryCount}-${Date.now()}`
    return hash ? `${nextSource}#${hash}` : nextSource
  }

  function stripImageRetryParam(source: string) {
    try {
      const url = new URL(source, window.location.href)
      url.searchParams.delete(IMAGE_RETRY_PARAM)
      if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("//")) {
        return url.toString()
      }

      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return source.replace(new RegExp(`([?&])${IMAGE_RETRY_PARAM}=[^&#]*&?`), "$1").replace(/[?&]$/, "")
    }
  }

  function preloadProfileAssets() {
    if (profileAssetsLoading.value) {
      return
    }

    if (cardById.value.size > 0 && honorById.value.size > 0 && honorGroupById.value.size > 0) {
      return
    }

    profileAssetsLoading.value = true
    void masterOptions.loadProfileAssets(false).finally(() => {
      profileAssetsLoading.value = false
    })
  }

  return {
    isLatestResult,
    leaderThumbnailUrl,
    leaderCardFrameUrl,
    leaderAttrIconUrl,
    leaderRareIconUrl,
    leaderRareCount,
    leaderMasterRankUrl,
    leaderCardRarity,
    leaderCardLabel,
    leaderLevelLabel,
    leaderMasterRankLabel,
    resolveCardTrainedArt,
    resolveCardDisplayAfterTraining,
    profileHonorViews,
    resolveFcApHonorCount,
    rowHonorKeyScope,
    detailHonorKeyScope,
    resolveHonorVisual,
    resolveBondsHonorView,
    resolveBondsHonorDisplaySlots,
    resolveUnitVirtualSingerUnitId,
    resolveGameCharacterIdByUnitId,
    bondsHonorViewTypeIsReverse,
    bondsHonorUsesUnitVirtualSinger,
    resolveHonorLevelVisual,
    resolveHonorBackgroundAssetName,
    deriveHonorBackgroundAssetName,
    resolveHonorGroupType,
    isWorldLinkHonorGroup,
    honorUsesRankLayer,
    honorUsesScrollLayer,
    honorUsesScrollLevel,
    honorUsesLevelIconLayer,
    resolveHonorBaseUrl,
    resolveHonorRankUrl,
    resolveHonorScrollUrl,
    resolveBondsHonorCharacterUrl,
    resolveBondsHonorFrameUrl,
    resolveHonorFrameUrl,
    isBirthdayHonor,
    deriveHonorFrameName,
    resolveHonorRarityFromAssetName,
    usesGroupHonorFrame,
    resolveHonorRankPlacement,
    isWorldLinkRankAssetName,
    isCompactTopRankHonorAssetName,
    honorRarityRank,
    honorSvgId,
    sanitizeDomId,
    honorFrameSvgAttrs,
    honorRankSvgAttrs,
    honorLevelStars,
    loadedHonorLevelStars,
    preloadedRankBorderImageUrl,
    isRankBorderImageLoaded,
    areRankBorderImagesLoaded,
    normalizeImageSource,
    preloadRankBorderImage,
    queueRankBorderImagePreload,
    loadRankBorderImage,
    updatePreloadedImageSource,
    hideBrokenImage,
    resetRecoveredImage,
    retryRecoverableImage,
    recoverableImageRetryDelay,
    recoverableImageSource,
    setRecoverableImageSource,
    hideRecoverableImage,
    showRecoverableImage,
    appendImageRetryParam,
    stripImageRetryParam,
    preloadedImageSources,
    profileAssetsLoading,
    preloadProfileAssets,
  }
}
