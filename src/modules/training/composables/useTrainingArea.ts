import { computed, ref, shallowRef, watch } from "vue"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap, buildCatalogUnitColorMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import {
  normalizeAreaItemLevels,
  normalizeAreaItems,
  normalizeAreaShopItems,
  normalizeAreaShopResourceBoxDetails,
  type AreaItemLevelMaster,
  type AreaItemMaster,
  type AreaShopItem,
  type AreaShopResourceBoxDetail,
} from "../lib/area-items"

export const TRAINING_AREA_SUITE_KEYS = [
  "userAreas",
  "userMaterials",
  "userGamedata",
] as const

export const TRAINING_AREA_MASTER_FILES = [
  "areaItems",
  "areaItemLevels",
  "shopItems",
  "resourceBoxDetails",
  "gameCharacters",
  "gameCharacterUnits",
] as const

/**
 * Area item page data: the selected account's suite snapshot plus the
 * masterdata for that account's server (same orchestration pattern as
 * usePlayerProfile).
 */
export function useTrainingArea() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_AREA_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const areaItems = shallowRef<AreaItemMaster[]>([])
  const areaItemLevels = shallowRef<AreaItemLevelMaster[]>([])
  const shopItems = shallowRef<AreaShopItem[]>([])
  const shopDetails = shallowRef<AreaShopResourceBoxDetail[]>([])
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())

  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      areaItems.value = []
      areaItemLevels.value = []
      shopItems.value = []
      shopDetails.value = []
      characterMap.value = new Map()
      unitColorMap.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: TRAINING_AREA_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, TRAINING_AREA_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      areaItems.value = normalizeAreaItems(files.areaItems)
      areaItemLevels.value = normalizeAreaItemLevels(files.areaItemLevels)
      shopItems.value = normalizeAreaShopItems(files.shopItems)
      shopDetails.value = normalizeAreaShopResourceBoxDetails(files.resourceBoxDetails)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      unitColorMap.value = buildCatalogUnitColorMap(files.gameCharacterUnits)
    } catch (loadError) {
      if (token === loadToken) {
        masterError.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
    } finally {
      if (token === loadToken) {
        masterLoading.value = false
      }
    }
  }

  function reloadMaster() {
    void loadMaster(accountRegion.value)
  }

  watch(accountRegion, (nextRegion) => {
    void loadMaster(nextRegion)
  }, { immediate: true })

  return {
    selectedAccount,
    accountRegion,
    suiteStatus: suite.status,
    suiteData: suite.data,
    uploadTime: suite.uploadTime,
    suiteError: suite.error,
    reloadSuite: suite.reload,
    masterLoading,
    masterError,
    assetEndpoint,
    areaItems,
    areaItemLevels,
    shopItems,
    shopDetails,
    characterMap,
    unitColorMap,
    reloadMaster,
  }
}
