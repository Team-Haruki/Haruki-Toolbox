import {request} from "@/api/call-api"
import type {
    EmailInfo,
    APIResponse,
    verifyEmailPayload,
    SendEmailVerificationPayload
} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function sendEmailVerificationCode(
    email: string, 
    challengeToken: string, 
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const payload: SendEmailVerificationPayload = {email, challengeToken};
    return await request<APIResponse<null>>(
        "/api/email/send",
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}

export async function verifyEmail(
    email: string, 
    oneTimePassword: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<EmailInfo>> {
    const payload: verifyEmailPayload = {email, oneTimePassword}
    return await request<APIResponse<EmailInfo>>(
        "/api/email/verify",
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}