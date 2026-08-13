import { describe, expect, test } from "bun:test"
import type { UserSuiteFetchDependencies, UserSuiteFetchParams } from "./fetch"
import type { UserSuiteSubsetCacheRecord } from "./cache"

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

const { fetchCachedUserSuite } = await import("./fetch")

const params: UserSuiteFetchParams = {
  toolboxUserId: "7",
  server: "jp",
  gameUserId: "123",
  keys: ["userCards"],
}

function makeCacheRecord(overrides: Partial<UserSuiteSubsetCacheRecord> = {}): UserSuiteSubsetCacheRecord {
  return {
    key: "7:jp:123:userCards",
    toolboxUserId: "7",
    server: "jp",
    gameUserId: "123",
    signature: "userCards",
    uploadTime: 41,
    data: { userCards: [{ cardId: 1 }] },
    updatedAt: 1000,
    ...overrides,
  }
}

function makeDependencies(overrides: Partial<UserSuiteFetchDependencies>): UserSuiteFetchDependencies {
  return {
    fetchSubset: () => Promise.reject(new Error("unexpected fetch")),
    readCache: () => Promise.resolve(null),
    writeCache: () => Promise.reject(new Error("unexpected write")),
    ...overrides,
  }
}

describe("fetchCachedUserSuite", () => {
  test("prefer-cache returns a complete cached record without fetching", async () => {
    const record = makeCacheRecord()
    const result = await fetchCachedUserSuite(params, "prefer-cache", makeDependencies({
      readCache: () => Promise.resolve(record),
    }))

    expect(result.cacheHit).toBe(true)
    expect(result.data).toBe(record.data)
    expect(result.remoteUploadTime).toBe(41)
  })

  test("check-remote revalidates and reuses cache on not-modified", async () => {
    const record = makeCacheRecord()
    let sentKnownUploadTime: number | undefined
    const result = await fetchCachedUserSuite(params, "check-remote", makeDependencies({
      readCache: () => Promise.resolve(record),
      fetchSubset: (fetchParams) => {
        sentKnownUploadTime = fetchParams.knownUploadTime
        return Promise.resolve({ kind: "not-modified", uploadTime: 41 })
      },
    }))

    expect(sentKnownUploadTime).toBe(41)
    expect(result.cacheHit).toBe(true)
    expect(result.data).toBe(record.data)
  })

  test("writes fresh complete data to the cache", async () => {
    const freshData = { userCards: [{ cardId: 2 }], upload_time: 42 }
    let written: { uploadTime: number } | null = null
    const result = await fetchCachedUserSuite(params, "check-remote", makeDependencies({
      fetchSubset: () => Promise.resolve({ kind: "data", data: freshData, uploadTime: 42 }),
      writeCache: (_cacheParams, data, uploadTime) => {
        written = { uploadTime }
        return Promise.resolve(makeCacheRecord({ data, uploadTime, updatedAt: 2000 }))
      },
    }))

    expect(written).toEqual({ uploadTime: 42 })
    expect(result.cacheHit).toBe(false)
    expect(result.cacheable).toBe(true)
    expect(result.cacheUpdatedAt).toBe(2000)
  })

  test("does not cache data without an upload time", async () => {
    const result = await fetchCachedUserSuite(params, "check-remote", makeDependencies({
      fetchSubset: () => Promise.resolve({ kind: "data", data: { userCards: [] }, uploadTime: null }),
    }))

    expect(result.cacheable).toBe(false)
    expect(result.cacheHit).toBe(false)
  })

  test("incomplete cache is ignored and refetched without known upload time", async () => {
    const record = makeCacheRecord({ data: { userMusics: [] } })
    let sentKnownUploadTime: number | undefined = 999
    const result = await fetchCachedUserSuite(params, "prefer-cache", makeDependencies({
      readCache: () => Promise.resolve(record),
      fetchSubset: (fetchParams) => {
        sentKnownUploadTime = fetchParams.knownUploadTime
        return Promise.resolve({ kind: "data", data: { userCards: [], upload_time: 50 }, uploadTime: 50 })
      },
      writeCache: (_cacheParams, data, uploadTime) => Promise.resolve(makeCacheRecord({ data, uploadTime })),
    }))

    expect(sentKnownUploadTime).toBeUndefined()
    expect(result.cacheHit).toBe(false)
  })

  test("throws when not-modified arrives without a usable cache", async () => {
    await expect(fetchCachedUserSuite(params, "check-remote", makeDependencies({
      fetchSubset: () => Promise.resolve({ kind: "not-modified", uploadTime: 41 }),
    }))).rejects.toThrow()
  })
})
