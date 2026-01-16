import {request} from "@/api/call-api"
import type {
    APIResponse,
    SocialPlatform,
    verifyQQPayload,
    SocialPlatformInfo,
    SendQQMailVerificationPayload,
    SocialPlatformVerificationRequestPayload,
    GenerateSocialPlatformVerificationCodeResponse
} from "@/types";

export async function sendQQMailVerificationCode(userId: string, qq: string, challengeToken: string): Promise<APIResponse<null>> {
    const payload: SendQQMailVerificationPayload = {qq, challengeToken}
    return await request<APIResponse<null>>(
        `/api/user/${userId}/social-platform/send-qq-mail`,
        {
            method: "POST",
            data: payload
        }
    )
}

export async function verifyQQ(userId: string, qq: string, oneTimePassword: string): Promise<APIResponse<SocialPlatformInfo>> {
    const payload: verifyQQPayload = {qq, oneTimePassword}
    return await request<APIResponse<SocialPlatformInfo>>(
        `/api/user/${userId}/social-platform/verify-qq-mail`,
        {
            method: "POST",
            data: payload
        }
    )
}

export async function generateSocialPlatformVerificationCode(toolboxUserId: string, platform: SocialPlatform, platformUserId: string): Promise<GenerateSocialPlatformVerificationCodeResponse> {
    const payload: SocialPlatformVerificationRequestPayload = {platform, userId: platformUserId}
    return await request<GenerateSocialPlatformVerificationCodeResponse>(
        `/api/user/${toolboxUserId}/social-platform/generate-verification-code`,
        {
            method: "POST",
            data: payload
        }
    )
}

export async function getSocialPlatformVerificationStatus(userId: string, statusToken: string): Promise<APIResponse<SocialPlatformInfo>> {
    return await request<APIResponse<SocialPlatformInfo>>(
        `/api/user/${userId}/social-platform/verification-status/${statusToken}`,
        {
            method: "GET"
        }
    )
}

export async function clearSocialPlatformBinding(userId: string): Promise<APIResponse<null>> {
    return await request<APIResponse<null>>(
        `/api/user/${userId}/social-platform/clear`,
        {
            method: "DELETE"
        }
    )
}