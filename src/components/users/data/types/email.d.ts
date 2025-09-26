export interface SendEmailVerificationPayload {
    email: string
}

export interface verifyEmailPayload {
    oneTimePassword: string
}

export interface EmailVerificationResponse {
    status: number
    message?: string
}