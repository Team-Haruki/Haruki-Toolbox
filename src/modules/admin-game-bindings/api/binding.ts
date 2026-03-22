import { readUpdatedItems, readUpdatedTotal, request, unwrapUpdatedData } from "@/core/http/call-api"
import { translate } from "@/shared/i18n"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import {
    type UnknownRecord,
    normalizeEntityId,
    readBoolean,
    readOptionalString,
    readRecord,
    readString,
} from "@/lib/record-utils"
import { normalizeSekaiRegion } from "@/lib/sekai-region"
import { normalizeMysekaiPermissions, normalizeSuitePermissions } from "@/lib/game-binding-permissions"
import type { EntityId } from "@/types/common"
import type {
    MysekaiDataPrivacySettings,
    SekaiRegion,
    SuiteDataPrivacySettings,
} from "@/types/store"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/game-account-bindings"

export interface GlobalGameBinding {
    id: EntityId
    server: SekaiRegion
    gameUserId: string
    userId: string
    userName?: string
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
    verified?: boolean
    createdAt?: string
}

function normalizeGlobalGameBinding(item: UnknownRecord): GlobalGameBinding | null {
    const owner = readRecord(item, ["owner"])
    const suite = readRecord(item, ["suite"])
    const mysekai = readRecord(item, ["mysekai"])

    const server = normalizeSekaiRegion(item.server)
    if (!server) return null

    const gameUserId = readString(item, ["gameUserId", "game_user_id", "userId"]).trim()
    if (!gameUserId) return null

    const ownerUserId = owner ? readString(owner, ["userId"]).trim() : ""
    const fallbackUserId = readString(item, ["toolboxUserId", "toolbox_user_id", "user_id", "userId"]).trim()
    const userId = ownerUserId || fallbackUserId
    if (!userId) return null

    const ownerName = owner ? readOptionalString(owner, ["name"]) : undefined
    const fallbackUserName = readOptionalString(item, ["userName", "user_name"])

    return {
        id: normalizeEntityId(item.id ?? item.ID),
        server,
        gameUserId,
        userId,
        userName: ownerName ?? fallbackUserName,
        suite: suite ? normalizeSuitePermissions(suite) : null,
        mysekai: mysekai ? normalizeMysekaiPermissions(mysekai) : null,
        verified: readBoolean(item, ["verified"]),
        createdAt: readOptionalString(item, ["createdAt", "created_at"]),
    }
}

// Queries

export async function getGlobalGameBindings(params?: QueryParams) {
    const res = await request<APIResponse<{ total?: number; items?: UnknownRecord[] }>>(BASE, {
        method: "GET",
        params,
    })
    const data = unwrapUpdatedData(res, translate("adminGameBindings.toast.loadFailedTitle"))
    const rawItems = readUpdatedItems(data)
    const items = rawItems
        .map((item) => normalizeGlobalGameBinding(item))
        .filter((item): item is GlobalGameBinding => item !== null)
    return { items, total: readUpdatedTotal(data) }
}

// Single-item actions

export function deleteGlobalGameBinding(server: SekaiRegion, gameUserId: string) {
    return request(`${BASE}/${encodePathSegment(server)}/${encodePathSegment(gameUserId)}`, { method: "DELETE" })
}

export function reassignGlobalGameBinding(server: SekaiRegion, gameUserId: string, targetUserId: string) {
    return request(`${BASE}/${encodePathSegment(server)}/${encodePathSegment(gameUserId)}/reassign`, {
        method: "PUT",
        data: { targetUserId },
    })
}

// Batch actions

export function batchDeleteGameBindings(items: Array<{ server: SekaiRegion; gameUserId: string }>) {
    return request(`${BASE}/batch-delete`, {
        method: "POST",
        data: { items },
    })
}

export function batchReassignGameBindings(
    items: Array<{ server: SekaiRegion; gameUserId: string; targetUserId: string }>
) {
    return request(`${BASE}/batch-reassign`, {
        method: "POST",
        data: { items },
    })
}
