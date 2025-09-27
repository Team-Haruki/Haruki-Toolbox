import { callApi } from "@/components/users/data/api/call-api"
import {
    SekaiRegion,
    APIResponse,
    GameAccountBinding,
    GameAccountBindingPayload
} from "@/components/users/data/types"

export async function addGameAccount(id: number, server: SekaiRegion, userId: number): Promise<APIResponse<GameAccountBinding[]>> {
    const payload: GameAccountBindingPayload = { server, userId}
  return await callApi<GameAccountBinding[]>(
    `/api/user/game-account/${id}`,
    "PUT",
    payload
  )
}


export async function removeGameAccount(id: number): Promise<APIResponse<GameAccountBinding[]>> {
  return await callApi<GameAccountBinding[]>(
    `/api/user/game-account/${id}`,
    "DELETE"
  )
}

export async function generateGameAccountVerificationCode(): Promise<APIResponse<null>> {
  return await callApi<null>(
    "/api/user/game-account/generate-verification-code",
    "POST"
  )
}

export async function getGameAccountVerificationStatus(statusToken: string): Promise<APIResponse<GameAccountBinding[]>> {
  return await callApi<GameAccountBinding[]>(
    `/api/user/game-account/get-verification-status/${statusToken}`,
    "GET"
  )
}
