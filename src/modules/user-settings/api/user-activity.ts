import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { QueryParams } from "@/core/http/query"
import type { UserActivity, PaginatedResponse } from "@/types/admin"

/**
 * User-side activity logs.
 * GET /api/user/:toolbox_user_id/activity-logs/
 */
export function getUserActivityLogs(userId: string, params?: QueryParams) {
    return request<PaginatedResponse<UserActivity>>(`${buildUserApiPath(userId, "activity-logs")}/`, {
        method: "GET",
        params,
    })
}
