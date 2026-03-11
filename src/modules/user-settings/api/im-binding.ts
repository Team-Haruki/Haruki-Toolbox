import {request} from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type {
    APIResponse,
    SocialPlatform,
    VerifyQQPayload,
    SocialPlatformInfo,
    SendQQMailVerificationPayload,
    SocialPlatformVerificationRequestPayload,
    GenerateSocialPlatformVerificationCodeResponse
} from "@/types";

export async function sendQQMailVerificationCode(userId: string, qq: string, challengeToken: string): Promise<APIResponse<null>> {
    const payload: SendQQMailVerificationPayload = {qq, challengeToken}
    return await request<APIResponse<null>>(
        buildUserApiPath(userId, "social-platform", "send-qq-mail"),
        {
            method: "POST",
            data: payload
        }
    )
}

export async function verifyQQ(userId: string, qq: string, oneTimePassword: string): Promise<APIResponse<SocialPlatformInfo>> {
    const payload: VerifyQQPayload = {qq, oneTimePassword}
    return await request<APIResponse<SocialPlatformInfo>>(
        buildUserApiPath(userId, "social-platform", "verify-qq-mail"),
        {
            method: "POST",
            data: payload
        }
    )
}

export async function generateSocialPlatformVerificationCode(toolboxUserId: string, platform: SocialPlatform, platformUserId: string): Promise<GenerateSocialPlatformVerificationCodeResponse> {
    const payload: SocialPlatformVerificationRequestPayload = {platform, userId: platformUserId}
    return await request<GenerateSocialPlatformVerificationCodeResponse>(
        buildUserApiPath(toolboxUserId, "social-platform", "generate-verification-code"),
        {
            method: "POST",
            data: payload
        }
    )
}

export async function getSocialPlatformVerificationStatus(userId: string, statusToken: string): Promise<APIResponse<SocialPlatformInfo>> {
    return await request<APIResponse<SocialPlatformInfo>>(
        buildUserApiPath(userId, "social-platform", "verification-status", statusToken),
        {
            method: "GET"
        }
    )
}

export async function clearSocialPlatformBinding(userId: string): Promise<APIResponse<null>> {
    return await request<APIResponse<null>>(
        buildUserApiPath(userId, "social-platform", "clear"),
        {
            method: "DELETE"
        }
    )
}
