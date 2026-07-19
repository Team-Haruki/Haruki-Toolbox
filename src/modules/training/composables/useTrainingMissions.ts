import { computed, ref, shallowRef, watch } from "vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import {
  extractCharacterLevels,
  normalizeCharacterMissionMasters,
  normalizeCharacterMissionParameterGroups,
  type CharacterLevelRow,
  type CharacterMissionMaster,
  type CharacterMissionParameterGroupRow,
} from "../lib/character-missions"

export const TRAINING_MISSIONS_SUITE_KEYS = [
  "userCharacters",
  "userCharacterMissionV2s",
  "userCharacterMissionV2Statuses",
] as const

export const TRAINING_MISSIONS_MASTER_FILES = [
  "characterMissionV2s",
  "characterMissionV2ParameterGroups",
  "levels",
  "gameCharacters",
] as const

/** Character mission page data (same orchestration pattern as usePlayerProfile). */
export function useTrainingMissions() {
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_MISSIONS_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const missionMasters = shallowRef<CharacterMissionMaster[]>([])
  const parameterGroups = shallowRef<CharacterMissionParameterGroupRow[]>([])
  const characterLevels = shallowRef<CharacterLevelRow[]>([])
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      missionMasters.value = []
      parameterGroups.value = []
      characterLevels.value = []
      characterMap.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: TRAINING_MISSIONS_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, TRAINING_MISSIONS_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      missionMasters.value = normalizeCharacterMissionMasters(files.characterMissionV2s)
      parameterGroups.value = normalizeCharacterMissionParameterGroups(files.characterMissionV2ParameterGroups)
      characterLevels.value = extractCharacterLevels(files.levels)
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
    missionMasters,
    parameterGroups,
    characterLevels,
    characterMap,
    reloadMaster,
  }
}
