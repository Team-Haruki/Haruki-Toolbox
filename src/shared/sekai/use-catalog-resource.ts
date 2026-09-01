import { computed, ref, shallowRef, watch, type ComputedRef, type Ref, type ShallowRef } from "vue"
import type { SekaiRegion } from "@/types"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSekaiCatalogStore, type CatalogResourceBuilder } from "@/shared/sekai/catalog-store"

export type UseCatalogResourceOptions = {
  musicMetas?: boolean
  /** Files that may be absent for some regions; they resolve to `[]`. */
  optional?: readonly string[]
  /** When false the resource is not loaded (e.g. detail extras for a missing id). */
  enabled?: Ref<boolean>
}

export type CatalogResource<T> = {
  data: ShallowRef<T | null>
  /** True while the first load for the current region is in flight (no data yet). */
  loading: Ref<boolean>
  /** True during any load, including background refreshes that keep stale data visible. */
  refreshing: Ref<boolean>
  error: Ref<string | null>
  /** Non-fatal: the remote version check failed and cached data is shown. */
  warning: Ref<string | null>
  ready: ComputedRef<boolean>
  reload: () => Promise<void>
}

/**
 * Reactive wrapper around `useSekaiCatalogStore().getResource`: loads the
 * built value for the current catalog region, reloads when the region or its
 * master version changes, and keeps stale data on screen while refreshing.
 *
 * `key` is a contract (see the store): declare each key once, next to its
 * files and builder, and import that declaration everywhere it is needed.
 */
export function useCatalogResource<T>(
  region: Ref<SekaiRegion>,
  key: string,
  files: readonly string[],
  build: CatalogResourceBuilder<T>,
  options: UseCatalogResourceOptions = {},
): CatalogResource<T> {
  const catalogStore = useSekaiCatalogStore()
  const sekaiDataStore = useSekaiDataStore()

  const data = shallowRef<T | null>(catalogStore.peek<T>(region.value, key))
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  let loadToken = 0
  let loadedRegion: SekaiRegion | null = data.value ? region.value : null

  async function load(force = false) {
    if (options.enabled && !options.enabled.value) {
      return
    }
    const targetRegion = region.value
    const token = ++loadToken
    if (loadedRegion !== targetRegion) {
      // Region switch: stale data belongs to another server.
      data.value = catalogStore.peek<T>(targetRegion, key)
      loadedRegion = data.value ? targetRegion : null
    }
    loading.value = data.value == null
    refreshing.value = true
    error.value = null
    try {
      const result = await catalogStore.getResource<T>(targetRegion, key, files, build, {
        force,
        musicMetas: options.musicMetas,
        optional: options.optional,
      })
      if (token !== loadToken) {
        return
      }
      data.value = result.value
      warning.value = result.warning
      loadedRegion = targetRegion
    } catch (loadError) {
      if (token !== loadToken) {
        return
      }
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
      if (loadedRegion !== targetRegion) {
        data.value = null
      }
    } finally {
      if (token === loadToken) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  watch(
    () => [
      region.value,
      sekaiDataStore.regionStates[region.value]?.masterFetchVersion ?? null,
      options.enabled?.value ?? true,
    ] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  return {
    data,
    loading,
    refreshing,
    error,
    warning,
    ready: computed(() => data.value != null && !loading.value),
    reload: () => load(true),
  }
}
