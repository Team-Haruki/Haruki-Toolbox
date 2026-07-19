import { computed, ref, shallowRef, watch } from "vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import {
  normalizeCharacterMissionParameterGroups,
  type CharacterMissionParameterGroupRow,
} from "../lib/character-missions"

export const TRAINING_LEADER_SUITE_KEYS = [
  "userCharacterMissionV2s",
  "userCharacterLiveUsageCounts",
  "userCharacterMissionV2Statuses",
] as const

export const TRAINING_LEADER_MASTER_FILES = [
  "characterMissionV2ParameterGroups",
  "characterMissionV2s",
  "gameCharacters",
] as const

/** Leader statistics page data (same orchestration pattern as usePlayerProfile). */
export function useTrainingLeader() {
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_LEADER_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const parameterGroups = shallowRef<CharacterMissionParameterGroupRow[]>([])
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      parameterGroups.value = []
      characterMap.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: TRAINING_LEADER_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, TRAINING_LEADER_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      parameterGroups.value = normalizeCharacterMissionParameterGroups(files.characterMissionV2ParameterGroups)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
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
    parameterGroups,
    characterMap,
    reloadMaster,
  }
}
