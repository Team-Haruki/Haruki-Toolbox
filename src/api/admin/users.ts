import { request } from "@/api/call-api"
import type {
    AdminUser,
    AdminUserDetail,
    UserActivityResponse,
    PaginatedResponse,
    BatchOperationRequest,
    ResetPasswordRequest,
    AdminGameAccountBinding,
    UserSocialPlatform,
    AuthorizedSocialPlatform,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/users"

// ===== 用户基础 =====

export async function getUsers(params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<AdminUser>>>(`${BASE}/`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export async function getUserDetail(userId: string) {
    const res = await request<APIResponse<AdminUserDetail>>(`${BASE}/${userId}/detail`, { method: "GET" })
    return res.updatedData!
}

export async function getUserActivity(userId: string, params?: Record<string, string | number>) {
    const res = await request<APIResponse<UserActivityResponse>>(`${BASE}/${userId}/activity`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export function banUser(userId: string, reason?: string) {
    return request(`${BASE}/${userId}/ban`, {
        method: "PUT",
        data: reason ? { reason } : undefined,
    })
}

export function unbanUser(userId: string) {
    return request(`${BASE}/${userId}/unban`, { method: "PUT" })
}

export function forceLogout(userId: string) {
    return request(`${BASE}/${userId}/force-logout`, { method: "POST" })
}

export async function getUserRole(userId: string) {
    const res = await request<APIResponse<{ role: string }>>(`${BASE}/${userId}/role`, { method: "GET" })
    return res.updatedData!
}

export function updateUserRole(userId: string, role: string) {
    return request(`${BASE}/${userId}/role`, {
        method: "PUT",
        data: { role },
    })
}

// ===== 批量操作 =====

export function batchBan(data: BatchOperationRequest) {
    return request(`${BASE}/batch-ban`, { method: "POST", data })
}

export function batchUnban(data: Pick<BatchOperationRequest, 'userIds'>) {
    return request(`${BASE}/batch-unban`, { method: "POST", data })
}

export function batchForceLogout(data: Pick<BatchOperationRequest, 'userIds'>) {
    return request(`${BASE}/batch-force-logout`, { method: "POST", data })
}

export function batchRole(data: { userIds: string[]; role: string }) {
    return request(`${BASE}/batch-role`, { method: "POST", data })
}

export function batchAllowCNMysekai(data: { userIds: string[]; allowCNMysekai: boolean }) {
    return request(`${BASE}/batch-allow-cn-mysekai`, { method: "POST", data })
}

// ===== 用户生命周期 =====

export function deleteUser(userId: string) {
    return request(`${BASE}/${userId}`, { method: "DELETE" })
}

export function restoreUser(userId: string) {
    return request(`${BASE}/${userId}/restore`, { method: "POST" })
}

export function resetPassword(userId: string, data?: ResetPasswordRequest) {
    return request(`${BASE}/${userId}/reset-password`, {
        method: "POST",
        data,
    })
}

export function updateUserEmail(userId: string, email: string) {
    return request(`${BASE}/${userId}/email`, {
        method: "PUT",
        data: { email },
    })
}

// ===== OAuth 授权 =====

export function getUserOAuthAuthorizations(userId: string) {
    return request(`${BASE}/${userId}/oauth-authorizations`, { method: "GET" })
}

export function revokeUserOAuth(userId: string) {
    return request(`${BASE}/${userId}/revoke-oauth`, { method: "POST" })
}

// ===== 游戏绑定 =====

export async function getGameAccountBindings(userId: string) {
    const res = await request<APIResponse<{ total?: number; items?: Array<Record<string, unknown>> }>>(
        `${BASE}/${userId}/game-account-bindings`, { method: "GET" }
    )
    const data = res.updatedData
    const items = data?.items ?? (Array.isArray(data) ? data : [])
    return items.map(item => ({
        server: item.server as AdminGameAccountBinding['server'],
        gameUserId: (item.gameUserId ?? item.game_user_id ?? item.userId ?? '') as string,
        suite: item.suite ?? null,
        mysekai: item.mysekai ?? null,
    })) as AdminGameAccountBinding[]
}

export function updateGameAccountBinding(
    userId: string,
    server: string,
    gameUserId: string,
    options: {
        suite?: { allowPublicApi: boolean; allowSakura: boolean; allow8823: boolean; allowResona: boolean; allowLuna: boolean } | null;
        mysekai?: { allowPublicApi: boolean; allowFixtureApi: boolean; allow8823: boolean; allowResona: boolean; allowLuna: boolean } | null;
    }
) {
    const data: Record<string, unknown> = {}
    if (options.suite) data.suite = options.suite
    if (options.mysekai) data.mysekai = options.mysekai
    return request(`${BASE}/${userId}/game-account-bindings/${server}/${gameUserId}`, {
        method: "PUT",
        data,
    })
}

export function updateAllowCNMysekai(userId: string, allow: boolean) {
    return request(`${BASE}/${userId}/allow-cn-mysekai`, {
        method: "PUT",
        data: { allowCNMysekai: allow },
    })
}

export function deleteGameAccountBinding(userId: string, server: string, gameUserId: string) {
    return request(`${BASE}/${userId}/game-account-bindings/${server}/${gameUserId}`, {
        method: "DELETE",
    })
}

// ===== 社交平台 =====

export async function getSocialPlatform(userId: string) {
    const res = await request<APIResponse<{ socialPlatform?: UserSocialPlatform | null }>>(`${BASE}/${userId}/social-platform`, { method: "GET" })
    return res.updatedData?.socialPlatform ?? null
}

export function updateSocialPlatform(
    userId: string,
    data: { platform: string; userId: string; verified?: boolean }
) {
    return request(`${BASE}/${userId}/social-platform`, {
        method: "PUT",
        data,
    })
}

export function deleteSocialPlatform(userId: string) {
    return request(`${BASE}/${userId}/social-platform`, { method: "DELETE" })
}

// ===== 授权社交平台 =====

export async function getAuthorizedSocialPlatforms(userId: string) {
    const res = await request<APIResponse<{ total?: number; items?: AuthorizedSocialPlatform[] }>>(
        `${BASE}/${userId}/authorized-social-platforms`, { method: "GET" }
    )
    const data = res.updatedData
    return data?.items ?? (Array.isArray(data) ? data : [])
}

export function updateAuthorizedSocialPlatform(
    userId: string,
    platformId: string,
    data: { platform: string; userId: string; comment?: string }
) {
    return request(`${BASE}/${userId}/authorized-social-platforms/${platformId}`, {
        method: "PUT",
        data,
    })
}

export function deleteAuthorizedSocialPlatform(userId: string, platformId: string) {
    return request(`${BASE}/${userId}/authorized-social-platforms/${platformId}`, {
        method: "DELETE",
    })
}

// ===== iOS 上传码 =====

export async function regenerateIOSUploadCode(userId: string) {
    const res = await request<APIResponse<Record<string, unknown>>>(`${BASE}/${userId}/ios-upload-code/regenerate`, { method: "POST" })
    const data = res.updatedData
    const code = data?.uploadCode ?? data?.upload_code
    return code ? { uploadCode: String(code) } : null
}

export function deleteIOSUploadCode(userId: string) {
    return request(`${BASE}/${userId}/ios-upload-code`, { method: "DELETE" })
}
