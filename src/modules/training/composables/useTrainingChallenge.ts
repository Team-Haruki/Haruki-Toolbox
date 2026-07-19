import { computed, ref, shallowRef, watch } from "vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { buildCatalogCharacterMap } from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"
import {
  buildChallengeBoxRewardMap,
  normalizeChallengeRewardMasters,
  type ChallengeBoxReward,
  type ChallengeRewardMaster,
} from "@/modules/training/lib/challenge-live"

export const TRAINING_CHALLENGE_SUITE_KEYS = [
  "userChallengeLiveSoloResults",
  "userChallengeLiveSoloStages",
  "userChallengeLiveSoloHighScoreRewards",
] as const

export const TRAINING_CHALLENGE_MASTER_FILES = [
  "challengeLiveHighScoreRewards",
  "resourceBoxDetails",
  "gameCharacters",
] as const

/**
 * Orchestrates the challenge page's data: the selected account's suite
 * snapshot plus the challenge masterdata for that account's server (region
 * follows the account, not the catalog region setting).
 */
export function useTrainingChallenge() {
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(TRAINING_CHALLENGE_SUITE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const rewardMasters = shallowRef<ChallengeRewardMaster[]>([])
  const boxRewards = shallowRef<Map<number, ChallengeBoxReward>>(new Map())

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      characterMap.value = new Map()
      rewardMasters.value = []
      boxRewards.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: TRAINING_CHALLENGE_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, TRAINING_CHALLENGE_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      rewardMasters.value = normalizeChallengeRewardMasters(files.challengeLiveHighScoreRewards)
      boxRewards.value = buildChallengeBoxRewardMap(files.resourceBoxDetails)
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
    rewardMasters,
    boxRewards,
    reloadMaster,
  }
}
