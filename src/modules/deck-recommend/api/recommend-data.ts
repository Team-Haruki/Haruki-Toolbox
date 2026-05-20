import { buildUserApiPath } from "@/core/http/path"
import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { SekaiRegion } from "@/types"
import type { APIResponse } from "@/types/response"

export type DeckRecommendUserDataMode = "suite" | "mysekai"

export type FetchDeckRecommendUserDataParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  mode: DeckRecommendUserDataMode
}

export type DeckRecommendUserDataResponse = {
  server: SekaiRegion
  gameUserId: string
  mode: DeckRecommendUserDataMode
  userData: Record<string, unknown>
}

export async function fetchDeckRecommendUserData(
  params: FetchDeckRecommendUserDataParams,
): Promise<DeckRecommendUserDataResponse> {
  const response = await request<APIResponse<DeckRecommendUserDataResponse>>(
    buildUserApiPath(
      params.toolboxUserId,
      "game-account",
      params.server,
      params.gameUserId,
      "recommend-data",
    ),
    {
      params: {
        mode: params.mode,
      },
    },
  )
  return unwrapUpdatedData(response, "deck recommend user data")
}
