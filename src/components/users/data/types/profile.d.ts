export interface UpdateUserProfilePayload {
    name: string
    avatarBase64: string
}

export interface UpdateUserProfileResponse {
    status: number
    message?: string
}