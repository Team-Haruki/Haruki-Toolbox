import { request } from "@/api/call-api"
import type { UserActivity, PaginatedResponse } from "@/types/admin"

/**
 * 用户操作日志 (用户侧)
 * GET /api/user/:toolbox_user_id/activity-logs/
 */
export function getUserActivityLogs(userId: string, params?: Record<string, string | number>) {
    return request<PaginatedResponse<UserActivity>>(`/api/user/${userId}/activity-logs/`, {
        method: "GET",
        params,
    })
}
