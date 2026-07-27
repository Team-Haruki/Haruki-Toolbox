import { computed, ref, shallowRef, watch } from "vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { loadMasterFilesCacheFirst } from "@/shared/sekai/master-loader"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap, buildCatalogUnitColorMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"
import {
  buildBondCharacterStyleMap,
  buildBondsRewardsByGroup,
  normalizeBondLevelTable,
  normalizeBondMasters,
  type BondCharacterStyle,
  type BondLevelTable,
  type BondMaster,
  type BondRankRewards,
} from "@/modules/training/lib/bonds"

export const TRAINING_BONDS_SUITE_KEYS = [
  "userBonds",
  "userCharacters",
] as const

export const TRAINING_BONDS_MASTER_FILES = [
  "bonds",
  "levels",
  "gameCharacters",
  "gameCharacterUnits",
  "bondsRewards",
  "resourceBoxes",
  "resourceBoxDetails",
  "materials",
] as const

/**
 * Orchestrates the bonds page's data: the selected account's suite snapshot
 * plus the bond masterdata for that account's server (region follows the
 * account, not the catalog region setting).
 */
export function useTrainingBonds() {
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_BONDS_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())
  const bondMasters = shallowRef<BondMaster[]>([])
  const bondLevelTable = shallowRef<BondLevelTable>({ totalExpByLevel: new Map(), maxLevel: 0 })
  const styleMap = shallowRef<Map<number, BondCharacterStyle>>(new Map())
  const bondsRewardsByGroup = shallowRef<Map<number, BondRankRewards[]>>(new Map())
  const materialNames = shallowRef<Map<number, string>>(new Map())

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      characterMap.value = new Map()
      unitColorMap.value = new Map()
      bondMasters.value = []
      bondLevelTable.value = { totalExpByLevel: new Map(), maxLevel: 0 }
      styleMap.value = new Map()
      bondsRewardsByGroup.value = new Map()
      materialNames.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await loadMasterFilesCacheFirst({
        region: targetRegion,
        files: TRAINING_BONDS_MASTER_FILES,
        ensure: () => sekaiDataStore.ensureRegionData(targetRegion, {
          files: TRAINING_BONDS_MASTER_FILES,
          musicMetas: false,
        }),
        isCurrent: () => token === loadToken,
        apply: (files) => {
          characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
          unitColorMap.value = buildCatalogUnitColorMap(files.gameCharacterUnits)
          bondMasters.value = normalizeBondMasters(files.bonds)
          bondLevelTable.value = normalizeBondLevelTable(files.levels)
          styleMap.value = buildBondCharacterStyleMap(files.gameCharacterUnits)
          bondsRewardsByGroup.value = buildBondsRewardsByGroup(
            files.bondsRewards,
            files.resourceBoxes,
            files.resourceBoxDetails,
          )
          const names = new Map<number, string>()
          for (const record of normalizeCatalogRecords(files.materials)) {
            const id = normalizeCatalogNumber(record.id)
            const name = normalizeCatalogString(record.name)
            if (id != null && id > 0 && name !== "") {
              names.set(id, name)
            }
          }
          materialNames.value = names
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
    bondMasters,
    bondLevelTable,
    styleMap,
    bondsRewardsByGroup,
    materialNames,
    reloadMaster,
  }
}
