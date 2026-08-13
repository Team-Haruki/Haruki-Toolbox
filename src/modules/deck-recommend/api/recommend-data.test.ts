import { describe, expect, it, mock } from "bun:test"
import type { AxiosRequestConfig, AxiosResponse } from "axios"
import type { DeckRecommendResponseRequester } from "./recommend-data"

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

const {
  fetchDeckRecommendMysekaiUserData,
  normalizeDeckRecommendUserDataResponse,
  normalizeDeckRecommendUploadTime,
  unwrapGameAccountDataResponse,
  unwrapUserProfileResponse,
} = await import("./recommend-data")

function createRequester(
  handler: (config: AxiosRequestConfig) => Pick<AxiosResponse, "data" | "status">,
): { requester: DeckRecommendResponseRequester; requests: AxiosRequestConfig[] } {
  const requests: AxiosRequestConfig[] = []
  const requester = mock(async (_url: string, config: AxiosRequestConfig = {}) => {
    requests.push(config)
    const response = handler(config)
    return {
      data: response.data,
      status: response.status,
      statusText: response.status === 304 ? "Not Modified" : "OK",
      headers: {},
      config: config as AxiosResponse["config"],
    }
  }) as unknown as DeckRecommendResponseRequester
  return { requester, requests }
}

describe("deck recommend data api helpers", () => {
  it("normalizes suite upload_time values", () => {
    expect(normalizeDeckRecommendUploadTime(1712345678)).toBe(1712345678)
    expect(normalizeDeckRecommendUploadTime("1712345678")).toBe(1712345678)
    expect(normalizeDeckRecommendUploadTime({ $numberLong: "1712345678" })).toBe(1712345678)
    expect(normalizeDeckRecommendUploadTime(0)).toBeNull()
    expect(normalizeDeckRecommendUploadTime(-1)).toBeNull()
    expect(normalizeDeckRecommendUploadTime("")).toBeNull()
    expect(normalizeDeckRecommendUploadTime({ value: 1712345678 })).toBeNull()
  })

  it("unwraps direct or updatedData user profile responses", () => {
    const directProfile = {
      userDeck: {
        leader: 101,
        member1: 101,
        member2: 102,
        member3: 103,
        member4: 104,
        member5: 105,
      },
    }
    expect(unwrapUserProfileResponse(directProfile)).toBe(directProfile)

    const wrappedProfile = {
      updatedData: directProfile,
    }
    expect(unwrapUserProfileResponse(wrappedProfile)).toBe(directProfile)
  })

  it("unwraps direct or updatedData game account data responses", () => {
    const directData = { userCards: [{ cardId: 1 }] }
    expect(unwrapGameAccountDataResponse(directData)).toBe(directData)
    expect(unwrapGameAccountDataResponse({ updatedData: directData })).toBe(directData)
  })

  it("unwraps Mongo-exported array game account data responses", () => {
    const directData = { userCards: [{ cardId: 1 }] }
    expect(unwrapGameAccountDataResponse([directData])).toBe(directData)
    expect(unwrapGameAccountDataResponse({ updatedData: [directData] })).toBe(directData)
  })

  it("unwraps nested API envelope game account data responses", () => {
    const directData = { userCards: [{ cardId: 1 }] }
    expect(unwrapGameAccountDataResponse({ data: { updatedData: [directData] } })).toBe(directData)
    expect(unwrapGameAccountDataResponse({ payload: { data: directData } })).toBe(directData)
  })

  it("normalizes cached deck recommend user data responses", () => {
    const directData = { userCards: [{ cardId: 1 }] }
    expect(normalizeDeckRecommendUserDataResponse({
      server: "jp",
      gameUserId: "123456789",
      mode: "suite",
      userData: [directData] as unknown as Record<string, unknown>,
    }).userData).toBe(directData)
  })
})

describe("deck recommend conditional data reads", () => {
  it("uses one mysekai request and the local stamp when the server returns 304", async () => {
    const { requester, requests } = createRequester(() => ({ data: "", status: 304 }))

    const result = await fetchDeckRecommendMysekaiUserData({
      toolboxUserId: "toolbox-user",
      server: "jp",
      gameUserId: "123456789",
      knownUploadTime: 1712345678,
    }, requester)

    expect(result).toEqual({ kind: "not-modified", uploadTime: 1712345678 })
    expect(requests).toHaveLength(1)
    expect(requests[0]?.params).toEqual({ known_upload_time: 1712345678 })
  })

  it("rejects a 304 mysekai response without a known upload time", async () => {
    const { requester } = createRequester(() => ({ data: "", status: 304 }))

    await expect(fetchDeckRecommendMysekaiUserData({
      toolboxUserId: "toolbox-user",
      server: "jp",
      gameUserId: "123456789",
    }, requester)).rejects.toThrow("received 304 without a valid known upload time")
  })

  it("accepts a legacy 200 response when the backend ignores the conditional parameter", async () => {
    const { requester, requests } = createRequester(() => ({
      status: 200,
      data: { upload_time: 1712345679, userMysekaiGates: [] },
    }))

    const result = await fetchDeckRecommendMysekaiUserData({
      toolboxUserId: "toolbox-user",
      server: "jp",
      gameUserId: "123456789",
      knownUploadTime: 1712345678,
    }, requester)

    expect(result).toEqual({
      kind: "data",
      uploadTime: 1712345679,
      data: {
        server: "jp",
        gameUserId: "123456789",
        mode: "mysekai",
        userData: { upload_time: 1712345679, userMysekaiGates: [] },
      },
    })
    expect(requests[0]?.params).toEqual({ known_upload_time: 1712345678 })
  })
})
