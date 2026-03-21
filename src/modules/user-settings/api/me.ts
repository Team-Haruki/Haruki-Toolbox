import { request } from "@/core/http/call-api"
import type { APIResponse, UserSettings } from "@/types"
import type { AxiosRequestConfig } from "axios"

export async function getCurrentUser(
  options?: AxiosRequestConfig
): Promise<APIResponse<UserSettings>> {
  return await request<APIResponse<UserSettings>>("/api/user/me", {
    method: "GET",
    ...options,
  })
}
