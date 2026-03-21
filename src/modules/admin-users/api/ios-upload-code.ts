import { request } from "@/core/http/call-api"
import { userBase } from "@/modules/admin-users/api/shared"
import type { UnknownRecord } from "@/lib/record-utils"
import type { APIResponse } from "@/types/response"

export async function regenerateIOSUploadCode(userId: string) {
  const res = await request<APIResponse<UnknownRecord>>(`${userBase(userId)}/ios-upload-code/regenerate`, {
    method: "POST",
  })
  const data = res.updatedData
  const code = data?.uploadCode ?? data?.upload_code
  return code ? { uploadCode: String(code) } : null
}

export function deleteIOSUploadCode(userId: string) {
  return request(`${userBase(userId)}/ios-upload-code`, { method: "DELETE" })
}
