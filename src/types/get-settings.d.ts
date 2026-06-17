import { AuthorizeSocialPlatformInfo, EmailInfo, GameAccountBinding, SocialPlatformInfo } from "@/types/store";
import type { UserRole } from "@/types/common";

export interface UserSettings {
    name?: string
    userId?: string
    kratosIdentityId?: string | null
    avatarPath?: string
    allowCNMysekai?: boolean
    iosUploadCode?: string
    emailInfo?: EmailInfo
    socialPlatformInfo?: SocialPlatformInfo | null
    authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
    gameAccountBindings?: GameAccountBinding[] | null
    role?: UserRole
    sessionToken?: string
    sessionExpiresAt?: string | number | null
}
