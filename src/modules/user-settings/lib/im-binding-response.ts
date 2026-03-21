import { asRecord, readBoolean, readOptionalString, readRecord, readString } from "@/lib/record-utils"
import type { SocialPlatformInfo } from "@/types/store"

type SocialBindingResponse = {
  status?: number
  message?: string
  updatedData?: unknown
  data?: unknown
}

type VerificationCodeResponse = {
  message?: string
  updatedData?: unknown
  data?: unknown
}

export function extractUpdatedSocial(response: SocialBindingResponse | null): SocialPlatformInfo | null {
  const rootRecord = asRecord(response) ?? {}
  const dataRecord = readRecord(rootRecord, ["data"])
  const updated = rootRecord.updatedData ?? dataRecord?.updatedData ?? rootRecord.data ?? rootRecord
  const updatedRecord = asRecord(updated)
  const social = updatedRecord?.socialPlatformInfo ?? updatedRecord?.social_platform_info ?? updated
  const socialRecord = asRecord(social)
  if (!socialRecord) return null

  const platform = readString(socialRecord, ["platform"])
  const userId = readString(socialRecord, ["userId", "user_id"])
  if (!platform && !userId) return null

  return {
    platform,
    userId,
    verified: readBoolean(socialRecord, ["verified"]),
  }
}

export function extractGeneratedCodeResult(response: VerificationCodeResponse | null) {
  const rootRecord = asRecord(response) ?? {}
  const dataRecord = asRecord(rootRecord.updatedData ?? rootRecord.data ?? rootRecord) ?? {}

  return {
    statusToken: readOptionalString(dataRecord, ["statusToken", "status_token"]),
    oneTimePassword: readOptionalString(dataRecord, ["oneTimePassword", "one_time_password"]),
    message: readOptionalString(rootRecord, ["message"]) ?? readOptionalString(dataRecord, ["message"]),
  }
}

export function isNotVerifiedMessage(message: unknown): boolean {
  return String(message ?? "").toLowerCase().includes("not verified")
}
