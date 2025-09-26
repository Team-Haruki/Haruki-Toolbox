export interface RegisterPayload {
    name: string
    email: string
    password: string
}

export interface RegisterSuccessResponse {
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

export interface RegisterErrorResponse {
    status: number
    message: string
}