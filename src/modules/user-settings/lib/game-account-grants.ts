import {
  type UnknownRecord,
  readRecord,
  readString,
} from "@/lib/record-utils"
import type {
  GameAccountDataGrant,
  GameAccountGrantDataType,
  SekaiRegion,
} from "@/types"
import { SEKAI_REGIONS } from "@/lib/sekai-region"

const GRANT_DATA_TYPES = new Set<string>(["suite", "mysekai"])
const REGION_SET = new Set<string>(SEKAI_REGIONS)

export function isGrantDataType(value: unknown): value is GameAccountGrantDataType {
  return typeof value === "string" && GRANT_DATA_TYPES.has(value)
}

export function isGrantServer(value: unknown): value is SekaiRegion {
  return typeof value === "string" && REGION_SET.has(value)
}

export function normalizeGrantDataType(value: unknown): GameAccountGrantDataType {
  return isGrantDataType(value) ? value : "suite"
}

export function normalizeGrantServer(value: unknown): SekaiRegion {
  return isGrantServer(value) ? value : "jp"
}

export function normalizeGameAccountDataGrant(raw: UnknownRecord): GameAccountDataGrant {
  return {
    id: Number(raw.id ?? 0),
    ownerUserId: readString(raw, ["ownerUserId", "owner_user_id"]),
    granteeUserId: readString(raw, ["granteeUserId", "grantee_user_id"]),
    server: normalizeGrantServer(raw.server),
    gameUserId: readString(raw, ["gameUserId", "game_user_id"]),
    dataType: normalizeGrantDataType(raw.dataType ?? raw.data_type),
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
