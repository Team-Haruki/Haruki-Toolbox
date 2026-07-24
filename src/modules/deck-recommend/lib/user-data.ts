import {
  getUserProfile,
  fetchDeckRecommendMysekaiUserData,
  normalizeDeckRecommendUserDataResponse,
  type DeckRecommendUserDataResponse,
  type FetchDeckRecommendUserDataParams,
  type GetUserProfileResponse,
  unwrapGameAccountDataResponse,
} from "../api/recommend-data"
import { fetchUserSuiteWithCache } from "@/shared/sekai/user-snapshot/fetch"
import {
  makeDeckRecommendUserDataCacheKey,
  readDeckRecommendProfileCache,
  readDeckRecommendUserDataCache,
  writeDeckRecommendProfileCache,
  writeDeckRecommendUserDataCache,
  type DeckRecommendProfileCacheRecord,
  type DeckRecommendUserDataCacheRecord,
  type DeckRecommendProfileCacheKeyParams,
} from "./user-data-cache"

export type DeckRecommendUserDataFetchResult = {
  data: DeckRecommendUserDataResponse
  cacheHit: boolean
  cacheable: boolean
  remoteUploadTime: number | null
  cacheUpdatedAt: number | null
}

export type DeckRecommendUserDataCacheStrategy = "prefer-cache" | "check-remote"
export type DeckRecommendProfileCacheStrategy = "prefer-cache" | "refresh"

export type DeckRecommendProfileFetchResult = {
  data: GetUserProfileResponse
  cacheHit: boolean
  cacheUpdatedAt: number | null
}

export type RefreshDeckRecommendProfilesResult = {
  refreshed: number
  failed: number
}

export type RefreshDeckRecommendSuitesResult = {
  refreshed: number
  failed: number
  total: number
}

export type RefreshDeckRecommendSuitesProgress = {
  completed: number
  total: number
}

const userDataRequests = new Map<string, Promise<DeckRecommendUserDataFetchResult>>()
const profileRequests = new Map<string, Promise<DeckRecommendProfileFetchResult>>()

export const DECK_RECOMMEND_SUITE_KEYS = [
  "userAreas",
  "userCards",
  "userCharacters",
  "userGamedata",
  "userHonors",
] as const

export type DeckRecommendUserDataCacheDependencies = {
  fetchSuite: typeof fetchUserSuiteWithCache
  fetchMysekaiUserData: typeof fetchDeckRecommendMysekaiUserData
  readUserDataCache: typeof readDeckRecommendUserDataCache
  writeUserDataCache: typeof writeDeckRecommendUserDataCache
}

const defaultUserDataCacheDependencies: DeckRecommendUserDataCacheDependencies = {
  fetchSuite: fetchUserSuiteWithCache,
  fetchMysekaiUserData: fetchDeckRecommendMysekaiUserData,
  readUserDataCache: readDeckRecommendUserDataCache,
  writeUserDataCache: writeDeckRecommendUserDataCache,
}

export async function fetchDeckRecommendUserDataWithCache(
  params: FetchDeckRecommendUserDataParams,
  options: { strategy?: DeckRecommendUserDataCacheStrategy } = {},
): Promise<DeckRecommendUserDataFetchResult> {
  if (params.mode === "mysekai") {
    const [suiteResult, mysekaiResult] = await Promise.all([
      fetchDeckRecommendSingleUserDataWithCache({ ...params, mode: "suite" }, options.strategy ?? "check-remote"),
      fetchDeckRecommendSingleUserDataWithCache(params, options.strategy ?? "check-remote"),
    ])
    return mergeDeckRecommendUserDataFetchResults(params, suiteResult, mysekaiResult)
  }

  return fetchDeckRecommendSingleUserDataWithCache(params, options.strategy ?? "check-remote")
}

export async function fetchDeckRecommendProfileWithCache(
  params: DeckRecommendProfileCacheKeyParams,
  options: { strategy?: DeckRecommendProfileCacheStrategy } = {},
): Promise<DeckRecommendProfileFetchResult> {
  const strategy = options.strategy ?? "prefer-cache"
  const cacheKey = `${strategy}:profile:${makeProfileRequestKey(params)}`
  const runningRequest = profileRequests.get(cacheKey)
  if (runningRequest) {
    return runningRequest
  }

  const request = fetchCachedDeckRecommendProfile(params, strategy).finally(() => {
    profileRequests.delete(cacheKey)
  })
  profileRequests.set(cacheKey, request)
  return request
}

export async function refreshDeckRecommendProfilesForBoundAccounts(input: {
  toolboxUserId: string | number
  accounts: readonly { server: SekaiRegion; userId: string | number }[]
}): Promise<RefreshDeckRecommendProfilesResult> {
  const uniqueAccounts = dedupeProfileAccounts(input.accounts)
  const results = await Promise.allSettled(uniqueAccounts.map((account) =>
    fetchDeckRecommendProfileWithCache({
      toolboxUserId: input.toolboxUserId,
      server: account.server,
      gameUserId: account.userId,
    }, { strategy: "refresh" }),
  ))
  return results.reduce<RefreshDeckRecommendProfilesResult>((acc, result) => {
    if (result.status === "fulfilled") {
      acc.refreshed += 1
    } else {
      acc.failed += 1
    }
    return acc
  }, { refreshed: 0, failed: 0 })
}

export async function refreshDeckRecommendSuitesForBoundAccounts(input: {
  toolboxUserId: string | number
  accounts: readonly { server: SekaiRegion; userId: string | number }[]
  onProgress?: (progress: RefreshDeckRecommendSuitesProgress) => void
}): Promise<RefreshDeckRecommendSuitesResult> {
  const uniqueAccounts = dedupeProfileAccounts(input.accounts)
  const result: RefreshDeckRecommendSuitesResult = {
    refreshed: 0,
    failed: 0,
    total: uniqueAccounts.length,
  }

  let completed = 0
  for (const account of uniqueAccounts) {
    try {
      await fetchDeckRecommendUserDataWithCache({
        toolboxUserId: input.toolboxUserId,
        server: account.server,
        gameUserId: account.userId,
        mode: "suite",
      }, { strategy: "check-remote" })
      result.refreshed += 1
    } catch {
      result.failed += 1
    }
    completed += 1
    input.onProgress?.({ completed, total: result.total })
  }

  return result
}

async function fetchDeckRecommendSingleUserDataWithCache(
  params: FetchDeckRecommendUserDataParams,
  strategy: DeckRecommendUserDataCacheStrategy,
): Promise<DeckRecommendUserDataFetchResult> {
  const cacheKey = `${strategy}:${makeDeckRecommendUserDataCacheKey(params)}`
  const runningRequest = userDataRequests.get(cacheKey)
  if (runningRequest) {
    return runningRequest
  }

  const request = fetchDeckRecommendCachedUserData(params, strategy).finally(() => {
    userDataRequests.delete(cacheKey)
  })
  userDataRequests.set(cacheKey, request)
  return request
}

async function fetchCachedDeckRecommendProfile(
  params: DeckRecommendProfileCacheKeyParams,
  strategy: DeckRecommendProfileCacheStrategy,
): Promise<DeckRecommendProfileFetchResult> {
  const cachedRecord = await safeReadProfileCache(params)
  if (strategy === "prefer-cache" && cachedRecord) {
    return {
      data: cachedRecord.data,
      cacheHit: true,
      cacheUpdatedAt: cachedRecord.updatedAt,
    }
  }

  const data = await getUserProfile({
    toolboxUserId: params.toolboxUserId,
    server: params.server,
    gameUserId: params.gameUserId,
    cacheBust: true,
  })
  const writtenRecord = await safeWriteProfileCache(params, data)
  return {
    data,
    cacheHit: false,
    cacheUpdatedAt: writtenRecord?.updatedAt ?? cachedRecord?.updatedAt ?? null,
  }
}

export async function fetchDeckRecommendCachedUserData(
  params: FetchDeckRecommendUserDataParams,
  strategy: DeckRecommendUserDataCacheStrategy,
  dependencies: DeckRecommendUserDataCacheDependencies = defaultUserDataCacheDependencies,
): Promise<DeckRecommendUserDataFetchResult> {
  if (params.mode === "suite") {
    return fetchDeckRecommendSuiteUserDataFromSnapshot(params, strategy, dependencies)
  }

  const cachedRecord = await safeReadUserDataCache(params, dependencies.readUserDataCache)
  const cachedRecordComplete = cachedRecord
    ? isDeckRecommendUserDataResponseComplete(cachedRecord.data, params.mode)
    : false
  if (strategy === "prefer-cache" && cachedRecord && cachedRecordComplete) {
    return {
      data: cachedRecord.data,
      cacheHit: true,
      cacheable: true,
      remoteUploadTime: cachedRecord.uploadTime,
      cacheUpdatedAt: cachedRecord.updatedAt,
    }
  }

  const readResult = await dependencies.fetchMysekaiUserData({
    ...params,
    knownUploadTime: cachedRecord && cachedRecordComplete ? cachedRecord.uploadTime : undefined,
  })
  if (readResult.kind === "not-modified" && cachedRecord && cachedRecordComplete) {
    return {
      data: cachedRecord.data,
      cacheHit: true,
      cacheable: true,
      remoteUploadTime: readResult.uploadTime,
      cacheUpdatedAt: cachedRecord.updatedAt,
    }
  }

  if (readResult.kind === "not-modified") {
    throw new Error("received not-modified response without a complete local cache")
  }

  const data = readResult.data
  const remoteUploadTime = readResult.uploadTime
  const cacheable = remoteUploadTime != null && isDeckRecommendUserDataResponseComplete(data, params.mode)
  const writtenRecord = remoteUploadTime == null || !isDeckRecommendUserDataResponseComplete(data, params.mode)
    ? null
    : await safeWriteUserDataCache(params, data, remoteUploadTime, dependencies.writeUserDataCache)

  return {
    data,
    cacheHit: false,
    cacheable,
    remoteUploadTime,
    cacheUpdatedAt: writtenRecord?.updatedAt ?? cachedRecord?.updatedAt ?? null,
  }
}

async function fetchDeckRecommendSuiteUserDataFromSnapshot(
  params: FetchDeckRecommendUserDataParams,
  strategy: DeckRecommendUserDataCacheStrategy,
  dependencies: DeckRecommendUserDataCacheDependencies,
): Promise<DeckRecommendUserDataFetchResult> {
  const result = await dependencies.fetchSuite({
    toolboxUserId: params.toolboxUserId,
    server: params.server,
    gameUserId: params.gameUserId,
    keys: DECK_RECOMMEND_SUITE_KEYS,
  }, { strategy })
  const data: DeckRecommendUserDataResponse = {
    server: params.server,
    gameUserId: String(params.gameUserId),
    mode: "suite",
    userData: result.data,
  }
  return {
    data,
    cacheHit: result.cacheHit,
    cacheable: result.cacheable && isDeckRecommendUserDataResponseComplete(data, "suite"),
    remoteUploadTime: result.remoteUploadTime,
    cacheUpdatedAt: result.cacheUpdatedAt,
  }
}

function mergeDeckRecommendUserDataFetchResults(
  params: FetchDeckRecommendUserDataParams,
  suiteResult: DeckRecommendUserDataFetchResult,
  mysekaiResult: DeckRecommendUserDataFetchResult,
): DeckRecommendUserDataFetchResult {
  return {
    data: {
      server: params.server,
      gameUserId: String(params.gameUserId),
      mode: "mysekai",
      userData: {
        ...suiteResult.data.userData,
        ...mysekaiResult.data.userData,
      },
    },
    cacheHit: suiteResult.cacheHit && mysekaiResult.cacheHit,
    cacheable: suiteResult.cacheable && mysekaiResult.cacheable,
    remoteUploadTime: mysekaiResult.remoteUploadTime ?? suiteResult.remoteUploadTime,
    cacheUpdatedAt: maxNullableNumber(suiteResult.cacheUpdatedAt, mysekaiResult.cacheUpdatedAt),
  }
}

async function safeReadUserDataCache(
  params: FetchDeckRecommendUserDataParams,
  readCache: typeof readDeckRecommendUserDataCache = readDeckRecommendUserDataCache,
): Promise<DeckRecommendUserDataCacheRecord | null> {
  try {
    const record = await readCache(params)
    if (!record) {
      return null
    }

    return {
      ...record,
      data: normalizeCachedUserDataResponse(params, record.data),
    }
  } catch {
    return null
  }
}

async function safeReadProfileCache(
  params: DeckRecommendProfileCacheKeyParams,
): Promise<DeckRecommendProfileCacheRecord | null> {
  try {
    return await readDeckRecommendProfileCache(params)
  } catch {
    return null
  }
}

function normalizeCachedUserDataResponse(
  params: FetchDeckRecommendUserDataParams,
  value: unknown,
): DeckRecommendUserDataResponse {
  if (isDeckRecommendUserDataResponse(value)) {
    return normalizeDeckRecommendUserDataResponse(value)
  }

  return {
    server: params.server,
    gameUserId: String(params.gameUserId),
    mode: params.mode,
    userData: unwrapGameAccountDataResponse(value),
  }
}

function isDeckRecommendUserDataResponse(value: unknown): value is DeckRecommendUserDataResponse {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && "userData" in value
  )
}

export function isDeckRecommendUserDataResponseComplete(
  value: DeckRecommendUserDataResponse,
  mode: FetchDeckRecommendUserDataParams["mode"],
): boolean {
  if (mode !== "suite") {
    return true
  }

  return isCompleteSuiteUserData(value.userData)
}

async function safeWriteUserDataCache(
  params: FetchDeckRecommendUserDataParams,
  data: DeckRecommendUserDataResponse,
  uploadTime: number,
  writeCache: typeof writeDeckRecommendUserDataCache = writeDeckRecommendUserDataCache,
): Promise<DeckRecommendUserDataCacheRecord | null> {
  try {
    return await writeCache(params, data, uploadTime)
  } catch {
    return null
  }
}

async function safeWriteProfileCache(
  params: DeckRecommendProfileCacheKeyParams,
  data: GetUserProfileResponse,
): Promise<DeckRecommendProfileCacheRecord | null> {
  try {
    return await writeDeckRecommendProfileCache(params, data)
  } catch {
    return null
  }
}

function maxNullableNumber(left: number | null, right: number | null): number | null {
  if (left == null) {
    return right
  }
  if (right == null) {
    return left
  }

  return Math.max(left, right)
}

function isCompleteSuiteUserData(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  return (
    isRecord(value.userGamedata)
    && Array.isArray(value.userAreas)
    && Array.isArray(value.userCards)
    && Array.isArray(value.userCharacters)
    && Array.isArray(value.userHonors)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function makeProfileRequestKey(params: DeckRecommendProfileCacheKeyParams): string {
  return [
    String(params.toolboxUserId).trim(),
    params.server,
    String(params.gameUserId).trim(),
  ].join(":")
}

function dedupeProfileAccounts(
  accounts: readonly { server: SekaiRegion; userId: string | number }[],
): Array<{ server: SekaiRegion; userId: string | number }> {
  const seen = new Set<string>()
  const result: Array<{ server: SekaiRegion; userId: string | number }> = []
  for (const account of accounts) {
    const key = `${account.server}:${String(account.userId).trim()}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(account)
  }
  return result
}
