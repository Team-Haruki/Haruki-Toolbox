import { expect, it, mock } from "bun:test"
import type { DeckRecommendUserDataReadResult } from "../api/recommend-data"
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

const { fetchDeckRecommendCachedUserData } = await import("./user-data")

it("reuses complete cached data on 304 and only persists timestamped 200 responses", async () => {
  const params = {
    toolboxUserId: "toolbox-user",
    server: "jp" as const,
    gameUserId: "123456789",
    mode: "suite" as const,
  }
  const cachedData = {
    server: "jp" as const,
    gameUserId: "123456789",
    mode: "suite" as const,
    userData: {
      userGamedata: { userId: 123456789 },
      userAreas: [],
      userCards: [],
      userCharacters: [],
      userHonors: [],
    },
  }
  const cachedRecord: DeckRecommendUserDataCacheRecord = {
    key: "suite:toolbox-user:jp:123456789",
    toolboxUserId: "toolbox-user",
    server: "jp",
    gameUserId: "123456789",
    mode: "suite",
    uploadTime: 1712345678,
    data: cachedData,
    updatedAt: 1712345678000,
  }
  let nextReadResult: DeckRecommendUserDataReadResult = {
    kind: "not-modified",
    uploadTime: cachedRecord.uploadTime,
  }
  const fetchUserData = mock(async () => nextReadResult)
  const readUserDataCache = mock(async () => cachedRecord)
  const writeUserDataCache = mock(async (_params, data, uploadTime) => ({
    ...cachedRecord,
    data,
    uploadTime,
    updatedAt: 1712345680000,
  }))
  const dependencies = {
    fetchUserData,
    readUserDataCache,
    writeUserDataCache,
  } as unknown as DeckRecommendUserDataCacheDependencies

  const notModified = await fetchDeckRecommendCachedUserData(params, "check-remote", dependencies)
  expect(notModified.cacheHit).toBe(true)
  expect(notModified.data).toEqual(cachedData)
  expect(fetchUserData).toHaveBeenLastCalledWith({
    ...params,
    knownUploadTime: cachedRecord.uploadTime,
  })
  expect(writeUserDataCache).not.toHaveBeenCalled()

  const changedData = {
    ...cachedData,
    userData: {
      ...cachedData.userData,
      userCards: [{ cardId: 1 }],
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
})
