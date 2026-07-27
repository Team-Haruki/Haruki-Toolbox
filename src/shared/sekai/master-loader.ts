import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles, readSekaiRegionCacheMeta } from "./cache"
import { normalizeSekaiMasterFileName } from "./data-sources"

export type MasterFilesCacheFirstInput = {
  region: SekaiRegion
  files: readonly string[]
  /** Kicks off (or joins) the region's remote check/update. */
  ensure: () => Promise<void>
  /** Return false when a newer load superseded this one; applying stops. */
  isCurrent?: () => boolean
  /**
   * Receives a complete file map keyed by normalized file name. May run
   * twice: once for the local cache, then again after a remote update.
   */
  apply: (files: Record<string, unknown>) => void
}

export type MasterFilesCacheFirstResult = {
  appliedFromCache: boolean
  refreshed: boolean
}

export type MasterFilesCacheFirstDependencies = {
  readMeta: typeof readSekaiRegionCacheMeta
  readFiles: typeof readSekaiMasterFiles
}

const defaultDependencies: MasterFilesCacheFirstDependencies = {
  readMeta: readSekaiRegionCacheMeta,
  readFiles: readSekaiMasterFiles,
}

/**
 * Stale-while-revalidate master loading: applies a complete local cache
 * immediately, then awaits the remote check and re-applies only when the
 * cached version actually changed. Once cached data has been applied, a
 * failed remote check keeps the stale data in place instead of throwing.
 */
export async function loadMasterFilesCacheFirst(
  input: MasterFilesCacheFirstInput,
  dependencies: MasterFilesCacheFirstDependencies = defaultDependencies,
): Promise<MasterFilesCacheFirstResult> {
  const isCurrent = input.isCurrent ?? (() => true)
  const requestedFiles = input.files.map(normalizeSekaiMasterFileName)
  const ensurePromise = input.ensure()
  // The rejection is consumed by the await below; this guard only prevents an
  // unhandled-rejection report if the cache probe throws first.
  ensurePromise.catch(() => {})

  let appliedFromCache = false
  let cachedVersion: string | null = null
  try {
    cachedVersion = (await dependencies.readMeta(input.region))?.master?.fetchVersion ?? null
    if (cachedVersion) {
      const cached = await dependencies.readFiles(input.region, requestedFiles, cachedVersion)
      if (isCurrent() && requestedFiles.every((fileName) => cached[fileName] != null)) {
        input.apply(cached)
        appliedFromCache = true
      }
    }
  } catch {
    // The cache probe is best-effort; the ensure path below still loads data.
  }

  try {
    await ensurePromise
  } catch (ensureError) {
    if (appliedFromCache) {
      return { appliedFromCache, refreshed: false }
    }

    throw ensureError
  }

  if (!isCurrent()) {
    return { appliedFromCache, refreshed: false }
  }

  if (appliedFromCache) {
    const freshVersion = (await dependencies.readMeta(input.region))?.master?.fetchVersion ?? null
    if (freshVersion === cachedVersion || !isCurrent()) {
      return { appliedFromCache, refreshed: false }
    }
  }

  const fresh = await dependencies.readFiles(input.region, requestedFiles)
  if (!isCurrent()) {
    return { appliedFromCache, refreshed: false }
  }

  input.apply(fresh)
  return { appliedFromCache, refreshed: true }
}
