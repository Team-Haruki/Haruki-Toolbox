import { describe, expect, it } from "bun:test"

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
  normalizeDeckRecommendUserDataResponse,
  normalizeDeckRecommendUploadTime,
  unwrapGameAccountDataKeyResponse,
  unwrapGameAccountDataResponse,
  unwrapUserProfileResponse,
} = await import("./recommend-data")

describe("deck recommend data api helpers", () => {
  it("normalizes suite upload_time values", () => {
    expect(normalizeDeckRecommendUploadTime(1712345678)).toBe(1712345678)
    expect(normalizeDeckRecommendUploadTime("1712345678")).toBe(1712345678)
    expect(normalizeDeckRecommendUploadTime({ $numberLong: "1712345678" })).toBe(1712345678)
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

  it("unwraps explicit game account data key responses", () => {
    const userGamedata = { userId: 123, deck: 1 }
    expect(unwrapGameAccountDataKeyResponse(userGamedata, "userGamedata")).toBe(userGamedata)
    expect(unwrapGameAccountDataKeyResponse({ updatedData: { userGamedata } }, "userGamedata")).toBe(userGamedata)
    expect(unwrapGameAccountDataKeyResponse({ data: { updatedData: { userGamedata } } }, "userGamedata")).toBe(userGamedata)
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
