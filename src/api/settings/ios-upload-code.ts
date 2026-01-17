import { request } from "@/api/call-api"
import type { APIResponse } from "@/types/response"

export async function generateIOSUploadCode(userId: string): Promise<string> {
    const response = await request<APIResponse<string>>(
        `/user/${userId}/ios/generate-upload-code`,
        { method: "POST" }
    )
    return response.updatedData!
}
