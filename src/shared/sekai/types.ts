import type { SekaiRegion } from "@/types"

export type SekaiAssetEndpointPreference = "china" | "global" | "china_cdn"

export type SekaiMasterVersionInfo = {
  dataVersion: string
  cdnVersion: string | null
  /** Registry manifest digest of the whole file set; the cache key when present. */
  contentHash: string | null
  /** Normalized file name (no `.json`) → sha256 of its current bytes. */
  files: Record<string, string>
}

export type SekaiMasterCacheState = {
  repo: string
  dataVersion: string
  displayVersion: string
  fetchVersion: string
  cdnVersion: string | null
  files: string[]
  updatedAt: number
}

export type SekaiMusicMetasCacheState = {
  url: string
  pairedMasterDisplayVersion: string | null
  etag: string | null
  lastModified: string | null
  contentLength: string | null
  updatedAt: number
}

export type SekaiRegionCacheMeta = {
  region: SekaiRegion
  master: SekaiMasterCacheState | null
  musicMetas: SekaiMusicMetasCacheState | null
}

export type SekaiMasterFileRecord<T = unknown> = {
  key: string
  region: SekaiRegion
  version: string
  name: string
  data: T
  updatedAt: number
}

export type SekaiMusicMetasRecord<T = unknown> = {
  key: string
  region: SekaiRegion
  data: T
  url: string
  pairedMasterDisplayVersion: string | null
  etag: string | null
  lastModified: string | null
  contentLength: string | null
  updatedAt: number
}
