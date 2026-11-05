import { afterAll, expect, mock, test } from "bun:test"

const storage = {
  length: 0, clear: () => undefined, getItem: () => null, key: () => null,
  removeItem: () => undefined, setItem: () => undefined,
}
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

// mock.module patches the real modules in place, so keep them to restore.
const callApi = await import("@/core/http/call-api")
const realRequest = callApi.request

const requestMock = mock(async (url: string) => ({ updatedData: { url, userDeck: { leader: 1 } } }))
const fetchSuiteMock = mock(async () => ({
  data: { userGamedata: {}, userAreas: [], userCards: [], userCharacters: [], userHonors: [] },
  cacheHit: false, cacheable: true, remoteUploadTime: 1, cacheUpdatedAt: 2,
}))
mock.module("@/core/http/call-api", () => ({ ...callApi, request: requestMock }))

afterAll(() => {
  mock.module("@/core/http/call-api", () => ({ ...callApi, request: realRequest }))
})

const { fetchDeckRecommendCachedUserData, DECK_RECOMMEND_SUITE_KEYS } = await import("./user-data")
const { getUserProfile } = await import("../api/recommend-data")

test("deck user data is one Suite subset read, with no MySekai request", async () => {
  // The cached-data helper accepts dependencies directly, even if another test
  // has already loaded user-data and captured its default fetchSuite reference.
  const result = await fetchDeckRecommendCachedUserData({
    toolboxUserId: "u", server: "cn", gameUserId: "1", mode: "suite",
  }, "check-remote", { fetchSuite: fetchSuiteMock })
  expect(fetchSuiteMock).toHaveBeenCalledTimes(1)
  expect(fetchSuiteMock).toHaveBeenLastCalledWith({
    toolboxUserId: "u", server: "cn", gameUserId: "1", keys: DECK_RECOMMEND_SUITE_KEYS,
  }, { strategy: "check-remote" })
  expect(result.data.mode).toBe("suite")
  expect(result.cacheable).toBe(true)
  expect(requestMock).not.toHaveBeenCalled()
})

test("the profile read goes to the profile data type with a cache-busting stamp", async () => {
  const profile = await getUserProfile({ toolboxUserId: "u", server: "cn", gameUserId: "1" })
  expect(requestMock).toHaveBeenCalledTimes(1)
  const [url, options] = requestMock.mock.calls[0] as unknown as [string, { params: Record<string, unknown> }]
  expect(url).toEndWith("/game-account/cn/1/profile")
  expect(typeof options.params.t).toBe("number")
  expect(profile.userDeck).toEqual({ leader: 1 })
})
