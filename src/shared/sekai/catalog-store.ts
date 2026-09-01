import { defineStore } from "pinia"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { normalizeSekaiMasterFileName } from "@/shared/sekai/data-sources"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

export type CatalogResourceBuilder<T> = (files: Record<string, unknown>) => T

export type CatalogResourceOptions = {
  /** Re-check the remote version and rebuild even when a cached value exists. */
  force?: boolean
  /** Also ensure the region's music_metas (only music pages need it). */
  musicMetas?: boolean
}

type CacheEntry = {
  version: string
  value: unknown
}

/**
 * In-memory layer over the IndexedDB master cache for catalog pages.
 *
 * Each catalog page derives compact, normalized structures (card indexes,
 * event lists, gacha maps…) from raw master files. Rebuilding them on every
 * mount meant re-reading tens of megabytes from IndexedDB for a list→detail
 * →list round trip. The store keeps one built value per
 * `region : masterFetchVersion : key`, dedupes concurrent builds, and drops
 * a region's entries when its master version moves on. Raw files are never
 * retained here — builders are expected to keep only what the pages render.
 */
export const useSekaiCatalogStore = defineStore("sekai-catalog", () => {
  const sekaiDataStore = useSekaiDataStore()
  const cache = new Map<SekaiRegion, Map<string, CacheEntry>>()
  const inflight = new Map<string, Promise<unknown>>()

  function regionCache(region: SekaiRegion): Map<string, CacheEntry> {
    let entries = cache.get(region)
    if (!entries) {
      entries = new Map()
      cache.set(region, entries)
    }
    return entries
  }

  function currentVersion(region: SekaiRegion): string {
    return sekaiDataStore.regionStates[region]?.masterFetchVersion ?? ""
  }

  function evictStale(region: SekaiRegion, version: string) {
    const entries = regionCache(region)
    for (const [key, entry] of entries) {
      if (entry.version !== version) {
        entries.delete(key)
      }
    }
  }

  async function getResource<T>(
    region: SekaiRegion,
    key: string,
    files: readonly string[],
    build: CatalogResourceBuilder<T>,
    options: CatalogResourceOptions = {},
  ): Promise<T> {
    const requestedFiles = files.map(normalizeSekaiMasterFileName)
    const entries = regionCache(region)

    if (!options.force) {
      const cached = entries.get(key)
      if (cached && cached.version && cached.version === currentVersion(region)) {
        // Cheap freshness check (rate limited inside the data store); a
        // newer master version invalidates below.
        await sekaiDataStore.ensureRegionData(region, {
          files: requestedFiles,
          musicMetas: options.musicMetas ?? false,
        })
        if (cached.version === currentVersion(region) && entries.get(key) === cached) {
          return cached.value as T
        }
      }
    }

    const inflightKey = `${region}:${key}:${options.force ? "force" : "load"}`
    const pending = inflight.get(inflightKey)
    if (pending) {
      return pending as Promise<T>
    }

    const task = (async () => {
      await sekaiDataStore.ensureRegionData(region, {
        force: options.force === true,
        files: requestedFiles,
        musicMetas: options.musicMetas ?? false,
      })
      const version = currentVersion(region)
      const fresh = entries.get(key)
      if (!options.force && fresh && fresh.version === version) {
        return fresh.value as T
      }
      const fileMap = await readSekaiMasterFiles(region, requestedFiles)
      const missing = requestedFiles.filter((name) => fileMap[name] == null)
      if (missing.length > 0) {
        throw new Error(`Sekai master files missing for ${region}: ${missing.join(", ")}`)
      }
      const value = build(fileMap)
      evictStale(region, version)
      entries.set(key, { version, value })
      return value
    })()

    inflight.set(inflightKey, task)
    try {
      return await task
    } finally {
      inflight.delete(inflightKey)
    }
  }

  /** Raw master files for one-off reads (detail extras); never cached here. */
  async function readFiles(
    region: SekaiRegion,
    files: readonly string[],
    options: CatalogResourceOptions = {},
  ): Promise<Record<string, unknown>> {
    const requestedFiles = files.map(normalizeSekaiMasterFileName)
    await sekaiDataStore.ensureRegionData(region, {
      force: options.force === true,
      files: requestedFiles,
      musicMetas: options.musicMetas ?? false,
    })
    return readSekaiMasterFiles(region, requestedFiles)
  }

  function invalidate(region?: SekaiRegion, key?: string) {
    if (!region) {
      cache.clear()
      return
    }
    if (!key) {
      cache.delete(region)
      return
    }
    cache.get(region)?.delete(key)
  }

  function peek<T>(region: SekaiRegion, key: string): T | null {
    const cached = cache.get(region)?.get(key)
    return cached && cached.version === currentVersion(region) ? (cached.value as T) : null
  }

  return { getResource, readFiles, invalidate, peek }
})
