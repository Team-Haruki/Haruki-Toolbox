import {
  fetchUserSuiteSubset,
  isSuiteSubsetComplete,
  type UserSuiteSubsetParams,
} from "./api"
import {
  makeUserSuiteSubsetCacheKey,
  readUserSuiteSubsetCache,
  writeUserSuiteSubsetCache,
  type UserSuiteSubsetCacheRecord,
} from "./cache"

export type UserSuiteFetchStrategy = "prefer-cache" | "check-remote"

export type UserSuiteFetchParams = Omit<UserSuiteSubsetParams, "knownUploadTime">

export type UserSuiteFetchResult = {
  data: Record<string, unknown>
  cacheHit: boolean
  cacheable: boolean
  remoteUploadTime: number | null
  cacheUpdatedAt: number | null
}

export type UserSuiteFetchDependencies = {
  fetchSubset: typeof fetchUserSuiteSubset
  readCache: typeof readUserSuiteSubsetCache
  writeCache: typeof writeUserSuiteSubsetCache
}

const defaultDependencies: UserSuiteFetchDependencies = {
  fetchSubset: fetchUserSuiteSubset,
  readCache: readUserSuiteSubsetCache,
  writeCache: writeUserSuiteSubsetCache,
}

const inflightRequests = new Map<string, Promise<UserSuiteFetchResult>>()

export async function fetchUserSuiteWithCache(
  params: UserSuiteFetchParams,
  options: { strategy?: UserSuiteFetchStrategy } = {},
): Promise<UserSuiteFetchResult> {
  const strategy = options.strategy ?? "check-remote"
  const requestKey = `${strategy}:${makeUserSuiteSubsetCacheKey(params)}`
  const runningRequest = inflightRequests.get(requestKey)
  if (runningRequest) {
    return runningRequest
  }

  const request = fetchCachedUserSuite(params, strategy).finally(() => {
    inflightRequests.delete(requestKey)
  })
  inflightRequests.set(requestKey, request)
  return request
}

export async function fetchCachedUserSuite(
  params: UserSuiteFetchParams,
  strategy: UserSuiteFetchStrategy,
  dependencies: UserSuiteFetchDependencies = defaultDependencies,
): Promise<UserSuiteFetchResult> {
  const cachedRecord = await safeReadCache(params, dependencies.readCache)
  const cachedRecordComplete = cachedRecord
    ? isSuiteSubsetComplete(cachedRecord.data, params.keys)
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

  const readResult = await dependencies.fetchSubset({
    ...params,
    knownUploadTime: cachedRecord && cachedRecordComplete ? cachedRecord.uploadTime : undefined,
  })
  if (readResult.kind === "not-modified") {
    if (!cachedRecord || !cachedRecordComplete) {
      throw new Error("received not-modified response without a complete local cache")
    }

    return {
      data: cachedRecord.data,
      cacheHit: true,
      cacheable: true,
      remoteUploadTime: readResult.uploadTime,
      cacheUpdatedAt: cachedRecord.updatedAt,
    }
  }

  const data = readResult.data
  const remoteUploadTime = readResult.uploadTime
  const cacheable = remoteUploadTime != null && isSuiteSubsetComplete(data, params.keys)
  const writtenRecord = cacheable
    ? await safeWriteCache(params, data, remoteUploadTime, dependencies.writeCache)
    : null

  return {
    data,
    cacheHit: false,
    cacheable,
    remoteUploadTime,
    cacheUpdatedAt: writtenRecord?.updatedAt ?? cachedRecord?.updatedAt ?? null,
  }
}

async function safeReadCache(
  params: UserSuiteFetchParams,
  readCache: typeof readUserSuiteSubsetCache,
): Promise<UserSuiteSubsetCacheRecord | null> {
  try {
    return await readCache(params)
  } catch {
    return null
  }
}

async function safeWriteCache(
  params: UserSuiteFetchParams,
  data: Record<string, unknown>,
  uploadTime: number,
  writeCache: typeof writeUserSuiteSubsetCache,
): Promise<UserSuiteSubsetCacheRecord | null> {
  try {
    return await writeCache(params, data, uploadTime)
  } catch {
    return null
  }
}
