import { computed, ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { resolveProfileHonorViews, type HonorVisualContext } from "@/modules/rank-border/lib/honor-visuals"
import {
  buildMasterRecordMap,
  type RankBorderMasterBondsHonor,
  type RankBorderMasterBondsHonorWord,
  type RankBorderMasterGameCharacterUnit,
  type RankBorderMasterHonor,
  type RankBorderMasterHonorGroup,
  type RankBorderMasterHonorBackground,
  type RankBorderMasterHonorWord,
} from "@/modules/rank-border/lib/master-data-types"
import { normalizeProfileHonors } from "@/modules/rank-border/lib/rank-border"
import type { RankBorderHonorView } from "@/modules/rank-border/lib/rank-border-types"

const PROFILE_CUSTOMIZATION_FILES = ["honorBackgrounds", "honorWords"] as const

export const PROFILE_HONOR_MASTER_FILES = [
  "honors",
  "honorGroups",
  "bondsHonors",
  "bondsHonorWords",
  "gameCharacterUnits",
  ...PROFILE_CUSTOMIZATION_FILES,
] as const

/**
 * Draws the player's three profile honors with the shared badge renderer.
 * The honor master tables are loaded lazily for the account's region; while
 * they are missing the list is empty rather than a row of broken badges.
 */
export function useProfileHonors(
  region: Ref<SekaiRegion | null>,
  rawHonors: Ref<unknown>,
  assetEndpoint: Ref<string>,
) {
  const sekaiDataStore = useSekaiDataStore()

  const honorById = shallowRef<Map<number, RankBorderMasterHonor>>(new Map())
  const honorGroupById = shallowRef<Map<number, RankBorderMasterHonorGroup>>(new Map())
  const honorBackgroundById = shallowRef<Map<number, RankBorderMasterHonorBackground>>(new Map())
  const honorWordById = shallowRef<Map<number, RankBorderMasterHonorWord>>(new Map())
  const bondsHonorById = shallowRef<Map<number, RankBorderMasterBondsHonor>>(new Map())
  const bondsHonorWordById = shallowRef<Map<number, RankBorderMasterBondsHonorWord>>(new Map())
  const gameCharacterUnitById = shallowRef<Map<number, RankBorderMasterGameCharacterUnit>>(new Map())
  const loading = ref(false)

  let loadToken = 0

  async function load(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    // Do not display maps from the previous account region while reloading.
    honorById.value = new Map()
    honorGroupById.value = new Map()
    honorBackgroundById.value = new Map()
    honorWordById.value = new Map()
    bondsHonorById.value = new Map()
    bondsHonorWordById.value = new Map()
    gameCharacterUnitById.value = new Map()
    if (targetRegion == null) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, {
        files: PROFILE_HONOR_MASTER_FILES,
        optionalFiles: PROFILE_CUSTOMIZATION_FILES,
        musicMetas: false,
      })
      const files = await readSekaiMasterFiles(targetRegion, PROFILE_HONOR_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      honorById.value = buildMasterRecordMap(asRecords<RankBorderMasterHonor>(files.honors))
      honorGroupById.value = buildMasterRecordMap(asRecords<RankBorderMasterHonorGroup>(files.honorGroups))
      honorBackgroundById.value = buildMasterRecordMap(asRecords<RankBorderMasterHonorBackground>(files.honorBackgrounds))
      honorWordById.value = buildMasterRecordMap(asRecords<RankBorderMasterHonorWord>(files.honorWords))
      bondsHonorById.value = buildMasterRecordMap(asRecords<RankBorderMasterBondsHonor>(files.bondsHonors))
      bondsHonorWordById.value = buildMasterRecordMap(asRecords<RankBorderMasterBondsHonorWord>(files.bondsHonorWords))
      gameCharacterUnitById.value = buildMasterRecordMap(asRecords<RankBorderMasterGameCharacterUnit>(files.gameCharacterUnits))
    } catch {
      // Honors are decoration on the profile header; a failed master load
      // simply leaves the row empty.
    } finally {
      if (token === loadToken) {
        loading.value = false
      }
    }
  }

  watch(region, (nextRegion) => {
    void load(nextRegion)
  }, { immediate: true })

  const honorViews = computed<RankBorderHonorView[]>(() => {
    const targetRegion = region.value
    if (targetRegion == null || honorById.value.size === 0) {
      return []
    }

    const honors = normalizeProfileHonors(rawHonors.value)
    if (honors.length === 0) {
      return []
    }

    const ctx: HonorVisualContext = {
      cardById: new Map(),
      honorById: honorById.value,
      honorGroupById: honorGroupById.value,
      honorBackgroundById: honorBackgroundById.value,
      honorWordById: honorWordById.value,
      bondsHonorById: bondsHonorById.value,
      bondsHonorWordById: bondsHonorWordById.value,
      gameCharacterUnitById: gameCharacterUnitById.value,
      region: targetRegion,
      assetEndpoint: assetEndpoint.value,
      localMockAssets: false,
    }
    return resolveProfileHonorViews(honors, ctx, 3, "player-profile")
  })

  return {
    honorViews,
    loading,
    reload: () => load(region.value),
  }
}

function asRecords<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
