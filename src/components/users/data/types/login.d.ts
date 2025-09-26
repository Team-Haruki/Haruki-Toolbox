import {
    EmailInfo,
    SocialPlatformInfo,
    GameAccountBinding,
    AuthorizeSocialPlatformInfo,
} from "@/components/users/data/types/store";

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    status: number
    userData: {
        name: string
        avatarPath: string
        emailInfo: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        sessionToken: string
    }
}

export interface LoginResult {
    success: boolean
    data?: LoginResponse["userData"]
    message?: string
}