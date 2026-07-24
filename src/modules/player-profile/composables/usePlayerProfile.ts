import { computed, ref, shallowRef, watch } from "vue"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter, CatalogMasterCard, SekaiUnit } from "@/shared/sekai/catalog"
import {
  buildCatalogCharacterMap,
  buildCatalogUnitColorMap,
  normalizeCatalogMasterCard,
  normalizeCatalogRecords,
} from "@/shared/sekai/catalog"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { SekaiRegion } from "@/types"

export const PLAYER_PROFILE_SUITE_KEYS = [
  "userGamedata",
  "userProfile",
  "userCards",
  "userDecks",
  "userCharacters",
  "userChallengeLiveSoloResults",
  "userChallengeLiveSoloStages",
  "userMusicResults",
] as const

export const PLAYER_PROFILE_MULTI_LIVE_KEYS = ["userMultiLiveTopScoreCount"] as const

export const PLAYER_PROFILE_MASTER_FILES = [
  "cards",
  "gameCharacters",
  "gameCharacterUnits",
] as const

/**
 * Orchestrates the profile page's data: the selected account's suite snapshot
 * plus the masterdata for that account's server (region follows the account,
 * not the catalog region setting).
 */
export function usePlayerProfile() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const { selectedAccount } = useGameAccountSelection()
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  const suite = useUserSuite(PLAYER_PROFILE_SUITE_KEYS, selectedAccount)

  // Fetched separately so instances whose backend allowlist lacks the key
  // only lose the MVP/SuperStar chips instead of the whole profile.
  const multiLiveSuite = useUserSuite(PLAYER_PROFILE_MULTI_LIVE_KEYS, selectedAccount)

  const masterLoading = ref(false)
  const masterError = ref<string | null>(null)
  const cardMap = shallowRef<Map<number, CatalogMasterCard>>(new Map())
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())

  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  let loadToken = 0

  async function loadMaster(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      masterLoading.value = false
      masterError.value = null
      cardMap.value = new Map()
      characterMap.value = new Map()
      unitColorMap.value = new Map()
      return
    }

    masterLoading.value = true
    masterError.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: PLAYER_PROFILE_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, PLAYER_PROFILE_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      const nextCardMap = new Map<number, CatalogMasterCard>()
      for (const record of normalizeCatalogRecords(files.cards)) {
        const card = normalizeCatalogMasterCard(record)
        if (card != null) {
          nextCardMap.set(card.id, card)
        }
      }

      cardMap.value = nextCardMap
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
    multiLiveStatus: multiLiveSuite.status,
    multiLiveData: multiLiveSuite.data,
    reloadMultiLive: multiLiveSuite.reload,
    masterLoading,
    masterError,
    assetEndpoint,
    cardMap,
    characterMap,
    unitColorMap,
    reloadMaster,
  }
}
