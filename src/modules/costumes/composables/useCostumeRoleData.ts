import { computed, ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useSettingsStore } from "@/shared/stores/settings"
import {
  buildRuntimeCostumeNameMap,
  listRuntimeCostumeOptions,
  resolveRoleDefaults,
  type CostumeRoleDefaults,
  type CostumeSlot,
  type RuntimeCostumeOption,
} from "../lib/costume-options"
import { loadCostumeContent, loadCostumeEngine, resolveCostumeContentBaseUrl } from "../lib/costume-content"
import { indexCostumeSources, isCostumeReleased } from "../lib/costume-filters"
import type { HarukiCostumeSource, HarukiMotionEntry } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

export type CostumeRoleData = {
  options: Record<CostumeSlot, RuntimeCostumeOption[]>
  defaults: CostumeRoleDefaults | null
  /** costume3dId → display name/color, sourced from the 3D kernel's part list. */
  nameById: Map<number, { name: string; colorName: string }>
  /** The character's units; a Virtual Singer has one role (models, preset, motion) per unit. */
  units: string[]
  /** `${headCostume3dId}|${hairCostume3dId}` pairs of this unit that cannot be worn together. */
  notAvailable: Set<string>
  /** Every motion the content has, for any role (the stage's motion picker). */
  motions: HarukiMotionEntry[]
  /** head costume3dId → the hair it brings (costume3dModelDefaultHairs of this unit). */
  defaultHairs: Map<number, number>
  /** costume3dId → its source (the rack's filters); empty when the mirror's slices carry none. */
  sourceById: Map<number, HarukiCostumeSource>
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

  const request = (async (): Promise<CostumeRoleData> => {
    const [engine, content] = await Promise.all([loadCostumeEngine(), loadCostumeContent(baseUrl)])
    // The parts the kernel builds this role from (master rows checked against the AssetBundleInfo).
    const { role, parts, units, notAvailablePatterns, defaultHairs, motions, sources } = await engine.listRoleParts(
      content,
      `${characterId}:${unit}`,
    )
    const sourceById = indexCostumeSources(sources)
    // A costume the region has not released yet stays off the rack (and out of the counts) until its date.
    const now = Date.now()
    const released = (options: RuntimeCostumeOption[]) => options.filter((option) => isCostumeReleased(sourceById.get(option.id), now))
    return {
      options: {
        body: released(listRuntimeCostumeOptions(parts, characterId, "body")),
        hair: released(listRuntimeCostumeOptions(parts, characterId, "hair")),
        head: released(listRuntimeCostumeOptions(parts, characterId, "head")),
      },
      defaults: resolveRoleDefaults([role], characterId, unit),
      nameById: buildRuntimeCostumeNameMap(parts, characterId),
      units,
      notAvailable: new Set(notAvailablePatterns.map((p) => `${p.headCostume3dId}|${p.hairCostume3dId}`)),
      motions,
      defaultHairs: new Map((defaultHairs ?? []).map((pair) => [pair.headCostume3dId, pair.hairCostume3dId])),
      sourceById,
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
 * Loads the selectable costume parts and stock defaults of one `<characterId>:<unit>` role, as the 3D kernel
 * builds them from the raw-bundle mirror on the asset CDN.
 */
export function useCostumeRoleData(
  region: Ref<SekaiRegion>,
  characterId: Ref<number | null>,
  unit: Ref<string | null>,
) {
  const settingsStore = useSettingsStore()
  const baseUrl = computed(() => resolveCostumeContentBaseUrl(settingsStore.currentAssetEndpoint, region.value))
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
      const result = await fetchCostumeRoleData(baseUrl.value, targetCharacterId, targetUnit)
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
    () => [baseUrl.value, characterId.value, unit.value] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  return { data, loading, error, reload: load }
}
