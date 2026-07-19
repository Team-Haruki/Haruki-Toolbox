import { computed, ref, shallowRef, watch, type Ref } from "vue"
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
import type { SekaiRegion } from "@/types"

export const CARD_BOX_MASTER_FILES = [
  "cards",
  "gameCharacters",
  "gameCharacterUnits",
] as const

/**
 * Masterdata loader for the card box page. Unlike `useCardCatalog`, the region
 * is driven by the selected game account's server (not the catalog region
 * setting) and reloads whenever the account changes.
 */
export function useCardBoxCatalog(region: Ref<SekaiRegion | null>) {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const cards = shallowRef<CatalogMasterCard[]>([])
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())

  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  let loadToken = 0

  async function load(targetRegion: SekaiRegion | null) {
    const token = ++loadToken
    if (targetRegion == null) {
      loading.value = false
      error.value = null
      cards.value = []
      characterMap.value = new Map()
      unitColorMap.value = new Map()
      return
    }

    loading.value = true
    error.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: CARD_BOX_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, CARD_BOX_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      cards.value = normalizeCatalogRecords(files.cards)
        .map(normalizeCatalogMasterCard)
        .filter((card): card is CatalogMasterCard => card != null)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      unitColorMap.value = buildCatalogUnitColorMap(files.gameCharacterUnits)
    } catch (loadError) {
      if (token === loadToken) {
        error.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
    } finally {
      if (token === loadToken) {
        loading.value = false
      }
    }
  }

  function reload() {
    void load(region.value)
  }

  watch(region, (nextRegion) => {
    void load(nextRegion)
  }, { immediate: true })

  return {
    loading,
    error,
    assetEndpoint,
    cards,
    characterMap,
    unitColorMap,
    reload,
  }
}
