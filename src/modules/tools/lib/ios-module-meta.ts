import { isSekaiRegion, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import type { SekaiRegion } from "@/types/store"

export type ClientSoftware = "surge" | "shadowrocket" | "loon" | "qx" | "stash"
export type EndpointType = "direct" | "cdn"
export type UploadMode = "proxy" | "script"
export type RegionType = SekaiRegion
export type IOSUploadDataType = "suite" | "mysekai" | "mysekai_force" | "mysekai_birthday_party"

export interface Option {
  value: string
}

export interface DataTypeOption extends Option {}

export const CHUNK_SIZE_MIN = 1
export const CHUNK_SIZE_MAX = 10

export const IOS_DATA_TYPE_SET = new Set<string>(["suite", "mysekai", "mysekai_force", "mysekai_birthday_party"])
const MYSEKAI_TYPES = new Set<IOSUploadDataType>(["mysekai", "mysekai_force", "mysekai_birthday_party"])

export const SOFTWARE_OPTIONS: Option[] = [
  { value: "surge" },
  { value: "shadowrocket" },
  { value: "loon" },
  { value: "qx" },
  { value: "stash" },
]

export const ENDPOINT_OPTIONS: Option[] = [
  { value: "direct" },
  { value: "cdn" },
]

export const UPLOAD_MODE_OPTIONS: Option[] = [
  { value: "proxy" },
  { value: "script" },
]

export const REGION_OPTIONS: Option[] = SEKAI_REGION_OPTIONS.map(({ value }) => ({ value }))

export const IOS_DATA_TYPE_OPTIONS: DataTypeOption[] = [
  { value: "suite" },
  { value: "mysekai" },
  { value: "mysekai_force" },
  { value: "mysekai_birthday_party" },
]

export const IOS_MODULE_EXTENSION_MAP: Record<ClientSoftware, string> = {
  surge: "sgmodule",
  shadowrocket: "sgmodule",
  loon: "lnplugin",
  qx: "conf",
  stash: "stoverride",
}

export const IOS_URI_SCHEMES: Record<ClientSoftware, (url: string) => string> = {
  shadowrocket: (url) => `shadowrocket://install?module=${encodeURIComponent(url)}`,
  surge: (url) => `surge:///install-module?url=${encodeURIComponent(url)}`,
  qx: (url) => `quantumult-x:///add-resource?remote-resource={"rewrite_remote":["${encodeURIComponent(url)}"]}`,
  loon: (url) => `loon://import?plugin=${encodeURIComponent(url)}`,
  stash: (url) => `https://link.stash.ws/install-override/${url.replace(/^https?:\/\//, "")}`,
}

export function isIOSUploadDataType(value: unknown): value is IOSUploadDataType {
  return typeof value === "string" && IOS_DATA_TYPE_SET.has(value)
}

export function isMySekaiUploadType(value: IOSUploadDataType): boolean {
  return MYSEKAI_TYPES.has(value)
}

export function normalizeChunkSize(value: number) {
  if (!Number.isFinite(value)) {
    return CHUNK_SIZE_MIN
  }

  const intValue = Math.floor(value)
  if (intValue < CHUNK_SIZE_MIN) return CHUNK_SIZE_MIN
  if (intValue > CHUNK_SIZE_MAX) return CHUNK_SIZE_MAX

  return intValue
}

export function isRegionType(value: unknown): value is RegionType {
  return isSekaiRegion(value)
}
