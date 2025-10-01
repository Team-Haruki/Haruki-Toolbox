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
    comment: string
}

export interface SocialPlatformVerificationRequestPayload {
    platform: SocialPlatform
    userId: string
}