import { computed, ref, shallowRef, watch } from "vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { loadMasterFilesCacheFirst } from "@/shared/sekai/master-loader"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap, buildCatalogUnitColorMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import {
  normalizeAreaItemLevels,
  normalizeCharacterRankBonuses,
  normalizeMysekaiGateLevels,
  type AreaItemLevelMaster,
  type CharacterRankBonusMaster,
  type MysekaiGateLevelMaster,
} from "@/modules/training/lib/power-bonus"

export const TRAINING_POWER_SUITE_KEYS = [
  "userAreas",
  "userCharacters",
  "userMysekaiGates",
  "userMysekaiFixtureGameCharacterPerformanceBonuses",
] as const

export const TRAINING_POWER_MASTER_FILES = [
  "areaItems",
  "areaItemLevels",
  "characterRanks",
  "gameCharacters",
  "gameCharacterUnits",
  "mysekaiGateLevels",
] as const

/**
 * Orchestrates the power-bonus page's data: the selected account's suite
 * snapshot plus the area-item/character-rank masterdata for that account's
 * server (region follows the account, not the catalog region setting).
 */
export function useTrainingPower() {
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_POWER_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())
  const areaItemLevels = shallowRef<AreaItemLevelMaster[]>([])
  const characterRanks = shallowRef<CharacterRankBonusMaster[]>([])
  const mysekaiGateLevels = shallowRef<MysekaiGateLevelMaster[]>([])

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      characterMap.value = new Map()
      unitColorMap.value = new Map()
      areaItemLevels.value = []
      characterRanks.value = []
      mysekaiGateLevels.value = []
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await loadMasterFilesCacheFirst({
        region: targetRegion,
        files: TRAINING_POWER_MASTER_FILES,
        ensure: () => sekaiDataStore.ensureRegionData(targetRegion, {
          files: TRAINING_POWER_MASTER_FILES,
          musicMetas: false,
        }),
        isCurrent: () => token === loadToken,
        apply: (files) => {
          characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
          unitColorMap.value = buildCatalogUnitColorMap(files.gameCharacterUnits)
          areaItemLevels.value = normalizeAreaItemLevels(files.areaItemLevels)
          characterRanks.value = normalizeCharacterRankBonuses(files.characterRanks)
          mysekaiGateLevels.value = normalizeMysekaiGateLevels(files.mysekaiGateLevels)
          masterLoading.value = false
        },
      })
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
    characterMap,
    unitColorMap,
    areaItemLevels,
    characterRanks,
    mysekaiGateLevels,
    reloadMaster,
  }
}
