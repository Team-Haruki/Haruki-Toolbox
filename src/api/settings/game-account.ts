import {request} from "@/api/call-api"
import type {
    SekaiRegion,
    APIResponse,
    SuiteDataPrivacySettings,
    GameAccountBindingPayload,
    MysekaiDataPrivacySettings,
    GenerateGameAccountCodePayload,
    GameAccountBindingsUpdatedData,
    GenerateGameAccountCodeResponse
} from "@/types"
import type { AxiosRequestConfig } from "axios"


export async function addGameAccount(
    server: SekaiRegion,
    gameUserId: string,
    userId: string,
    options?: {
        suite?: SuiteDataPrivacySettings | null
        mysekai?: MysekaiDataPrivacySettings | null
    },
    axiosOptions?: AxiosRequestConfig
): Promise<APIResponse<GameAccountBindingsUpdatedData>> {
    const payload: GameAccountBindingPayload = {
        server,
        userId,
        suite: options?.suite ?? null,
        mysekai: options?.mysekai ?? null,
    }
    return await request<APIResponse<GameAccountBindingsUpdatedData>>(
        `/api/user/${userId}/game-account/${server}/${encodeURIComponent(gameUserId)}`,
        {
            method: "POST",
            data: payload,
            ...axiosOptions
        }
    )
}

export async function updateGameAccount(
    server: SekaiRegion,
    gameUserId: string,
    userId: string,
    options?: {
        suite?: SuiteDataPrivacySettings | null
        mysekai?: MysekaiDataPrivacySettings | null
    },
    axiosOptions?: AxiosRequestConfig
): Promise<APIResponse<GameAccountBindingsUpdatedData>> {
    const payload: GameAccountBindingPayload = {
        server,
        userId,
        suite: options?.suite ?? null,
        mysekai: options?.mysekai ?? null,
    }
    return await request<APIResponse<GameAccountBindingsUpdatedData>>(
        `/api/user/${userId}/game-account/${server}/${encodeURIComponent(gameUserId)}`,
        {
            method: "PUT",
            data: payload,
            ...axiosOptions
        }
    )
}

export async function removeGameAccount(
    server: SekaiRegion,
    gameUserId: string,
    userId: string,
    axiosOptions?: AxiosRequestConfig
): Promise<APIResponse<GameAccountBindingsUpdatedData>> {
    return await request<APIResponse<GameAccountBindingsUpdatedData>>(
        `/api/user/${userId}/game-account/${server}/${encodeURIComponent(gameUserId)}`,
        {
            method: "DELETE",
            ...axiosOptions
        }
    )
}

export async function generateGameAccountVerificationCode(
    server: SekaiRegion,
    userId: string,
    axiosOptions?: AxiosRequestConfig
): Promise<GenerateGameAccountCodeResponse> {
    const payload: GenerateGameAccountCodePayload = {server, userId}
    return await request<GenerateGameAccountCodeResponse>(
        `/api/user/${userId}/game-account/generate-verification-code`,
        {
            method: "POST",
            data: payload,
            ...axiosOptions
        }
    )
}
