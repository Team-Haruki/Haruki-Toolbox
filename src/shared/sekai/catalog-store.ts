import { defineStore } from "pinia"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { normalizeSekaiMasterFileName } from "@/shared/sekai/data-sources"
import { SEKAI_DATA_OPTIONAL_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

export type CatalogResourceBuilder<T> = (files: Record<string, unknown>) => T

export type CatalogResourceOptions = {
  /** Re-check the remote version and rebuild even when a cached value exists. */
  force?: boolean
  /** Also ensure the region's music_metas (only music pages need it). */
  musicMetas?: boolean
  /**
   * Files that may be absent for this region; a 404 stores `[]` (the worker
   * is told they are optional for this request) and a missing record never
   * fails the resource. Files in SEKAI_DATA_OPTIONAL_MASTER_FILES are always
   * treated as optional.
   */
  optional?: readonly string[]
}

export type CatalogResourceResult<T> = {
  value: T
  /** Non-fatal problem (remote check failed, cached data served). */
  warning: string | null
}

type CacheEntry = {
  version: string
  value: unknown
  touchedAt: number
}

type RawFileEntry = {
  key: string
  data: unknown
  touchedAt: number
}

const GLOBAL_OPTIONAL_FILES = new Set<string>(SEKAI_DATA_OPTIONAL_MASTER_FILES)

/** Built catalogs are kept for at most this many regions (LRU by access). */
const MAX_CACHED_REGIONS = 2

/**
 * Raw master arrays kept in memory after an IndexedDB read. cards.json and
 * gachas.json are tens of megabytes deserialized; a list→detail→list round
 * trip must not re-read them. Sized by device memory.
 */
function rawCacheLimit(): number {
  const memory = typeof navigator !== "undefined"
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    : undefined
  // Detail pages read a handful of small files next to one big one; the
  // limit must leave room for both so the big array is not flushed by them.
  return memory != null && memory <= 4 ? 5 : 10
}

/**
 * In-memory layer over the IndexedDB master cache for catalog pages.
 *
 * Catalog pages derive compact, normalized structures (card indexes, event
 * lists, gacha summaries…) from raw master files. Rebuilding them on every
 * mount meant re-reading tens of megabytes from IndexedDB for a list→detail
 * →list round trip. The store keeps one built value per
 * `region : masterFetchVersion : key`, dedupes concurrent builds, drops a
 * region's entries when its master version moves on, and keeps a small LRU
 * of raw arrays so detail pages reading the same big file stay cheap.
 *
 * Resource keys are a contract: each key maps to exactly one (files, build)
 * pair declared once in the owning module; two callers sharing a key share
 * the value.
 */
export const useSekaiCatalogStore = defineStore("sekai-catalog", () => {
  const sekaiDataStore = useSekaiDataStore()
  const cache = new Map<SekaiRegion, Map<string, CacheEntry>>()
  const inflight = new Map<string, Promise<CatalogResourceResult<unknown>>>()
  const rawFiles = new Map<string, RawFileEntry>()
  const rawInflight = new Map<string, Promise<unknown>>()
  const regionTouch = new Map<SekaiRegion, number>()
  let clock = 0

  function tick(): number {
    clock += 1
    return clock
  }

  function regionCache(region: SekaiRegion): Map<string, CacheEntry> {
    let entries = cache.get(region)
    if (!entries) {
      entries = new Map()
      cache.set(region, entries)
    }
    regionTouch.set(region, tick())
    // Keep built catalogs for a couple of regions only.
    while (cache.size > MAX_CACHED_REGIONS) {
      let oldest: SekaiRegion | null = null
      let oldestTouch = Number.POSITIVE_INFINITY
      for (const cachedRegion of cache.keys()) {
        const touched = regionTouch.get(cachedRegion) ?? 0
        if (cachedRegion !== region && touched < oldestTouch) {
          oldest = cachedRegion
          oldestTouch = touched
        }
      }
      if (oldest == null) {
        break
      }
      cache.delete(oldest)
      regionTouch.delete(oldest)
      for (const rawKey of [...rawFiles.keys()]) {
        if (rawKey.startsWith(`${oldest}:`)) {
          rawFiles.delete(rawKey)
        }
      }
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
    for (const [rawKey, entry] of rawFiles) {
      if (rawKey.startsWith(`${region}:`) && !entry.key.startsWith(`${region}:${version}:`)) {
        rawFiles.delete(rawKey)
      }
    }
  }

  function isOptional(fileName: string, optional: ReadonlySet<string>): boolean {
    return GLOBAL_OPTIONAL_FILES.has(fileName) || optional.has(fileName)
  }

  /**
   * Reads files through the raw LRU. Missing files are absent from the
   * result (callers decide whether that is fatal).
   */
  async function readRawFiles(
    region: SekaiRegion,
    version: string,
    files: readonly string[],
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    const toRead: string[] = []
    for (const fileName of files) {
      const rawKey = `${region}:${version}:${fileName}`
      const cached = rawFiles.get(rawKey)
      if (cached) {
        cached.touchedAt = tick()
        result[fileName] = cached.data
      } else {
        toRead.push(fileName)
      }
    }

    if (toRead.length > 0) {
      const reads = toRead.map(async (fileName) => {
        const rawKey = `${region}:${version}:${fileName}`
        let pending = rawInflight.get(rawKey)
        if (!pending) {
          pending = readSekaiMasterFiles(region, [fileName], version)
            .then((map) => map[fileName])
            .finally(() => {
              rawInflight.delete(rawKey)
            })
          rawInflight.set(rawKey, pending)
        }
        const data = await pending
        if (data != null) {
          result[fileName] = data
          rememberRawFile(rawKey, data)
        }
      })
      await Promise.all(reads)
    }

    return result
  }

  function rememberRawFile(rawKey: string, data: unknown) {
    rawFiles.set(rawKey, { key: rawKey, data, touchedAt: tick() })
    const limit = rawCacheLimit()
    while (rawFiles.size > limit) {
      let oldestKey: string | null = null
      let oldestTouch = Number.POSITIVE_INFINITY
      for (const [key, entry] of rawFiles) {
        if (entry.touchedAt < oldestTouch) {
          oldestKey = key
          oldestTouch = entry.touchedAt
        }
      }
      if (oldestKey == null) {
        break
      }
      rawFiles.delete(oldestKey)
    }
  }

  /**
   * Ensures the region cache covers `files`. A failed remote check (WAF
   * challenge, offline) is downgraded to a warning when IndexedDB already
   * holds every required file for a known version.
   */
  async function ensureFiles(
    region: SekaiRegion,
    files: readonly string[],
    required: readonly string[],
    options: CatalogResourceOptions,
  ): Promise<string | null> {
    try {
      await sekaiDataStore.ensureRegionData(region, {
        force: options.force === true,
        files,
        optionalFiles: (options.optional ?? []).map(normalizeSekaiMasterFileName),
        musicMetas: options.musicMetas ?? false,
      })
      return null
    } catch (ensureError) {
      const state = sekaiDataStore.regionStates[region]
      const cachedFiles = new Set(state?.files ?? [])
      if (state?.masterFetchVersion && required.every((fileName) => cachedFiles.has(fileName))) {
        return ensureError instanceof Error ? ensureError.message : String(ensureError)
      }
      throw ensureError
    }
  }

  async function loadFileMap(
    region: SekaiRegion,
    files: readonly string[],
    options: CatalogResourceOptions,
  ): Promise<{ version: string; files: Record<string, unknown>; warning: string | null }> {
    const optional = new Set((options.optional ?? []).map(normalizeSekaiMasterFileName))
    const required = files.filter((fileName) => !isOptional(fileName, optional))

    let warning = await ensureFiles(region, files, required, options)
    let version = currentVersion(region)
    if (!version) {
      throw new Error(`Sekai master data unavailable for ${region}`)
    }

    let fileMap = await readRawFiles(region, version, files)
    let missing = required.filter((fileName) => fileMap[fileName] == null)
    if (missing.length > 0) {
      // Meta says the file exists but the record is gone (storage eviction):
      // one forced repair, then give up.
      await sekaiDataStore.ensureRegionData(region, {
        force: true,
        files: missing,
        musicMetas: false,
      })
      version = currentVersion(region)
      fileMap = await readRawFiles(region, version, files)
      missing = required.filter((fileName) => fileMap[fileName] == null)
      if (missing.length > 0) {
        throw new Error(`Sekai master files missing for ${region}: ${missing.join(", ")}`)
      }
      warning = null
    }

    for (const fileName of files) {
      if (fileMap[fileName] == null) {
        fileMap[fileName] = []
      }
    }

    return { version, files: fileMap, warning }
  }

  /**
   * Serves the cached build when it is still current after a cheap freshness
   * check (rate limited inside the data store). A failed check keeps serving
   * the cached value; a newer master version returns null so the caller
   * rebuilds.
   */
  async function serveCachedResource<T>(
    region: SekaiRegion,
    key: string,
    requestedFiles: readonly string[],
    options: CatalogResourceOptions,
  ): Promise<CatalogResourceResult<T> | null> {
    const entries = regionCache(region)
    const cached = entries.get(key)
    if (!cached?.version || cached.version !== currentVersion(region)) {
      return null
    }
    let warning: string | null = null
    try {
      await sekaiDataStore.ensureRegionData(region, {
        files: requestedFiles,
        optionalFiles: (options.optional ?? []).map(normalizeSekaiMasterFileName),
        musicMetas: options.musicMetas ?? false,
      })
    } catch (ensureError) {
      warning = ensureError instanceof Error ? ensureError.message : String(ensureError)
    }
    if (cached.version !== currentVersion(region) || entries.get(key) !== cached) {
      return null
    }
    cached.touchedAt = tick()
    return { value: cached.value as T, warning }
  }

  async function getResource<T>(
    region: SekaiRegion,
    key: string,
    files: readonly string[],
    build: CatalogResourceBuilder<T>,
    options: CatalogResourceOptions = {},
  ): Promise<CatalogResourceResult<T>> {
    const requestedFiles = files.map(normalizeSekaiMasterFileName)
    const entries = regionCache(region)

    if (!options.force) {
      const served = await serveCachedResource<T>(region, key, requestedFiles, options)
      if (served) {
        return served
      }
    }

    const inflightKey = `${region}:${key}:${options.force ? "force" : "load"}`
    const pending = inflight.get(inflightKey)
    if (pending) {
      return pending as Promise<CatalogResourceResult<T>>
    }

    const task = (async (): Promise<CatalogResourceResult<T>> => {
      const loaded = await loadFileMap(region, requestedFiles, options)
      const fresh = entries.get(key)
      if (!options.force && fresh && fresh.version === loaded.version) {
        fresh.touchedAt = tick()
        return { value: fresh.value as T, warning: loaded.warning }
      }
      const value = build(loaded.files)
      evictStale(region, loaded.version)
      entries.set(key, { version: loaded.version, value, touchedAt: tick() })
      return { value, warning: loaded.warning }
    })()

    inflight.set(inflightKey, task)
    try {
      return await task
    } finally {
      inflight.delete(inflightKey)
    }
  }

  /**
   * Raw master files for one-off reads (a single gacha's details, a card's
   * episodes). Served through the raw LRU; the arrays themselves are never
   * retained as a built resource.
   */
  async function readFiles(
    region: SekaiRegion,
    files: readonly string[],
    options: CatalogResourceOptions = {},
  ): Promise<Record<string, unknown>> {
    const requestedFiles = files.map(normalizeSekaiMasterFileName)
    const loaded = await loadFileMap(region, requestedFiles, options)
    return loaded.files
  }

  function invalidate(region?: SekaiRegion, key?: string) {
    if (!region) {
      cache.clear()
      rawFiles.clear()
      regionTouch.clear()
      return
    }
    if (!key) {
      cache.delete(region)
      regionTouch.delete(region)
      for (const rawKey of [...rawFiles.keys()]) {
        if (rawKey.startsWith(`${region}:`)) {
          rawFiles.delete(rawKey)
        }
      }
      return
    }
    cache.get(region)?.delete(key)
  }

  function peek<T>(region: SekaiRegion, key: string): T | null {
    const cached = cache.get(region)?.get(key)
    if (cached && cached.version === currentVersion(region)) {
      cached.touchedAt = tick()
      return cached.value as T
    }
    return null
  }

  return { getResource, readFiles, invalidate, peek }
})
