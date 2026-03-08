import { request } from "@/api/call-api"
import type { AdminFriendLink, AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/content"

// ===== 友情链接 =====

export async function getFriendLinks() {
    const res = await request<APIResponse<{ items: AdminFriendLink[] }>>(`${BASE}/friend-links/`, { method: "GET" })
    return res.updatedData?.items ?? []
}

export function createFriendLink(data: Omit<AdminFriendLink, 'id'>) {
    return request(`${BASE}/friend-links/`, { method: "POST", data })
}

export function updateFriendLink(id: string, data: Partial<AdminFriendLink>) {
    return request(`${BASE}/friend-links/${id}`, { method: "PUT", data })
}

export function deleteFriendLink(id: string) {
    return request(`${BASE}/friend-links/${id}`, { method: "DELETE" })
}

// ===== 推荐群聊 =====

export async function getFriendGroups() {
    const res = await request<APIResponse<{ items: AdminFriendGroup[] }>>(`${BASE}/friend-groups/`, { method: "GET" })
    return res.updatedData?.items ?? []
}

export function createFriendGroup(data: Omit<AdminFriendGroup, 'id' | 'groupList'>) {
    return request(`${BASE}/friend-groups/`, { method: "POST", data })
}

export function deleteFriendGroup(groupId: string) {
    return request(`${BASE}/friend-groups/${groupId}`, { method: "DELETE" })
}

// ===== 推荐群聊项 =====

export function createFriendGroupItem(groupId: string, data: Omit<AdminFriendGroupItem, 'id'>) {
    return request(`${BASE}/friend-groups/${groupId}/items`, { method: "POST", data })
}

export function updateFriendGroupItem(groupId: string, itemId: string, data: Partial<AdminFriendGroupItem>) {
    return request(`${BASE}/friend-groups/${groupId}/items/${itemId}`, { method: "PUT", data })
}

export function deleteFriendGroupItem(groupId: string, itemId: string) {
    return request(`${BASE}/friend-groups/${groupId}/items/${itemId}`, { method: "DELETE" })
}
