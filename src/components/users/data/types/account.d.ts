export interface UpdateUserProfilePayload {
    name?: string
    avatarBase64?: string
}

export interface ChangePasswordPayload {
    password: string
}

export interface SendResetPasswordEmailPayload {
    email: string
    challengeToken: string
}

export interface ResetPasswordPayload {
    email: string
    oneTimeSecret: string
    password: string
}
