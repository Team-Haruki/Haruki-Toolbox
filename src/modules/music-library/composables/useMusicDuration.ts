import { computed, shallowRef, watch, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { buildMusicDurationMap } from "@/modules/music-library/lib/music-data"

/** musicId → seconds per `region:musicMetasUpdatedAt`; two regions at most. */
const durationCache = new Map<string, Map<number, number>>()
const DURATION_CACHE_LIMIT = 2

/**
 * Song length from the region's `music_metas` side table. `gate` must be a
 * resource loaded with `musicMetas: true` so the table is guaranteed to be
 * in IndexedDB before it is read.
 */
export function useMusicDuration(
  region: Ref<SekaiRegion>,
  musicId: Ref<number | null>,
  gate: Ref<boolean>,
): ComputedRef<number | null> {
  const sekaiDataStore = useSekaiDataStore()
  const durations = shallowRef<Map<number, number> | null>(null)
  let token = 0

  watch(
    () => [
      gate.value,
      region.value,
      sekaiDataStore.regionStates[region.value]?.musicMetasUpdatedAt ?? null,
    ] as const,
    async ([ready, targetRegion, updatedAt]) => {
      const current = ++token
      if (!ready) {
        durations.value = null
        return
      }
      const cacheKey = `${targetRegion}:${updatedAt ?? "unknown"}`
      let map = durationCache.get(cacheKey)
      if (!map) {
        let metas: unknown
        try {
          metas = await readSekaiMusicMetas(targetRegion)
        } catch {
          metas = null
        }
        if (current !== token) {
          return
        }
        map = buildMusicDurationMap(metas)
        durationCache.set(cacheKey, map)
        while (durationCache.size > DURATION_CACHE_LIMIT) {
          const oldest = durationCache.keys().next().value
          if (oldest == null) {
            break
          }
          durationCache.delete(oldest)
        }
      }
      durations.value = map
    },
    { immediate: true },
  )

  return computed(() => (musicId.value != null ? durations.value?.get(musicId.value) ?? null : null))
}
