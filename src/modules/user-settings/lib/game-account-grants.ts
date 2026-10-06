import {
  type UnknownRecord,
  readRecord,
  readString,
  readStringArray,
} from "@/lib/record-utils"
import type {
  GameAccountDataGrant,
  GameAccountGrantDataType,
  GameAccountGrantPermission,
  SekaiRegion,
} from "@/types"
import { SEKAI_REGIONS } from "@/lib/sekai-region"

const GRANT_DATA_TYPES = new Set<string>(["suite", "mysekai", "profile"])
const REGION_SET = new Set<string>(SEKAI_REGIONS)

/** Canonical order the backend also uses; every permissions array we emit or render follows it. */
export const GRANT_PERMISSIONS: readonly GameAccountGrantPermission[] = ["read", "write"]
const GRANT_PERMISSION_SET = new Set<string>(GRANT_PERMISSIONS)

/** Only read-only grants can be created for profile data: it is live, per-request game data. */
export const WRITE_GRANTABLE_DATA_TYPES: readonly GameAccountGrantDataType[] = ["suite", "mysekai"]

export function isGrantDataType(value: unknown): value is GameAccountGrantDataType {
  return typeof value === "string" && GRANT_DATA_TYPES.has(value)
}

export function isGrantServer(value: unknown): value is SekaiRegion {
  return typeof value === "string" && REGION_SET.has(value)
}

export function isGrantPermission(value: unknown): value is GameAccountGrantPermission {
  return typeof value === "string" && GRANT_PERMISSION_SET.has(value)
}

export function normalizeGrantDataType(value: unknown): GameAccountGrantDataType {
  return isGrantDataType(value) ? value : "suite"
}

export function normalizeGrantServer(value: unknown): SekaiRegion {
  return isGrantServer(value) ? value : "jp"
}

export function canGrantWrite(dataType: GameAccountGrantDataType): boolean {
  return WRITE_GRANTABLE_DATA_TYPES.includes(dataType)
}

/**
 * Deduplicates, drops unknown values and sorts read-before-write. A missing or
 * empty list is the legacy backend shape, whose grants were all read-only.
 */
export function normalizeGrantPermissions(value: unknown): GameAccountGrantPermission[] {
  const raw = Array.isArray(value) ? value : []
  const present = new Set(raw.filter(isGrantPermission))
  const normalized = GRANT_PERMISSIONS.filter((permission) => present.has(permission))
  return normalized.length > 0 ? normalized : ["read"]
}

export function buildGrantPermissions(canRead: boolean, canWrite: boolean): GameAccountGrantPermission[] {
  const permissions: GameAccountGrantPermission[] = []
  if (canRead) permissions.push("read")
  if (canWrite) permissions.push("write")
  return permissions
}

export function normalizeGameAccountDataGrant(raw: UnknownRecord): GameAccountDataGrant {
  return {
    id: Number(raw.id ?? 0),
    ownerUserId: readString(raw, ["ownerUserId", "owner_user_id"]),
    granteeUserId: readString(raw, ["granteeUserId", "grantee_user_id"]),
    server: normalizeGrantServer(raw.server),
    gameUserId: readString(raw, ["gameUserId", "game_user_id"]),
    dataType: normalizeGrantDataType(raw.dataType ?? raw.data_type),
    permissions: normalizeGrantPermissions(readStringArray(raw, ["permissions"])),
    expiresAt: readString(raw, ["expiresAt", "expires_at"]),
    createdAt: readString(raw, ["createdAt", "created_at"]),
    updatedAt: readString(raw, ["updatedAt", "updated_at"]),
  }
}

export function readGameAccountDataGrantMutation(raw: UnknownRecord): GameAccountDataGrant {
  const grant = readRecord(raw, ["grant"])
  return normalizeGameAccountDataGrant(grant ?? raw)
}

export function isFutureIsoDateTime(value: string, now = new Date()): boolean {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime()
}
