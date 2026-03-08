import { request } from "@/api/call-api"
import type { AdminSession } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/me"

interface SessionsResponse {
    userId: string
    total: number
    items: AdminSession[]
}

export async function getAdminSessions() {
    const res = await request<APIResponse<SessionsResponse>>(`${BASE}/sessions`, { method: "GET" })
    return res.updatedData!.items
}

export function deleteAdminSession(tokenId: string) {
    return request(`${BASE}/sessions/${tokenId}`, { method: "DELETE" })
}

export function reauthAdmin(data?: { password?: string }) {
    return request(`${BASE}/reauth`, { method: "POST", data })
}
