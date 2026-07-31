import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  resolveDefaultCostumePartIds,
  type CostumeDefaultPartIds,
} from "@/modules/costumes/lib/costume-options"
import { resolveCardCostumeGroups, type CardCostumeGroup } from "../lib/card-detail"

/**
 * Costume master files are heavyweight (costume3ds is tens of MB), so they are
 * loaded on demand for the detail page instead of via the shared card catalog.
 */
const CARD_COSTUME_MASTER_FILES = ["cardCostume3ds", "costume3ds"] as const

export function useCardCostumes(
  region: Ref<SekaiRegion>,
  cardId: Ref<number | null>,
  characterId?: Ref<number | null>,
) {
  const sekaiDataStore = useSekaiDataStore()
  const groups = ref<CardCostumeGroup[]>([])
  /** Stock head/hair for the card's character, for completing a 3D recipe. */
  const defaults = ref<CostumeDefaultPartIds | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])

  let loadToken = 0

  watch(
    () => [region.value, cardId.value, characterId?.value, regionState.value.masterFetchVersion] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load() {
    const targetCardId = cardId.value
    if (targetCardId == null) {
      groups.value = []
      defaults.value = null
      return
    }

    const token = ++loadToken
    loading.value = true
    error.value = null
    try {
      if (!CARD_COSTUME_MASTER_FILES.every((fileName) => regionState.value.files.includes(fileName))) {
        await sekaiDataStore.ensureRegionData(region.value, { files: CARD_COSTUME_MASTER_FILES })
      }
      const files = await readSekaiMasterFiles(region.value, CARD_COSTUME_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      groups.value = resolveCardCostumeGroups(files.cardCostume3ds, files.costume3ds, targetCardId)
      defaults.value = characterId?.value != null
        ? resolveDefaultCostumePartIds(files.costume3ds, characterId.value)
        : null
    } catch (loadError) {
      if (token === loadToken) {
        groups.value = []
        defaults.value = null
        error.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
    } finally {
      if (token === loadToken) {
        loading.value = false
      }
    }
  }

  return {
    groups,
    defaults,
    loading,
    error,
    reload: load,
  }
}
