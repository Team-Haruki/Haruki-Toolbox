import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { AfdianBinding } from "@/modules/user-settings/api/sponsor"
import type { APIResponse } from "@/types/response"

export type SponsorAccess = "automatic" | "granted" | "blocked"
export interface ToolboxSponsorUser extends Omit<AfdianBinding, "oauthEnabled" | "orderVerificationEnabled"> {
  userId: string
  name: string
  email: string
  banned: boolean
  note: string
  updatedBy: string
  updatedAt: string | null
}

export interface ToolboxSponsorList {
  items: ToolboxSponsorUser[]
  total: number
  page: number
  pageSize: number
}

const BASE = "/api/admin/sponsors/toolbox-users"

export async function listToolboxSponsorUsers(q: string, page: number, scope: "certified" | "all" = "certified") {
  return unwrapUpdatedData(await request<APIResponse<ToolboxSponsorList>>(BASE, {
    params: { q, page, page_size: 20, scope },
  }))
}

export async function updateToolboxSponsorAccess(userId: string, access: SponsorAccess, note: string) {
  await request(`${BASE}/${encodePathSegment(userId)}`, { method: "PUT", data: { access, note }, retry: 0 })
}
