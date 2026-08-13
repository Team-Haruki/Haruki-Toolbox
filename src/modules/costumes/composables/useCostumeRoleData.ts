import { ref, shallowRef, watch, type Ref } from "vue"
import { resolvePjsk3dRuntimeBaseUrl } from "@/shared/sekai/data-sources"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import {
  buildRuntimeCostumeNameMap,
  listRuntimeCostumeOptions,
  resolveRoleDefaults,
  type CostumeRoleDefaults,
  type CostumeSlot,
  type RuntimeCostumeOption,
} from "../lib/costume-options"

export type CostumeRoleData = {
  options: Record<CostumeSlot, RuntimeCostumeOption[]>
  defaults: CostumeRoleDefaults | null
  /** costume3dId → display name/color, sourced from the runtime registry. */
  nameById: Map<number, { name: string; colorName: string }>
}

const BROTLI_WASM_URL = new URL(
  "../vendor/haruki-3d-engine/assets/brotli_wasm_bg-NfWIZley.wasm",
  import.meta.url,
).href

async function decodeRuntimeDocument(url: string): Promise<unknown> {
  const [{ decodeRuntimeMessagePackBrotliDirect }, response] = await Promise.all([
    import("../vendor/haruki-3d-engine/runtimeMessagePackDecodeCore-BptdOkvu.js"),
    fetch(url),
  ])
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return decodeRuntimeMessagePackBrotliDirect(await response.arrayBuffer(), BROTLI_WASM_URL)
}

const roleDataCache = new Map<string, Promise<CostumeRoleData>>()

function fetchCostumeRoleData(
  baseUrl: string,
  characterId: number,
  unit: string,
): Promise<CostumeRoleData> {
  const cacheKey = `${baseUrl}|${characterId}:${unit}`
  const cached = roleDataCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const roleBase = `${baseUrl}parts/by-role/${characterId}/${unit}/`
  const request = (async (): Promise<CostumeRoleData> => {
    const [registry, catalog] = await Promise.all([
      decodeRuntimeDocument(`${roleBase}part-registry.msgpack.br`),
      decodeRuntimeDocument(`${roleBase}runtime-role-catalog.msgpack.br`),
    ])
    return {
      options: {
        body: listRuntimeCostumeOptions(registry, characterId, "body"),
        hair: listRuntimeCostumeOptions(registry, characterId, "hair"),
        head: listRuntimeCostumeOptions(registry, characterId, "head"),
      },
      defaults: resolveRoleDefaults(catalog, characterId, unit),
      nameById: buildRuntimeCostumeNameMap(registry, characterId),
    }
  })()
  request.catch(() => {
    // Failed fetches must not be cached, or the role stays broken until reload.
    roleDataCache.delete(cacheKey)
  })
  roleDataCache.set(cacheKey, request)
  return request
}

/**
 * Loads the selectable costume parts and stock defaults of one
 * `<characterId>:<unit>` role from the deployed 3D runtime packages.
 */
export function useCostumeRoleData(
  region: Ref<SekaiRegion>,
  preference: Ref<SekaiAssetEndpointPreference>,
  characterId: Ref<number | null>,
  unit: Ref<string | null>,
) {
  const data = shallowRef<CostumeRoleData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let loadToken = 0

  async function load() {
    const targetCharacterId = characterId.value
    const targetUnit = unit.value
    const token = ++loadToken
    if (targetCharacterId == null || targetUnit == null) {
      data.value = null
      loading.value = false
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const baseUrl = resolvePjsk3dRuntimeBaseUrl(region.value, preference.value)
      const result = await fetchCostumeRoleData(baseUrl, targetCharacterId, targetUnit)
      if (token !== loadToken) {
        return
      }

      data.value = result
    } catch (loadError) {
      if (token === loadToken) {
        data.value = null
        error.value = loadError instanceof Error ? loadError.message : String(loadError)
      }
    } finally {
      if (token === loadToken) {
        loading.value = false
      }
    }
  }

  watch(
    () => [region.value, preference.value, characterId.value, unit.value] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  return { data, loading, error, reload: load }
}
