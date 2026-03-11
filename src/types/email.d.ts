export interface SendEmailVerificationPayload {
    email: string
    challengeToken: string
}

export interface SendQQMailVerificationPayload {
    qq: string
    challengeToken: string
}

export interface VerifyEmailPayload {
    email: string
    oneTimePassword: string
}

export interface VerifyQQPayload {
    qq: string
    oneTimePassword: string
}

// Backward-compatible aliases; prefer PascalCase names.
export type verifyEmailPayload = VerifyEmailPayload
export type verifyQQPayload = VerifyQQPayload
