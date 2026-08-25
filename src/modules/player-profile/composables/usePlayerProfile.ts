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
import { fetchDeckRecommendProfileWithCache } from "@/modules/deck-recommend/lib/user-data"
import { useUserStore } from "@/shared/stores/user"
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

export const PLAYER_PROFILE_SNAPSHOT_EXTRA_KEYS = [
  "userCards",
  "userChallengeLiveSoloResults",
  "userChallengeLiveSoloStages",
] as const

export const PLAYER_PROFILE_EVENT_KEYS = ["userEvents", "userHonors"] as const

export const PLAYER_PROFILE_MASTER_FILES = [
  "cards",
  "gameCharacters",
  "gameCharacterUnits",
] as const

export const PLAYER_PROFILE_SOURCES = ["realtime", "snapshot"] as const

export type PlayerProfileSource = (typeof PLAYER_PROFILE_SOURCES)[number]

/**
 * Orchestrates the profile page's data: the selected account's suite snapshot
 * plus the masterdata for that account's server (region follows the account,
 * not the catalog region setting).
 */
export function usePlayerProfile() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()
  const userStore = useUserStore()

  const { selectedAccount } = useGameAccountSelection({ capability: "profile" })
  const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

  // Realtime game profile is the default; the suite snapshot (manual upload)
  // remains available as an alternative source.
  const dataSource = ref<PlayerProfileSource>("realtime")

  // Suite requests are gated on the snapshot source so switching to realtime
  // does not keep fetching the (potentially large) suite subset.
  const suiteAccount = computed(() => dataSource.value === "snapshot" ? selectedAccount.value : null)
  const suite = useUserSuite(PLAYER_PROFILE_SUITE_KEYS, suiteAccount)

  // Fetched separately so instances whose backend allowlist lacks the key
  // only lose the MVP/SuperStar chips instead of the whole profile.
  const multiLiveSuite = useUserSuite(PLAYER_PROFILE_MULTI_LIVE_KEYS, suiteAccount)

  // A granted account may hold profile without suite (grants are per data
  // type), so the ancillary suite subsets below skip accounts whose suite
  // data would just 403 — their modules render empty instead of errored.
  const suiteCapableAccount = computed(() =>
    selectedAccount.value?.capabilities.has("suite") ? selectedAccount.value : null)

  // The realtime game profile only carries the single best challenge result
  // and the shown deck's five cards, but the challenge radar needs per-character
  // high scores and the collection chart the full card box. Fetch that small
  // suite subset in realtime mode so both sources render the same modules.
  const extrasAccount = computed(() => dataSource.value === "realtime" ? suiteCapableAccount.value : null)
  const extrasSuite = useUserSuite(PLAYER_PROFILE_SNAPSHOT_EXTRA_KEYS, extrasAccount)

  // Event participation history only exists in the suite snapshot, so the
  // trend module fetches it regardless of the selected data source.
  const eventsSuite = useUserSuite(PLAYER_PROFILE_EVENT_KEYS, suiteCapableAccount)

  const profileStatus = ref<"idle" | "loading" | "ready" | "error">("idle")
  const profileData = shallowRef<Record<string, unknown> | null>(null)
  const profileError = shallowRef<unknown>(null)
  const profileUpdatedAt = ref<number | null>(null)

  let profileGeneration = 0

  async function loadProfile(strategy: "prefer-cache" | "refresh" = "refresh") {
    const toolboxUserId = userStore.userId
    const target = selectedAccount.value
    if (!toolboxUserId || !target || dataSource.value !== "realtime") {
      profileGeneration += 1
      profileStatus.value = "idle"
      profileData.value = null
      profileError.value = null
      profileUpdatedAt.value = null
      return
    }

    const generation = ++profileGeneration
    profileStatus.value = "loading"
    profileError.value = null
    try {
      const result = await fetchDeckRecommendProfileWithCache({
        toolboxUserId,
        server: target.server,
        gameUserId: target.userId,
      }, { strategy })
      if (generation !== profileGeneration) {
        return
      }

      profileData.value = result.data as Record<string, unknown>
      profileUpdatedAt.value = result.cacheUpdatedAt
      profileStatus.value = "ready"
    } catch (loadError) {
      if (generation !== profileGeneration) {
        return
      }

      profileError.value = loadError
      profileStatus.value = "error"
    }
  }

  watch(
    () => [userStore.userId, selectedAccount.value?.key ?? null, dataSource.value] as const,
    () => {
      void loadProfile()
    },
    { immediate: true },
  )

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
    dataSource,
    profileStatus,
    profileData,
    profileError,
    profileUpdatedAt,
    reloadProfile: loadProfile,
    suiteStatus: suite.status,
    suiteData: suite.data,
    uploadTime: suite.uploadTime,
    suiteError: suite.error,
    reloadSuite: suite.reload,
    multiLiveStatus: multiLiveSuite.status,
    multiLiveData: multiLiveSuite.data,
    reloadMultiLive: multiLiveSuite.reload,
    extrasStatus: extrasSuite.status,
    extrasData: extrasSuite.data,
    reloadExtras: extrasSuite.reload,
    eventsStatus: eventsSuite.status,
    eventsData: eventsSuite.data,
    reloadEvents: eventsSuite.reload,
    masterLoading,
    masterError,
    assetEndpoint,
    cardMap,
    characterMap,
    unitColorMap,
    reloadMaster,
  }
}
