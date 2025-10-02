export interface RegisterPayload {
    name: string
    email: string
    password: string
    oneTimePassword: string
    challengeToken: string
}

export interface RegisterSuccessResponse {
    status: number
    message: string
    userData: {
        name?: string
        userId?: string
        avatarPath?: string
        allowCNMysekai?: boolean
        emailInfo?: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        sessionToken?: string
    }
}
