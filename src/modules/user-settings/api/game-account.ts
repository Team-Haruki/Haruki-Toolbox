import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type {
    SekaiRegion,
    APIResponse,
    SuiteDataPrivacySettings,
    CreateGameAccountBindingPayload,
    MysekaiDataPrivacySettings,
    GameAccountBindingsUpdatedData,
    GenerateGameAccountCodeResponse
} from "@/types"
import type { AxiosRequestConfig } from "axios"

const gameAccountPath = (userId: string, server: SekaiRegion, gameUserId: string) =>
    buildUserApiPath(userId, "game-account", server, gameUserId)


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
    const payload: CreateGameAccountBindingPayload = {
        suite: options?.suite ?? null,
        mysekai: options?.mysekai ?? null,
    }
    return await request<APIResponse<GameAccountBindingsUpdatedData>>(
        gameAccountPath(userId, server, gameUserId),
        {
            method: "PUT",
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
    const payload: CreateGameAccountBindingPayload = {
        suite: options?.suite ?? null,
        mysekai: options?.mysekai ?? null,
    }
    return await request<APIResponse<GameAccountBindingsUpdatedData>>(
        gameAccountPath(userId, server, gameUserId),
        {
            method: "PATCH",
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
        gameAccountPath(userId, server, gameUserId),
        {
            method: "DELETE",
            ...axiosOptions
        }
    )
}

export async function generateGameAccountVerificationCode(
    server: SekaiRegion,
    gameUserId: string,
    userId: string,
    axiosOptions?: AxiosRequestConfig
): Promise<GenerateGameAccountCodeResponse> {
    return await request<GenerateGameAccountCodeResponse>(
        gameAccountPath(userId, server, gameUserId),
        {
            method: "POST",
            ...axiosOptions
        }
    )
}
