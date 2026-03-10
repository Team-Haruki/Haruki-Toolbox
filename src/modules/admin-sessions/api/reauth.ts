import { request } from "@/core/http/call-api"

const BASE = "/api/admin/me"

export function reauthAdmin(data?: { password?: string }) {
  return request(`${BASE}/reauth`, { method: "POST", data })
}
