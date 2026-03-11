import { encodePathSegment } from "@/core/http/url"
import { normalizeMysekaiPermissions, normalizeSuitePermissions } from "@/lib/game-binding-permissions"
import {
  type UnknownRecord,
  normalizeEntityId,
  readOptionalString,
  readString,
} from "@/lib/record-utils"
import { normalizeSekaiRegion } from "@/lib/sekai-region"
import type { AdminGameAccountBinding, AuthorizedSocialPlatform } from "@/types/admin"

export const BASE = "/api/admin/users"

export const userBase = (userId: string) => `${BASE}/${encodePathSegment(userId)}`

export interface UserOAuthAuthorization {
  clientId?: string
  clientName?: string
  scopes?: string[]
  authorizedAt?: string
}

export function normalizeGameAccountBinding(item: UnknownRecord): AdminGameAccountBinding | null {
  const server = normalizeSekaiRegion(item.server)
  if (!server) return null

  const gameUserId = readString(item, ["gameUserId", "game_user_id", "userId"]).trim()
  if (!gameUserId) return null

  return {
    server,
    gameUserId,
    suite: item.suite == null ? null : normalizeSuitePermissions(item.suite),
    mysekai: item.mysekai == null ? null : normalizeMysekaiPermissions(item.mysekai),
  }
}

export function normalizeAuthorizedSocialPlatform(item: UnknownRecord): AuthorizedSocialPlatform {
  return {
    id: normalizeEntityId(item.id ?? item.platformId),
    platform: readString(item, ["platform"]),
    userId: readString(item, ["userId", "user_id"]),
    comment: readOptionalString(item, ["comment"]),
  }
}
