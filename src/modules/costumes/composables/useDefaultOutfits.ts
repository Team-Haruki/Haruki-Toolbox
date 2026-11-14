import { computed, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useSettingsStore } from "@/shared/stores/settings"
import { loadCostumeContent, loadCostumeEngine, resolveCostumeContentBaseUrl } from "../lib/costume-content"
import type { HarukiDefaultOutfit } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

const outfitCache = new Map<string, Promise<HarukiDefaultOutfit[]>>()

function fetchDefaultOutfits(baseUrl: string, characterId: number): Promise<HarukiDefaultOutfit[]> {
  const cacheKey = `${baseUrl}|${characterId}`
  const cached = outfitCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const request = (async () => {
    const [engine, content] = await Promise.all([loadCostumeEngine(), loadCostumeContent(baseUrl)])
    return engine.listDefaultOutfits(content, characterId)
  })()
  request.catch(() => {
    outfitCache.delete(cacheKey)
  })
  outfitCache.set(cacheKey, request)
  return request
}

/**
 * The default outfits other characters lend (the experimental borrowed outfit): per character, its own unit first, each
 * unit's preset body and then its other default outfits (the second default outfits). Loaded while
 * `enabled`; a character whose outfits fail to load is left out.
 */
export function useDefaultOutfits(region: Ref<SekaiRegion>, characterIds: Ref<number[]>, enabled: Ref<boolean>) {
  const settingsStore = useSettingsStore()
  const baseUrl = computed(() => resolveCostumeContentBaseUrl(settingsStore.currentAssetEndpoint, region.value))
  const outfits = shallowRef<Map<number, HarukiDefaultOutfit[]>>(new Map())
  let loadToken = 0

  watch(
    () => [baseUrl.value, characterIds.value, enabled.value] as const,
    async ([url, ids, on]) => {
      const token = ++loadToken
      if (!on) {
        return
      }
      const loaded = await Promise.all(ids.map((id) => fetchDefaultOutfits(url, id).catch(() => null)))
      if (token === loadToken) {
        outfits.value = new Map(ids.flatMap((id, index) => (loaded[index] ? [[id, loaded[index]] as const] : [])))
      }
    },
    { immediate: true },
  )

  return { outfits }
}
