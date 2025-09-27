import type { EmailInfo, SocialPlatformInfo, AuthorizeSocialPlatformInfo, GameAccountBinding } from "./user"

export interface APIResponse<T = unknown> {
    status: number
    message: string
    updatedData?: T
}

export interface UserUpdatedData {
    name?: string
    avatarPath?: string
    emailInfo?: EmailInfo
    socialPlatformInfo?: SocialPlatformInfo
    authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[]
    gameAccountBindings?: GameAccountBinding[]
}
