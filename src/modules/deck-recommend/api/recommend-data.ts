import { buildUserApiPath } from "@/core/http/path"
import { request } from "@/core/http/call-api"
import type { SekaiRegion } from "@/types"

export type DeckRecommendUserDataMode = "suite" | "mysekai"
export type DeckRecommendGameAccountDataType = DeckRecommendUserDataMode | "profile"

export type FetchDeckRecommendUserDataParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  mode: DeckRecommendUserDataMode
  cacheBust?: boolean
}

export type FetchDeckRecommendGameAccountDataParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  dataType: DeckRecommendGameAccountDataType
  key?: string
  cacheBust?: boolean
}

export type DeckRecommendUserDataResponse = {
  server: SekaiRegion
  gameUserId: string
  mode: DeckRecommendUserDataMode
  userData: Record<string, unknown>
}

export type GetUserProfileResponse = Record<string, unknown> & {
  user?: Record<string, unknown>
  userProfile?: Record<string, unknown>
  userDeck?: Record<string, unknown>
  userCards?: unknown[]
  userCharacters?: unknown[]
  userChallengeLiveSoloResult?: Record<string, unknown>
  userChallengeLiveSoloStages?: unknown[]
  userMusicDifficultyClearCount?: unknown[]
  userCustomProfileCards?: unknown[]
  userProfileHonors?: unknown[]
  userHonors?: unknown[]
  userBondsHonors?: unknown[]
  userStoryFavorites?: unknown[]
  userConfig?: Record<string, unknown>
  userMultiLiveTopScoreCount?: Record<string, unknown>
  totalPower?: Record<string, unknown>
  userHonorMissions?: unknown[]
  isMysekaiOwnerAcceptVisit?: boolean
}

export async function fetchDeckRecommendUserData(
  params: FetchDeckRecommendUserDataParams,
): Promise<DeckRecommendUserDataResponse> {
  const userData = params.mode === "suite"
    ? await fetchDeckRecommendSuiteUserData(params)
    : await fetchDeckRecommendGameAccountData({
        toolboxUserId: params.toolboxUserId,
        server: params.server,
        gameUserId: params.gameUserId,
        dataType: params.mode,
        cacheBust: params.cacheBust,
      })

  return {
    server: params.server,
    gameUserId: String(params.gameUserId),
    mode: params.mode,
    userData: unwrapGameAccountDataResponse(userData),
  }
}

export function fetchDeckRecommendGameAccountData<T = unknown>(
  params: FetchDeckRecommendGameAccountDataParams,
): Promise<T> {
  return request<T>(
    buildUserApiPath(
      params.toolboxUserId,
      "game-account",
      params.server,
      params.gameUserId,
      params.dataType,
    ),
    {
      params: {
        ...(params.key ? { key: params.key } : {}),
        ...(params.cacheBust ? { t: Date.now() } : {}),
      },
    },
  )
}

export async function fetchDeckRecommendUploadTime(
  params: Omit<FetchDeckRecommendUserDataParams, "cacheBust">,
): Promise<number> {
  const response = await fetchDeckRecommendGameAccountData({
    ...params,
    dataType: params.mode,
    key: "upload_time",
    cacheBust: true,
  })
  const uploadTime = normalizeDeckRecommendUploadTime(response)
  if (uploadTime == null) {
    throw new Error(`invalid ${params.mode} upload_time response`)
  }

  return uploadTime
}

export async function getUserProfile(
  params: Omit<FetchDeckRecommendGameAccountDataParams, "dataType" | "key">,
): Promise<GetUserProfileResponse> {
  const response = await fetchDeckRecommendGameAccountData({
    ...params,
    dataType: "profile",
    cacheBust: true,
  })
  return unwrapUserProfileResponse(response)
}

export function normalizeDeckRecommendUploadTime(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (isRecord(value)) {
    const numberLong = value.$numberLong
    if (typeof numberLong === "string" && numberLong.trim() !== "") {
      const parsed = Number(numberLong)
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
}

export function unwrapUserProfileResponse(value: unknown): GetUserProfileResponse {
  if (!isRecord(value)) {
    throw new Error("invalid user profile response")
  }

  const wrappedData = value.updatedData
  if (isRecord(wrappedData)) {
    return wrappedData as GetUserProfileResponse
  }

  return value as GetUserProfileResponse
}

export function unwrapGameAccountDataResponse(value: unknown): Record<string, unknown> {
  const data = unwrapGameAccountDataValue(value)
  if (!data) {
    throw new Error("invalid game account data response")
  }

  return data
}

export function unwrapGameAccountDataKeyResponse(value: unknown, key: string): unknown {
  const data = unwrapGameAccountDataResponse(value)
  return key in data ? data[key] : data
}

export function normalizeDeckRecommendUserDataResponse(
  value: DeckRecommendUserDataResponse,
): DeckRecommendUserDataResponse {
  return {
    ...value,
    userData: unwrapGameAccountDataResponse(value.userData),
  }
}

async function fetchDeckRecommendSuiteUserData(
  params: FetchDeckRecommendUserDataParams,
): Promise<Record<string, unknown>> {
  const [baseDataResponse, userGamedataResponse] = await Promise.all([
    fetchDeckRecommendGameAccountData({
      toolboxUserId: params.toolboxUserId,
      server: params.server,
      gameUserId: params.gameUserId,
      dataType: "suite",
      cacheBust: params.cacheBust,
    }),
    fetchDeckRecommendGameAccountData({
      toolboxUserId: params.toolboxUserId,
      server: params.server,
      gameUserId: params.gameUserId,
      dataType: "suite",
      key: "userGamedata",
      cacheBust: params.cacheBust,
    }),
  ])

  const baseData = unwrapGameAccountDataResponse(baseDataResponse)
  const userGamedata = unwrapGameAccountDataKeyResponse(userGamedataResponse, "userGamedata")
  if (!isRecord(userGamedata)) {
    throw new Error("invalid suite userGamedata response")
  }

  return {
    ...baseData,
    userGamedata,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function unwrapGameAccountDataValue(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return unwrapGameAccountDataValue(value[0])
  }

  if (!isRecord(value)) {
    return null
  }

  if (isLikelyGameAccountData(value)) {
    return value
  }

  for (const key of ["updatedData", "data", "payload", "result", "body"]) {
    if (key in value) {
      const unwrappedData = unwrapGameAccountDataValue(value[key])
      if (unwrappedData) {
        return unwrappedData
      }
    }
  }

  return value
}

function isLikelyGameAccountData(value: Record<string, unknown>): boolean {
  return (
    Array.isArray(value.userCards)
    || Array.isArray(value.userCharacters)
    || Array.isArray(value.userDecks)
    || isRecord(value.userGamedata)
    || isRecord(value.userMysekaiGamedata)
  )
}
