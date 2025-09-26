import {callApi} from "@/components/users/data/api/call-api"
import {
    verifyEmailPayload,
    EmailVerificationResponse,
    SendEmailVerificationPayload
} from "@/components/users/data/types";

export async function sendQQMailVerificationCode(qq: string) {
    const payload: SendEmailVerificationPayload = {
        email: `${qq}@qq.com`,
    }
    return await callApi<EmailVerificationResponse>(
        "/api/user/email/send",
        "POST",
        payload
    )
}

export async function verifyQQ(oneTimePassword: string) {
    const payload: verifyEmailPayload = {oneTimePassword}
    return await callApi<EmailVerificationResponse>(
        "/api/user/email/verify",
        "POST",
        payload
    )
}
