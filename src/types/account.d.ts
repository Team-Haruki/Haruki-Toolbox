export interface UpdateUserProfilePayload {
    name?: string
    avatarBase64?: string
}

export interface ChangePasswordPayload {
    oldPassword: string
    newPassword: string
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
