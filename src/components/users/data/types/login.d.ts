import {
    EmailInfo,
    SocialPlatformInfo,
    GameAccountBinding,
    AuthorizeSocialPlatformInfo,
} from "@/components/users/data/types/store";

export interface LoginRequest {
    email: string
    password: string
    challengeToken: string
}

export interface LoginResponse {
    status: number
    message: string
    userData: {
        name?: string
        userId?: string
        avatarPath?: string
        emailInfo?: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        sessionToken: string
    }
}
