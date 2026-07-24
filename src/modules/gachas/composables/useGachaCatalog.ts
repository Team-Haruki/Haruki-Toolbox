import { computed, ref, shallowRef, watch } from "vue"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  buildCatalogCharacterMap,
  normalizeCatalogMasterCard,
  normalizeCatalogRecords,
} from "@/shared/sekai/catalog"
import type { SekaiRegion } from "@/types"
import type { CatalogGacha, CatalogGachaCeilItem } from "@/modules/gachas/lib/gacha-catalog"
import { normalizeCatalogGachas, normalizeGachaCeilItems } from "@/modules/gachas/lib/gacha-catalog"

export const GACHA_CATALOG_MASTER_FILES = [
  "gachas",
  "cards",
  "gachaCeilItems",
  "gameCharacters",
] as const

export function useGachaCatalog() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const gachas = shallowRef<CatalogGacha[]>([])
  const cardsById = shallowRef<Map<number, CatalogMasterCard>>(new Map())
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const ceilItemMap = shallowRef<Map<number, CatalogGachaCeilItem>>(new Map())

  const { region, selectorValue: regionSelectorValue, updateSelectorValue: updateRegionSelector } = useEffectiveCatalogRegion()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  let loadToken = 0

  async function load(targetRegion: SekaiRegion) {
    const token = ++loadToken
    loading.value = true
    error.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: GACHA_CATALOG_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, GACHA_CATALOG_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      gachas.value = normalizeCatalogGachas(files.gachas)
      const cardMap = new Map<number, CatalogMasterCard>()
      for (const record of normalizeCatalogRecords(files.cards)) {
        const card = normalizeCatalogMasterCard(record)
        if (card != null) {
          cardMap.set(card.id, card)
        }
      }

      cardsById.value = cardMap
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      ceilItemMap.value = normalizeGachaCeilItems(files.gachaCeilItems)
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

  function setRegion(nextRegion: SekaiRegion) {
    settingsStore.setSekaiCatalogRegion(nextRegion)
  }

  const cardRarityByCardId = computed<Map<number, string>>(() => {
    const map = new Map<number, string>()
    for (const card of cardsById.value.values()) {
      if (card.cardRarityType) {
        map.set(card.id, card.cardRarityType)
      }
    }

    return map
  })

  watch(region, (nextRegion) => {
    void load(nextRegion)
  }, { immediate: true })

  return {
    loading,
    error,
    region,
    regionSelectorValue,
    updateRegionSelector,
    assetEndpoint,
    gachas,
    cardsById,
    cardRarityByCardId,
    characterMap,
    ceilItemMap,
    reload,
    setRegion,
  }
}
