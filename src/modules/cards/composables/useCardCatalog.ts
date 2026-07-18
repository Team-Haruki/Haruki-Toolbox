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
import type { SekaiRegion } from "@/types"
import { buildCardSupplyTypeMap } from "@/modules/cards/lib/card-filter"

export const CARD_CATALOG_MASTER_FILES = [
  "cards",
  "cardSupplies",
  "skills",
  "gameCharacters",
  "gameCharacterUnits",
  "events",
  "eventCards",
] as const

export function useCardCatalog() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const cards = shallowRef<CatalogMasterCard[]>([])
  const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
  const unitColorMap = shallowRef<Map<SekaiUnit, string>>(new Map())
  const supplyTypeMap = shallowRef<Map<number, string>>(new Map())
  const rawSkills = shallowRef<unknown>(null)
  const rawEvents = shallowRef<unknown>(null)
  const rawEventCards = shallowRef<unknown>(null)
  const rawCards = shallowRef<unknown>(null)

  const region = computed<SekaiRegion>(() => settingsStore.sekaiCatalogRegion)
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  let loadToken = 0

  async function load(targetRegion: SekaiRegion) {
    const token = ++loadToken
    loading.value = true
    error.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: CARD_CATALOG_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, CARD_CATALOG_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      const cardRecords = files.cards
      rawCards.value = cardRecords ?? null
      cards.value = normalizeCatalogRecords(cardRecords)
        .map(normalizeCatalogMasterCard)
        .filter((card): card is CatalogMasterCard => card != null)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      unitColorMap.value = buildCatalogUnitColorMap(files.gameCharacterUnits)
      supplyTypeMap.value = buildCardSupplyTypeMap(files.cardSupplies)
      rawSkills.value = files.skills ?? null
      rawEvents.value = files.events ?? null
      rawEventCards.value = files.eventCards ?? null
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

  watch(region, (nextRegion) => {
    void load(nextRegion)
  }, { immediate: true })

  return {
    loading,
    error,
    region,
    assetEndpoint,
    cards,
    characterMap,
    unitColorMap,
    supplyTypeMap,
    rawCards,
    rawSkills,
    rawEvents,
    rawEventCards,
    reload,
    setRegion,
  }
}
