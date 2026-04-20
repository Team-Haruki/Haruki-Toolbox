import { request } from "@/core/http/call-api"
import type { APIResponse } from "@/types/response"

export interface BotNeoStatusResponse {
  enabled: boolean
}

export interface BotNeoRegistrationResult {
  bot_id: string
  credential: string
}

export async function getBotNeoStatus(): Promise<APIResponse<BotNeoStatusResponse>> {
  return await request<APIResponse<BotNeoStatusResponse>>(
    "/api/haruki-bot-neo/status",
    { method: "GET" },
  )
}

export async function sendBotNeoVerificationMail(qqNumber: number): Promise<APIResponse<null>> {
  return await request<APIResponse<null>>(
    "/api/haruki-bot-neo/send-mail",
    {
      method: "POST",
      data: { qq_number: qqNumber },
    },
  )
}

export async function registerBotNeo(
  qqNumber: number,
  verificationCode: string,
): Promise<APIResponse<BotNeoRegistrationResult>> {
  return await request<APIResponse<BotNeoRegistrationResult>>(
    "/api/haruki-bot-neo/register",
    {
      method: "POST",
      data: { qq_number: qqNumber, verification_code: verificationCode },
    },
  )
}
