import { AuthorizeSocialPlatformInfo, EmailInfo, GameAccountBinding, SocialPlatformInfo } from "@/types/store";

export interface UserSettings {
    name?: string
    userId?: string
    avatarPath?: string
    allowCNMysekai?: boolean
    iosUploadCode?: string
    emailInfo?: EmailInfo
    socialPlatformInfo?: SocialPlatformInfo | null
    authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
    gameAccountBindings?: GameAccountBinding[] | null
    sessionToken?: string
}