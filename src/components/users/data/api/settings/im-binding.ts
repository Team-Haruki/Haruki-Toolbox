import {callApi} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    verifyQQPayload,
    SocialPlatformInfo,
    SendQQMailVerificationPayload,
    SocialPlatformVerificationRequestPayload,
    GenerateSocialPlatformVerificationCodeResponse
} from "@/components/users/data/types";

export async function sendQQMailVerificationCode(qq: string, challengeToken: string): Promise<APIResponse<null>> {
    const payload: SendQQMailVerificationPayload = {qq, challengeToken}
    return await callApi<null>(
        "/api/user/{toolboxUserId}/social-platform/send-qq-mail",
        "POST",
        payload
    )
}

export async function verifyQQ(qq: string, oneTimePassword: string): Promise<APIResponse<SocialPlatformInfo>> {
    const payload: verifyQQPayload = {qq, oneTimePassword}
    return await callApi<SocialPlatformInfo>(
        "/api/user/{toolboxUserId}/social-platform/verify-qq-mail",
        "POST",
        payload
    )
}

export async function generateSocialPlatformVerificationCode(platform: SocialPlatform, userId: string): Promise<APIResponse<GenerateSocialPlatformVerificationCodeResponse>> {
    const payload: SocialPlatformVerificationRequestPayload = {platform, userId}
    return await callApi<GenerateSocialPlatformVerificationCodeResponse>(
        "/api/user/{toolboxUserId}/social-platform/generate-verification-code",
        "POST",
        payload
    )
}

export async function getSocialPlatformVerificationStatus(statusToken: string): Promise<APIResponse<SocialPlatformInfo>> {
    return await callApi<SocialPlatformInfo>(
        `/api/user/{toolboxUserId}/social-platform/verification-status/${statusToken}`,
        "GET",
    )
}

export async function clearSocialPlatformBinding(): Promise<APIResponse<null>> {
    return await callApi<null>(
        "/api/user/{toolboxUserId}/social-platform/clear",
        "DELETE"
    )
}
