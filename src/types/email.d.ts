export interface SendEmailVerificationPayload {
    email: string
    challengeToken: string
}

export interface SendQQMailVerificationPayload {
    qq: string
    challengeToken: string
}

export interface verifyEmailPayload {
    email: string
    oneTimePassword: string
}

export interface verifyQQPayload {
    qq: string
    oneTimePassword: string
}