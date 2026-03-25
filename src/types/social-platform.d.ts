import type { AuthorizeSocialPlatformInfo } from "@/types/store"

export type SocialPlatform = "qq" | "qqbot" | "discord" | "telegram"

export interface GenerateSocialPlatformVerificationCodeResponse {
    status: number
    message: string
    statusToken: string
    oneTimePassword: string
}

export interface AddAuthorizeSocialPlatformAccountPayload {
    platform: SocialPlatform,
    userId: string,
    comment: string,
    allowFastVerification?: boolean
}

export type AuthorizeSocialPlatformUpdatedData = {
    authorizeSocialPlatformInfo: AuthorizeSocialPlatformInfo[]
}

export interface SocialPlatformVerificationRequestPayload {
    platform: SocialPlatform
    userId: string
}