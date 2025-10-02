import {callApi} from "@/components/users/data/api/call-api"
import type {
    SekaiRegion,
    APIResponse,
    SuiteDataPrivacySettings,
    GameAccountBindingPayload,
    MysekaiDataPrivacySettings,
    GenerateGameAccountCodePayload,
    GameAccountBindingsUpdatedData,
    GenerateGameAccountCodeResponse
} from "@/components/users/data/types"


export async function addOrUpdateGameAccount(
    server: SekaiRegion,
    gameUserId: string,
    userId: number,
    options?: {
        suite?: SuiteDataPrivacySettings | null
        mysekai?: MysekaiDataPrivacySettings | null
    }
): Promise<APIResponse<GameAccountBindingsUpdatedData>> {
    const payload: GameAccountBindingPayload = {
        server,
        userId,
        suite: options?.suite ?? null,
        mysekai: options?.mysekai ?? null,
    }
    return await callApi<GameAccountBindingsUpdatedData>(
        `/api/user/{toolboxUserId}/game-account/${server}/${encodeURIComponent(gameUserId)}`,
        "PUT",
        payload
    )
}

export async function removeGameAccount(
    server: SekaiRegion,
    gameUserId: string
): Promise<APIResponse<GameAccountBindingsUpdatedData>> {
    return await callApi<GameAccountBindingsUpdatedData>(
        `/api/user/{toolboxUserId}/game-account/${server}/${encodeURIComponent(gameUserId)}`,
        "DELETE"
    )
}

export async function generateGameAccountVerificationCode(
    server: SekaiRegion,
    userId: string
): Promise<GenerateGameAccountCodeResponse> {
    const payload: GenerateGameAccountCodePayload = {server, userId}
    return await callApi<GenerateGameAccountCodeResponse>(
        "/api/user/{toolboxUserId}/game-account/generate-verification-code",
        "POST",
        payload
    )
}
