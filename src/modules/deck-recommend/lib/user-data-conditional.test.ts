import { expect, it, mock } from "bun:test"
import type { UserSuiteFetchResult } from "@/shared/sekai/user-snapshot/fetch"
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
  const dependencies = { fetchSuite } as unknown as DeckRecommendUserDataCacheDependencies

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
})

it("reads the MySekai bonus tables from the Suite upload", () => {
  // The MySekai deck mode needs no MySekai upload: its gate, canvas and
  // fixture-character bonuses are Suite tables.
  expect(DECK_RECOMMEND_SUITE_KEYS).toEqual(expect.arrayContaining([
    "userMysekaiCanvases",
    "userMysekaiFixtureGameCharacterPerformanceBonuses",
    "userMysekaiGates",
  ]))
})
