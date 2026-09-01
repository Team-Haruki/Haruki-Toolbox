import { ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useSekaiCatalogStore } from "@/shared/sekai/catalog-store"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { resolveCardCostumeGroups, type CardCostumeGroup } from "@/modules/cards/lib/card-detail"

/**
 * Costume master files are heavyweight (costume3ds is tens of MB), so they
 * are read on demand through the catalog store's raw-file LRU (never kept as
 * a built resource) and reduced to the one card's groups.
 */
const CARD_COSTUME_MASTER_FILES = ["cardCostume3ds", "costume3ds"] as const

export function useCardCostumes(region: Ref<SekaiRegion>, cardId: Ref<number | null>) {
  const catalogStore = useSekaiCatalogStore()
  const sekaiDataStore = useSekaiDataStore()
  const groups = shallowRef<CardCostumeGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let loadToken = 0

  watch(
    () => [
      region.value,
      cardId.value,
      sekaiDataStore.regionStates[region.value]?.masterFetchVersion ?? null,
    ] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load() {
    const targetCardId = cardId.value
    const targetRegion = region.value
    if (targetCardId == null) {
      groups.value = []
      return
    }

    const token = ++loadToken
    loading.value = true
    error.value = null
    try {
      const files = await catalogStore.readFiles(targetRegion, CARD_COSTUME_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      groups.value = resolveCardCostumeGroups(files.cardCostume3ds, files.costume3ds, targetCardId)
    } catch (loadError) {
      if (token === loadToken) {
        groups.value = []
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
    loading,
    error,
    reload: load,
  }
}
