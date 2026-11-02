import { getMissingUploadDataType } from "@/shared/sekai/user-snapshot/missing-data"
import { markDeckRecommendUserDataAvailable, markDeckRecommendUserDataMissing } from "./user-data-availability"
import {
  getUserProfile,
  type DeckRecommendUserDataResponse,
  type FetchDeckRecommendUserDataParams,
  type GetUserProfileResponse,
} from "../api/recommend-data"
import { fetchUserSuiteWithCache } from "@/shared/sekai/user-snapshot/fetch"
import type { SekaiRegion } from "@/types/store"
import {
  makeDeckRecommendUserDataCacheKey,
  readDeckRecommendProfileCache,
  writeDeckRecommendProfileCache,
  type DeckRecommendProfileCacheRecord,
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
  missing: number
  refreshed: number
  updated: number
  failed: number
  total: number
}

export type RefreshDeckRecommendSuitesProgress = {
  completed: number
  total: number
}

const userDataRequests = new Map<string, Promise<DeckRecommendUserDataFetchResult>>()
const profileRequests = new Map<string, Promise<DeckRecommendProfileFetchResult>>()

/**
 * Everything the deck engine reads from a player, for every mode. The MySekai
 * mode's inputs are Suite tables too: the canvas, fixture-character and gate
 * bonuses below come from the account data (Suite) upload, and the engine
 * reads nothing from the MySekai upload, so that upload is never required.
 */
export const DECK_RECOMMEND_SUITE_KEYS = [
  "userAreas",
  "userCards",
  "userCharacters",
  "userGamedata",
  "userHonors",
  // MySekai canvas/fixture/gate bonuses feed the engine's power calculation;
  // without them every deck reports 0 fixture/gate bonus power.
  "userMysekaiCanvases",
  "userMysekaiFixtureGameCharacterPerformanceBonuses",
  "userMysekaiGates",
] as const

export type DeckRecommendUserDataCacheDependencies = {
  fetchSuite: typeof fetchUserSuiteWithCache
}

const defaultUserDataCacheDependencies: DeckRecommendUserDataCacheDependencies = {
  fetchSuite: fetchUserSuiteWithCache,
}

export async function fetchDeckRecommendUserDataWithCache(
  params: FetchDeckRecommendUserDataParams,
  options: { strategy?: DeckRecommendUserDataCacheStrategy } = {},
): Promise<DeckRecommendUserDataFetchResult> {
  // Every fetch (the deck page, the home data panel's refresh, the session
  // prefetch) keeps the "no data uploaded" flag current for this account.
  try {
    const result = await fetchDeckRecommendSingleUserDataWithCache(params, options.strategy ?? "check-remote")
    markDeckRecommendUserDataAvailable(params.server, params.gameUserId, params.mode)
    return result
  } catch (error) {
    if (getMissingUploadDataType(error)) {
      markDeckRecommendUserDataMissing(params.server, params.gameUserId, params.mode)
    }
    throw error
  }
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
}, fetchUserData: typeof fetchDeckRecommendUserDataWithCache = fetchDeckRecommendUserDataWithCache): Promise<RefreshDeckRecommendSuitesResult> {
  const uniqueAccounts = dedupeProfileAccounts(input.accounts)
  const result: RefreshDeckRecommendSuitesResult = {
    missing: 0,
    refreshed: 0,
    updated: 0,
    failed: 0,
    total: uniqueAccounts.length,
  }

  let completed = 0
  for (const account of uniqueAccounts) {
    try {
      const fetchResult = await fetchUserData({
        toolboxUserId: input.toolboxUserId,
        server: account.server,
        gameUserId: account.userId,
        mode: "suite",
      }, { strategy: "check-remote" })
      result.refreshed += 1
      if (!fetchResult.cacheHit) {
        result.updated += 1
      }
      markDeckRecommendUserDataAvailable(account.server, account.userId, "suite")
    } catch (error) {
      if (getMissingUploadDataType(error)) {
        result.missing += 1
        markDeckRecommendUserDataMissing(account.server, account.userId, "suite")
      } else {
        result.failed += 1
      }
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
  return fetchDeckRecommendSuiteUserDataFromSnapshot(params, strategy, dependencies)
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
    cacheable: result.cacheable && isDeckRecommendUserDataResponseComplete(data),
    remoteUploadTime: result.remoteUploadTime,
    cacheUpdatedAt: result.cacheUpdatedAt,
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

export function isDeckRecommendUserDataResponseComplete(value: DeckRecommendUserDataResponse): boolean {
  return isCompleteSuiteUserData(value.userData)
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
