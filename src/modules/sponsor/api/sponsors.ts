import { request } from "@/core/http/call-api"
import { normalizeSponsorPageData } from "@/modules/sponsor/api/normalize"

const SPONSORS_ENDPOINTS = ["/api/misc/sponsors", "/api/sponsor/afdian"] as const

export async function getSponsorPageData() {
  let lastError: unknown

  for (const endpoint of SPONSORS_ENDPOINTS) {
    try {
      const payload = await request<unknown>(endpoint, { method: "GET" })
      return normalizeSponsorPageData(payload)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
