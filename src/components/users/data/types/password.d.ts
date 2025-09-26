export interface ChangePasswordPayload {
    password: string
}

export interface ChangePasswordResponse {
    status: number
    message?: string
}

export interface SendResetPasswordEmailPayload {
    email: string
}

export interface SendResetPasswordEmailResponse {
    status: number
    message: string
}


export interface ResetPasswordPayload {
    email: string
    oneTimeSecret: string
    password: string
}

export interface ResetPasswordResponse {
    status: number
    message: string
}