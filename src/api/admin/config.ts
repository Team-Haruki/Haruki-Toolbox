import { request } from "@/api/call-api"
import type { PublicApiKeys, RuntimeConfig } from "@/types/admin"
import type { APIResponse } from "@/types/response"

const BASE = "/api/admin/config"

export async function getPublicApiKeys() {
    const res = await request<APIResponse<PublicApiKeys>>(`${BASE}/public-api-keys`, { method: "GET" })
    return res.updatedData!
}

export function updatePublicApiKeys(data: PublicApiKeys) {
    return request(`${BASE}/public-api-keys`, { method: "PUT", data })
}

export async function getRuntimeConfig() {
    const res = await request<APIResponse<RuntimeConfig>>(`${BASE}/runtime`, { method: "GET" })
    return res.updatedData!
}

export function updateRuntimeConfig(data: RuntimeConfig) {
    return request(`${BASE}/runtime`, { method: "PUT", data })
}
