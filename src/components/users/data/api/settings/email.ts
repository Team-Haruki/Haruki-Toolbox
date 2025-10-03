import {callApiResponse} from "@/components/users/data/api/call-api"
import type {
    EmailInfo,
    APIResponse,
    verifyEmailPayload,
    SendEmailVerificationPayload
} from "@/components/users/data/types";

export async function sendEmailVerificationCode(email: string, challengeToken: string): Promise<APIResponse<null>> {
    const payload: SendEmailVerificationPayload = {email, challengeToken};
    return await callApiResponse<null>(
        "/api/email/send",
        "POST",
        payload
    )
}

export async function verifyEmail(email: string, oneTimePassword: string): Promise<APIResponse<EmailInfo>> {
    const payload: verifyEmailPayload = {email, oneTimePassword}
    return await callApiResponse<EmailInfo>(
        "/api/email/verify",
        "POST",
        payload
    )
}
