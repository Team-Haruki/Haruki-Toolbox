export type SocialPlatform = "qq" | "qqbot" | "discord" | "telegram"

export interface SocialPlatformVerificationResponse {
    statusToken: string
    oneTimePassword: string
}

export interface AddAuthorizeSocialPlatformAccountPayload {
    platform: SocialPlatform,
    userId: string,
    comment: string
}