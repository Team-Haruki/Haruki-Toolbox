import {callApi} from "@/components/users/data/api/call-api"
import {
    verifyEmailPayload,
    EmailVerificationResponse,
    SendEmailVerificationPayload
} from "@/components/users/data/types";

export async function sendEmailVerificationCode(email: string) {
    const payload: SendEmailVerificationPayload = {email}
    return await callApi<EmailVerificationResponse>(
        "/api/user/email/send",
        "POST",
        payload
    )
}

export async function verifyEmail(oneTimePassword: string) {
    const payload: verifyEmailPayload = {oneTimePassword}
    return await callApi<EmailVerificationResponse>(
        "/api/user/email/verify",
        "POST",
        payload
    )
}
