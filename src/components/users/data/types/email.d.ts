export interface SendEmailVerificationPayload {
    email: string
    challengeToken: string
}

export interface SendQQMailVerificationPayload {
    qq: string
    challengeToken: string
}

export interface verifyEmailPayload {
    oneTimePassword: string
}
