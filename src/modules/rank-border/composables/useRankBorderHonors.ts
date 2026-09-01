import { computed, shallowRef, type ComputedRef, type Ref } from "vue"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import type { useRankBorderMasterData } from "./useRankBorderMasterData"
import type {
  RankBorderMasterBondsHonor,
  RankBorderMasterBondsHonorWord,
  RankBorderMasterCard,
  RankBorderMasterGameCharacterUnit,
  RankBorderMasterHonor,
  RankBorderMasterHonorGroup,
} from "../lib/master-data-types"
import type { HonorVisualContext } from "../lib/honor-visuals"
import { normalizeTrackerEndpoint } from "../lib/rank-border"

/**
 * Thin state shell around the pure honor/leader visual resolvers in
 * `../lib/honor-visuals`. It only assembles the resolver context (master maps
 * + region + asset endpoint) and owns the lazy profile-asset load; everything
 * that used to be computed per render lives in memoized view-models now.
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
  masterData: ReturnType<typeof useRankBorderMasterData>
}

export function isLocalMockTrackerEndpoint(endpoint: string) {
  const normalized = normalizeTrackerEndpoint(endpoint)
  return normalized === "http://127.0.0.1:18777" || normalized === "http://localhost:18777"
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
    masterData,
  } = deps
  const settingsStore = useSettingsStore()

  const profileAssetsLoading = shallowRef(false)

  const honorContext = computed<HonorVisualContext>(() => ({
    cardById: cardById.value,
    honorById: honorById.value,
    honorGroupById: honorGroupById.value,
    bondsHonorById: bondsHonorById.value,
    bondsHonorWordById: bondsHonorWordById.value,
    gameCharacterUnitById: gameCharacterUnitById.value,
    region: selectedRegion.value,
    assetEndpoint: settingsStore.currentAssetEndpoint,
    localMockAssets: isLocalMockTrackerEndpoint(trackerEndpoint.value),
  }))

  function preloadProfileAssets() {
    if (profileAssetsLoading.value) {
      return
    }

    if (cardById.value.size > 0 && honorById.value.size > 0 && honorGroupById.value.size > 0) {
      return
    }

    profileAssetsLoading.value = true
    void masterData.loadProfileAssets(false).finally(() => {
      profileAssetsLoading.value = false
    })
  }

  return {
    honorContext,
    profileAssetsLoading,
    preloadProfileAssets,
  }
}
