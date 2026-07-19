import { expect, it, mock } from "bun:test"
import type { DeckRecommendUserDataReadResult } from "../api/recommend-data"
import type { UserSuiteFetchResult } from "@/shared/sekai/user-snapshot/fetch"
import type { DeckRecommendUserDataCacheRecord } from "./user-data-cache"
import type { DeckRecommendUserDataCacheDependencies } from "./user-data"

const storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

const { fetchDeckRecommendCachedUserData, DECK_RECOMMEND_SUITE_KEYS } = await import("./user-data")

it("reuses complete cached mysekai data on 304 and only persists timestamped 200 responses", async () => {
  const params = {
    toolboxUserId: "toolbox-user",
    server: "jp" as const,
    gameUserId: "123456789",
    mode: "mysekai" as const,
  }
  const cachedData = {
    server: "jp" as const,
    gameUserId: "123456789",
    mode: "mysekai" as const,
    userData: {
      userMysekaiGamedata: { userId: 123456789 },
      userMysekaiGates: [],
    },
  }
  const cachedRecord: DeckRecommendUserDataCacheRecord = {
    key: "mysekai:toolbox-user:jp:123456789",
    toolboxUserId: "toolbox-user",
    server: "jp",
    gameUserId: "123456789",
    mode: "mysekai",
    uploadTime: 1712345678,
    data: cachedData,
    updatedAt: 1712345678000,
  }
  let nextReadResult: DeckRecommendUserDataReadResult = {
    kind: "not-modified",
    uploadTime: cachedRecord.uploadTime,
  }
  const fetchSuite = mock(async () => {
    throw new Error("unexpected suite fetch")
  })
  const fetchMysekaiUserData = mock(async () => nextReadResult)
  const readUserDataCache = mock(async () => cachedRecord)
  const writeUserDataCache = mock(async (_params, data, uploadTime) => ({
    ...cachedRecord,
    data,
    uploadTime,
    updatedAt: 1712345680000,
  }))
  const dependencies = {
    fetchSuite,
    fetchMysekaiUserData,
    readUserDataCache,
    writeUserDataCache,
  } as unknown as DeckRecommendUserDataCacheDependencies

  const preferCache = await fetchDeckRecommendCachedUserData(params, "prefer-cache", dependencies)
  expect(preferCache.cacheHit).toBe(true)
  expect(preferCache.data).toEqual(cachedData)
  expect(fetchMysekaiUserData).not.toHaveBeenCalled()

  const notModified = await fetchDeckRecommendCachedUserData(params, "check-remote", dependencies)
  expect(notModified.cacheHit).toBe(true)
  expect(notModified.data).toEqual(cachedData)
  expect(fetchMysekaiUserData).toHaveBeenLastCalledWith({
    ...params,
    knownUploadTime: cachedRecord.uploadTime,
  })
  expect(writeUserDataCache).not.toHaveBeenCalled()

  const changedData = {
    ...cachedData,
    userData: {
      ...cachedData.userData,
      userMysekaiGates: [{ mysekaiGateId: 1 }],
    },
  }
  nextReadResult = {
    kind: "data",
    data: changedData,
    uploadTime: 1712345679,
  }
  const changed = await fetchDeckRecommendCachedUserData(params, "check-remote", dependencies)
  expect(changed.cacheHit).toBe(false)
  expect(changed.cacheable).toBe(true)
  expect(writeUserDataCache).toHaveBeenCalledTimes(1)
  expect(writeUserDataCache).toHaveBeenLastCalledWith(params, changedData, 1712345679)

  nextReadResult = {
    kind: "data",
    data: changedData,
    uploadTime: null,
  }
  const unstamped = await fetchDeckRecommendCachedUserData(params, "check-remote", dependencies)
  expect(unstamped.cacheHit).toBe(false)
  expect(unstamped.cacheable).toBe(false)
  expect(writeUserDataCache).toHaveBeenCalledTimes(1)
  expect(fetchSuite).not.toHaveBeenCalled()
})

it("routes suite mode through the shared user snapshot fetch and keeps strict completeness gating", async () => {
  const params = {
    toolboxUserId: "toolbox-user",
    server: "jp" as const,
    gameUserId: "123456789",
    mode: "suite" as const,
  }
  const completeUserData = {
    userGamedata: { userId: 123456789 },
    userAreas: [],
    userCards: [{ cardId: 1 }],
    userCharacters: [],
    userHonors: [],
  }
  let nextSuiteResult: UserSuiteFetchResult = {
    data: completeUserData,
    cacheHit: true,
    cacheable: true,
    remoteUploadTime: 1712345678,
    cacheUpdatedAt: 1712345678000,
  }
  const fetchSuite = mock(async () => nextSuiteResult)
  const fetchMysekaiUserData = mock(async () => {
    throw new Error("unexpected mysekai fetch")
  })
  const readUserDataCache = mock(async () => null)
  const writeUserDataCache = mock(async () => {
    throw new Error("unexpected cache write")
  })
  const dependencies = {
    fetchSuite,
    fetchMysekaiUserData,
    readUserDataCache,
    writeUserDataCache,
  } as unknown as DeckRecommendUserDataCacheDependencies

  const hit = await fetchDeckRecommendCachedUserData(params, "prefer-cache", dependencies)
  expect(fetchSuite).toHaveBeenLastCalledWith({
    toolboxUserId: "toolbox-user",
    server: "jp",
    gameUserId: "123456789",
    keys: DECK_RECOMMEND_SUITE_KEYS,
  }, { strategy: "prefer-cache" })
  expect(hit).toEqual({
    data: {
      server: "jp",
      gameUserId: "123456789",
      mode: "suite",
      userData: completeUserData,
    },
    cacheHit: true,
    cacheable: true,
    remoteUploadTime: 1712345678,
    cacheUpdatedAt: 1712345678000,
  })

  nextSuiteResult = {
    data: {
      ...completeUserData,
      userGamedata: "broken",
    },
    cacheHit: false,
    cacheable: true,
    remoteUploadTime: 1712345679,
    cacheUpdatedAt: null,
  }
  const incomplete = await fetchDeckRecommendCachedUserData(params, "check-remote", dependencies)
  expect(fetchSuite).toHaveBeenLastCalledWith({
    toolboxUserId: "toolbox-user",
    server: "jp",
    gameUserId: "123456789",
    keys: DECK_RECOMMEND_SUITE_KEYS,
  }, { strategy: "check-remote" })
  expect(incomplete.cacheHit).toBe(false)
  expect(incomplete.cacheable).toBe(false)
  expect(incomplete.data.userData).toEqual(nextSuiteResult.data)

  expect(fetchMysekaiUserData).not.toHaveBeenCalled()
  expect(readUserDataCache).not.toHaveBeenCalled()
  expect(writeUserDataCache).not.toHaveBeenCalled()
})
