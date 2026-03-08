import { request } from "@/api/call-api"
import type {
    DashboardData,
    UploadLogsResponse,
    TimeseriesResponse,
    SystemLog,
    SystemLogSummary,
    PaginatedResponse,
} from "@/types/admin"
import type { APIResponse } from "@/types/response"

const STATS_BASE = "/api/admin/statistics"
const LOGS_BASE = "/api/admin/system-logs"

// ===== 统计 =====

export async function getDashboard(params?: Record<string, string | number>) {
    const res = await request<APIResponse<DashboardData>>(`${STATS_BASE}/dashboard`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export async function getUploadLogs(params?: Record<string, string | number>) {
    const res = await request<APIResponse<UploadLogsResponse>>(`${STATS_BASE}/upload-logs`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export async function getTimeseries(params?: Record<string, string | number>) {
    const res = await request<APIResponse<TimeseriesResponse>>(`${STATS_BASE}/timeseries`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

// ===== 系统日志 =====

export async function getSystemLogs(params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<SystemLog>>>(`${LOGS_BASE}/`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export async function getSystemLogSummary() {
    const res = await request<APIResponse<SystemLogSummary>>(`${LOGS_BASE}/summary`, { method: "GET" })
    return res.updatedData!
}

export function exportSystemLogs(params?: Record<string, string | number>) {
    return request(`${LOGS_BASE}/export`, {
        method: "GET",
        params,
        responseType: "blob",
    })
}

export async function getSystemLogDetail(id: string) {
    const res = await request<APIResponse<SystemLog>>(`${LOGS_BASE}/${id}`, { method: "GET" })
    return res.updatedData!
}
