import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { APIResponse } from "@/types/response"

export interface AfdianBinding {
  oauthEnabled: boolean
  orderVerificationEnabled: boolean
  verificationMethod: "" | "oauth2" | "order"
  afdianUserId: string | null
  boundAt: string | null
  eligible: boolean
  category: "none" | "current" | "former"
  expiresAt: string | null
}

export interface SponsorFrame {
  id: string
  name: Record<string, string>
  thumbnail: string
  panelPreview: string
  profilePreview: string
}

export interface FrameAccount {
  server: string
  gameUserId: string
  verified: boolean
  frameId: string | null
}

export interface SponsorFramesData {
  status: AfdianBinding
  frames: SponsorFrame[]
  accounts: FrameAccount[]
}

export async function getAfdianBinding(userId: string): Promise<AfdianBinding> {
  return unwrapUpdatedData(await request<APIResponse<AfdianBinding>>(buildUserApiPath(userId, "afdian")))
}

export async function beginAfdianBinding(userId: string): Promise<string> {
  const data = unwrapUpdatedData(await request<APIResponse<{ authorizeUrl: string }>>(buildUserApiPath(userId, "afdian", "authorize"), { method: "POST" }))
  const url = new URL(data.authorizeUrl)
  if (url.origin !== "https://afdian.com" || url.pathname !== "/oauth2/authorize") throw new Error("Invalid authorization URL")
  return url.href
}

export async function completeAfdianBinding(userId: string, code: string, state: string): Promise<AfdianBinding> {
  return unwrapUpdatedData(await request<APIResponse<AfdianBinding>>(buildUserApiPath(userId, "afdian", "callback"), { method: "POST", data: { code, state }, retry: 0 }))
}

export async function unlinkAfdianBinding(userId: string): Promise<AfdianBinding> {
  return unwrapUpdatedData(await request<APIResponse<AfdianBinding>>(buildUserApiPath(userId, "afdian"), { method: "DELETE" }))
}

export async function verifyAfdianOrder(userId: string, orderNumber: string): Promise<AfdianBinding> {
  return unwrapUpdatedData(await request<APIResponse<AfdianBinding>>(
    buildUserApiPath(userId, "afdian", "verify-order"),
    { method: "POST", data: { orderNumber }, retry: 0 },
  ))
}

export async function getSponsorFrames(userId: string): Promise<SponsorFramesData> {
  return unwrapUpdatedData(await request<APIResponse<SponsorFramesData>>(buildUserApiPath(userId, "sponsor-frames")))
}

export async function saveSponsorFrame(userId: string, account: FrameAccount, frameId: string): Promise<SponsorFramesData> {
  return unwrapUpdatedData(await request<APIResponse<SponsorFramesData>>(
    buildUserApiPath(userId, "sponsor-frames", account.server, account.gameUserId),
    { method: "PUT", data: { frameId } },
  ))
}
