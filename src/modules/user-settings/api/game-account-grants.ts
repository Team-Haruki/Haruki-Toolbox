import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import { encodePathSegment } from "@/core/http/url"
import { translate } from "@/shared/i18n"
import {
  type UnknownRecord,
  readString,
} from "@/lib/record-utils"
import {
  normalizeGameAccountDataGrant,
  readGameAccountDataGrantMutation,
} from "@/modules/user-settings/lib/game-account-grants"
import type {
  APIResponse,
  GameAccountDataGrantListResponse,
  GameAccountDataGrantMutationResponse,
  GameAccountGrantDataType,
  SekaiRegion,
} from "@/types"

const grantsBase = (toolboxUserId: string) =>
  buildUserApiPath(toolboxUserId, "game-account-grants")

function grantPath(
  toolboxUserId: string,
  server: SekaiRegion,
  gameUserId: string,
  dataType: GameAccountGrantDataType,
  granteeUserId: string
) {
  return `${grantsBase(toolboxUserId)}/${encodePathSegment(server)}/${encodePathSegment(gameUserId)}/${encodePathSegment(dataType)}/${encodePathSegment(granteeUserId)}`
}

function readGrantList(updatedData: UnknownRecord, fallbackUserId: string): GameAccountDataGrantListResponse {
  const items = Array.isArray(updatedData.items)
    ? updatedData.items
        .map((item) => (item && typeof item === "object" && !Array.isArray(item) ? item as UnknownRecord : null))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => normalizeGameAccountDataGrant(item))
    : []
  return {
    generatedAt: readString(updatedData, ["generatedAt", "generated_at"]),
    total: Number(updatedData.total ?? items.length),
    items: items.map((item) => ({
      ...item,
      ownerUserId: item.ownerUserId || fallbackUserId,
    })),
  }
}

export async function getOwnedGameAccountDataGrants(toolboxUserId: string): Promise<GameAccountDataGrantListResponse> {
  const res = await request<APIResponse<UnknownRecord>>(grantsBase(toolboxUserId), { method: "GET" })
  const updatedData = unwrapUpdatedData(res, translate("userSettings.gameBinding.grants.toast.loadFailedTitle"))
  return readGrantList(updatedData, toolboxUserId)
}

export async function getReceivedGameAccountDataGrants(toolboxUserId: string): Promise<GameAccountDataGrantListResponse> {
  const res = await request<APIResponse<UnknownRecord>>(`${grantsBase(toolboxUserId)}/received`, { method: "GET" })
  const updatedData = unwrapUpdatedData(res, translate("userSettings.gameBinding.grants.toast.loadFailedTitle"))
  return readGrantList(updatedData, toolboxUserId)
}

export async function upsertGameAccountDataGrant(
  toolboxUserId: string,
  server: SekaiRegion,
  gameUserId: string,
  dataType: GameAccountGrantDataType,
  granteeUserId: string,
  expiresAt: string
): Promise<GameAccountDataGrantMutationResponse> {
  const res = await request<APIResponse<UnknownRecord>>(
    grantPath(toolboxUserId, server, gameUserId, dataType, granteeUserId),
    { method: "PUT", data: { expiresAt } }
  )
  const updatedData = unwrapUpdatedData(res, translate("userSettings.gameBinding.grants.toast.saveFailedTitle"))
  return {
    generatedAt: readString(updatedData, ["generatedAt", "generated_at"]),
    grant: readGameAccountDataGrantMutation(updatedData),
  }
}

export function deleteGameAccountDataGrant(
  toolboxUserId: string,
  server: SekaiRegion,
  gameUserId: string,
  dataType: GameAccountGrantDataType,
  granteeUserId: string
) {
  return request(grantPath(toolboxUserId, server, gameUserId, dataType, granteeUserId), { method: "DELETE" })
}
