import { request } from "@/api/call-api"
import type { } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/game-account-bindings"

export interface GlobalGameBinding {
    id: number | string
    server: string
    gameUserId: string
    userId: string
    userName?: string
    suite?: {
        allowPublicApi: boolean
        allowSakura: boolean
        allow8823: boolean
        allowResona: boolean
        allowLuna: boolean
    } | null
    mysekai?: {
        allowPublicApi: boolean
        allowFixtureApi: boolean
        allow8823: boolean
        allowResona: boolean
        allowLuna: boolean
    } | null
    verified?: boolean
    createdAt?: string
}

// ===== 查询 =====

export async function getGlobalGameBindings(params?: Record<string, string | number>) {
    const res = await request<APIResponse<{ total?: number; items?: Array<Record<string, unknown>> }>>(`${BASE}/`, {
        method: "GET",
        params,
    })
    const data = res.updatedData
    const rawItems = data?.items ?? []
    const items: GlobalGameBinding[] = rawItems.map(item => {
        const owner = item.owner as Record<string, unknown> | undefined
        const suite = item.suite as Record<string, unknown> | undefined
        const mysekai = item.mysekai as Record<string, unknown> | undefined

        return {
            id: (item.id ?? item.ID ?? '') as number | string,
            server: (item.server ?? '') as string,
            gameUserId: (item.gameUserId ?? item.game_user_id ?? item.userId ?? '') as string,
            userId: (owner?.userId ?? item.toolboxUserId ?? item.toolbox_user_id ?? item.user_id ?? item.userId ?? '') as string,
            userName: (owner?.name ?? item.userName ?? item.user_name ?? '') as string,
            suite: suite ? {
                allowPublicApi: !!suite.allowPublicApi,
                allowSakura: !!suite.allowSakura,
                allow8823: !!suite.allow8823,
                allowResona: !!suite.allowResona,
                allowLuna: !!suite.allowLuna,
            } : null,
            mysekai: mysekai ? {
                allowPublicApi: !!mysekai.allowPublicApi,
                allowFixtureApi: !!mysekai.allowFixtureApi,
                allow8823: !!mysekai.allow8823,
                allowResona: !!mysekai.allowResona,
                allowLuna: !!mysekai.allowLuna,
            } : null,
            verified: !!item.verified,
            createdAt: (item.createdAt ?? item.created_at ?? '') as string,
        }
    })
    return { items, total: data?.total ?? 0 }
}

// ===== 单条操作 =====

export function deleteGlobalGameBinding(server: string, gameUserId: string) {
    return request(`${BASE}/${server}/${gameUserId}`, { method: "DELETE" })
}

export function reassignGlobalGameBinding(server: string, gameUserId: string, targetUserId: string) {
    return request(`${BASE}/${server}/${gameUserId}/reassign`, {
        method: "PUT",
        data: { targetUserId },
    })
}

// ===== 批量操作 =====

export function batchDeleteGameBindings(items: Array<{ server: string; gameUserId: string }>) {
    return request(`${BASE}/batch-delete`, {
        method: "POST",
        data: { items },
    })
}

export function batchReassignGameBindings(
    items: Array<{ server: string; gameUserId: string; targetUserId: string }>
) {
    return request(`${BASE}/batch-reassign`, {
        method: "POST",
        data: { items },
    })
}
