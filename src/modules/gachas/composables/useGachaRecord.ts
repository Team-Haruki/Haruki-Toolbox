import { ref, shallowRef, watch, type Ref, type ShallowRef } from "vue"
import type { SekaiRegion } from "@/types"
import { normalizeCatalogNumber, normalizeCatalogRecords } from "@/shared/sekai/catalog"
import { useSekaiCatalogStore } from "@/shared/sekai/catalog-store"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { normalizeCatalogGacha, type CatalogGacha } from "@/modules/gachas/lib/gacha-catalog"

export type GachaRecordResource = {
  data: ShallowRef<CatalogGacha | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

/**
 * The full record (pool weights, behaviors, information text) of ONE gacha,
 * read from the raw `gachas.json` through the catalog store's raw-file LRU —
 * the list index only keeps summaries, and the raw array is already in
 * memory right after the index was built.
 */
export function useGachaRecord(region: Ref<SekaiRegion>, gachaId: Ref<number | null>): GachaRecordResource {
  const catalogStore = useSekaiCatalogStore()
  const sekaiDataStore = useSekaiDataStore()

  const data = shallowRef<CatalogGacha | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let token = 0

  async function load(): Promise<void> {
    const id = gachaId.value
    const targetRegion = region.value
    const current = ++token
    if (id == null) {
      data.value = null
      loading.value = false
      error.value = null
      return
    }
    if (data.value?.id !== id) {
      data.value = null
    }
    loading.value = true
    error.value = null
    try {
      const files = await catalogStore.readFiles(targetRegion, ["gachas"])
      if (current !== token) {
        return
      }
      const record = normalizeCatalogRecords(files.gachas).find((row) => normalizeCatalogNumber(row.id) === id)
      data.value = record ? normalizeCatalogGacha(record) : null
    } catch (loadError) {
      if (current !== token) {
        return
      }
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
      data.value = null
    } finally {
      if (current === token) {
        loading.value = false
      }
    }
  }

  watch(
    () => [
      region.value,
      gachaId.value,
      sekaiDataStore.regionStates[region.value]?.masterFetchVersion ?? null,
    ] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  return { data, loading, error, reload: load }
}
