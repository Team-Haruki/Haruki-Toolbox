import { buildUserApiPath } from "@/core/http/path"
import { requestWithResponse } from "@/core/http/call-api"
import type { SekaiRegion } from "@/types"
import type { AxiosRequestConfig, AxiosResponse } from "axios"

export type DeckRecommendUserDataMode = "suite" | "mysekai"
export type DeckRecommendGameAccountDataType = DeckRecommendUserDataMode | "profile"

export type FetchDeckRecommendUserDataParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  mode: DeckRecommendUserDataMode
  cacheBust?: boolean
  knownUploadTime?: number
}

export type FetchDeckRecommendGameAccountDataParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  dataType: DeckRecommendGameAccountDataType
  key?: string
  cacheBust?: boolean
  knownUploadTime?: number
}

export type DeckRecommendUserDataResponse = {
  server: SekaiRegion
  gameUserId: string
  mode: DeckRecommendUserDataMode
  userData: Record<string, unknown>
}

export type DeckRecommendUserDataReadResult =
  | {
      kind: "not-modified"
      uploadTime: number
    }
  | {
      kind: "data"
      data: DeckRecommendUserDataResponse
      uploadTime: number | null
    }

export type DeckRecommendResponseRequester = <T = unknown>(
  url: string,
  options?: AxiosRequestConfig,
) => Promise<AxiosResponse<T>>

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
  requester: DeckRecommendResponseRequester = requestWithResponse,
): Promise<DeckRecommendUserDataReadResult> {
  if (params.mode === "suite") {
    return fetchDeckRecommendSuiteUserData(params, requester)
  }

  const response = await fetchDeckRecommendGameAccountDataResponse({
    toolboxUserId: params.toolboxUserId,
    server: params.server,
    gameUserId: params.gameUserId,
    dataType: params.mode,
    cacheBust: params.cacheBust,
    knownUploadTime: params.knownUploadTime,
  }, requester)
  if (response.status === 304) {
    return {
      kind: "not-modified",
      uploadTime: requireKnownUploadTime(params.knownUploadTime),
    }
  }

  return {
    kind: "data",
    data: {
      server: params.server,
      gameUserId: String(params.gameUserId),
      mode: params.mode,
      userData: unwrapGameAccountDataResponse(response.data),
    },
    uploadTime: readUploadTimeFromGameAccountData(response.data),
  }
}

export function fetchDeckRecommendGameAccountData<T = unknown>(
  params: FetchDeckRecommendGameAccountDataParams,
): Promise<T> {
  return fetchDeckRecommendGameAccountDataResponse<T>(params).then((response) => response.data)
}

function fetchDeckRecommendGameAccountDataResponse<T = unknown>(
  params: FetchDeckRecommendGameAccountDataParams,
  requester: DeckRecommendResponseRequester = requestWithResponse,
) {
  return requester<T>(
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
        ...(isValidUploadTime(params.knownUploadTime) ? { known_upload_time: params.knownUploadTime } : {}),
        ...(params.cacheBust ? { t: Date.now() } : {}),
      },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    },
  )
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
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  if (isRecord(value)) {
    const numberLong = value.$numberLong
    if (typeof numberLong === "string" && numberLong.trim() !== "") {
      const parsed = Number(numberLong)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
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
  requester: DeckRecommendResponseRequester,
): Promise<DeckRecommendUserDataReadResult> {
  const baseDataResponse = await fetchDeckRecommendGameAccountDataResponse({
    toolboxUserId: params.toolboxUserId,
    server: params.server,
    gameUserId: params.gameUserId,
    dataType: "suite",
    knownUploadTime: params.knownUploadTime,
  }, requester)
  if (baseDataResponse.status === 304) {
    return {
      kind: "not-modified",
      uploadTime: requireKnownUploadTime(params.knownUploadTime),
    }
  }

  const userGamedataResponse = await fetchDeckRecommendGameAccountDataResponse({
    toolboxUserId: params.toolboxUserId,
    server: params.server,
    gameUserId: params.gameUserId,
    dataType: "suite",
    key: "userGamedata,upload_time",
  }, requester)

  const baseData = unwrapGameAccountDataResponse(baseDataResponse.data)
  const userGamedata = unwrapGameAccountDataKeyResponse(userGamedataResponse.data, "userGamedata")
  if (!isRecord(userGamedata)) {
    throw new Error("invalid suite userGamedata response")
  }

  return {
    kind: "data",
    data: {
      server: params.server,
      gameUserId: String(params.gameUserId),
      mode: params.mode,
      userData: {
        ...baseData,
        userGamedata,
      },
    },
    uploadTime: matchingUploadTime(baseDataResponse.data, userGamedataResponse.data),
  }
}

function readUploadTimeFromGameAccountData(value: unknown): number | null {
  const data = unwrapGameAccountDataResponse(value)
  return normalizeDeckRecommendUploadTime(data.upload_time)
}

function matchingUploadTime(left: unknown, right: unknown): number | null {
  const leftUploadTime = readUploadTimeFromGameAccountData(left)
  const rightUploadTime = readUploadTimeFromGameAccountData(right)
  return leftUploadTime != null && leftUploadTime === rightUploadTime ? leftUploadTime : null
}

function isValidUploadTime(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function requireKnownUploadTime(value: number | undefined): number {
  if (!isValidUploadTime(value)) {
    throw new Error("received 304 without a valid known upload time")
  }
  return value
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
