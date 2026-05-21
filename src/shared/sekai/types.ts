import type { SekaiRegion } from "@/types"

export type SekaiAssetEndpointPreference = "china" | "global"

export type SekaiMasterVersionInfo = {
  dataVersion: string
  cdnVersion: string | null
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
