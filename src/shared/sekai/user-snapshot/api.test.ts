import { describe, expect, test } from "bun:test"
import type { AxiosResponse } from "axios"
import type { UserSuiteRequester } from "./api"

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
  fetchUserSuiteSubset,
  isSuiteSubsetComplete,
  makeSuiteSubsetSignature,
  normalizeSuiteSubsetKeys,
  normalizeSuiteUploadTime,
  unwrapSuiteSubsetResponse,
} = await import("./api")

function makeResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "",
    headers: {},
    config: {},
  } as AxiosResponse<T>
}

describe("normalizeSuiteSubsetKeys", () => {
  test("dedupes, trims, sorts and drops upload_time", () => {
    expect(normalizeSuiteSubsetKeys(["userMusics", " userCards ", "userMusics", "upload_time", ""]))
      .toEqual(["userCards", "userMusics"])
  })
})

describe("makeSuiteSubsetSignature", () => {
  test("is order independent", () => {
    expect(makeSuiteSubsetSignature(["userEvents", "userWorldBlooms"]))
      .toBe(makeSuiteSubsetSignature(["userWorldBlooms", "userEvents"]))
  })
})

describe("normalizeSuiteUploadTime", () => {
  test("accepts finite positive numbers", () => {
    expect(normalizeSuiteUploadTime(1779105682333)).toBe(1779105682333)
  })

  test("parses numeric strings and $numberLong wrappers", () => {
    expect(normalizeSuiteUploadTime("1779105682333")).toBe(1779105682333)
    expect(normalizeSuiteUploadTime({ $numberLong: "1779105682333" })).toBe(1779105682333)
  })

  test("rejects invalid values", () => {
    expect(normalizeSuiteUploadTime(0)).toBeNull()
    expect(normalizeSuiteUploadTime("abc")).toBeNull()
    expect(normalizeSuiteUploadTime(null)).toBeNull()
  })
})

describe("unwrapSuiteSubsetResponse", () => {
  test("returns suite-like payloads directly", () => {
    const payload = { userCards: [], upload_time: 1 }
    expect(unwrapSuiteSubsetResponse(payload)).toBe(payload)
  })

  test("unwraps common envelope keys", () => {
    const payload = { userMusics: [{ musicId: 1 }], upload_time: 2 }
    expect(unwrapSuiteSubsetResponse({ updatedData: payload })).toBe(payload)
    expect(unwrapSuiteSubsetResponse({ data: payload })).toBe(payload)
  })

  test("recognizes subsets without upload_time via user-prefixed keys", () => {
    const payload = { userEvents: [] }
    expect(unwrapSuiteSubsetResponse({ data: payload })).toBe(payload)
  })

  test("throws on non-object payloads", () => {
    expect(() => unwrapSuiteSubsetResponse(null)).toThrow()
  })
})

describe("isSuiteSubsetComplete", () => {
  test("requires every requested key", () => {
    expect(isSuiteSubsetComplete({ userCards: [] }, ["userCards"])).toBe(true)
    expect(isSuiteSubsetComplete({ userCards: [] }, ["userCards", "userMusics"])).toBe(false)
  })
})

describe("fetchUserSuiteSubset", () => {
  test("requests the subset with key and known_upload_time params", async () => {
    let capturedUrl = ""
    let capturedParams: Record<string, unknown> | undefined
    const requester: UserSuiteRequester = (url, options) => {
      capturedUrl = url
      capturedParams = options?.params as Record<string, unknown>
      return Promise.resolve(makeResponse({ userCards: [], upload_time: 42 }))
    }

    const result = await fetchUserSuiteSubset(
      {
        toolboxUserId: 7,
        server: "jp",
        gameUserId: "123",
        keys: ["userCards"],
        knownUploadTime: 41,
      },
      requester,
    )

    expect(capturedUrl).toBe("/api/user/7/game-account/jp/123/suite")
    expect(capturedParams).toEqual({ key: "userCards,upload_time", known_upload_time: 41 })
    expect(result).toEqual({ kind: "data", data: { userCards: [], upload_time: 42 }, uploadTime: 42 })
  })

  test("maps 304 responses to not-modified with the known upload time", async () => {
    const requester: UserSuiteRequester = () => Promise.resolve(makeResponse(undefined, 304))

    const result = await fetchUserSuiteSubset(
      { toolboxUserId: 7, server: "jp", gameUserId: "123", keys: ["userCards"], knownUploadTime: 41 },
      requester,
    )

    expect(result).toEqual({ kind: "not-modified", uploadTime: 41 })
  })

  test("rejects a 304 without a known upload time", async () => {
    const requester: UserSuiteRequester = () => Promise.resolve(makeResponse(undefined, 304))

    await expect(fetchUserSuiteSubset(
      { toolboxUserId: 7, server: "jp", gameUserId: "123", keys: ["userCards"] },
      requester,
    )).rejects.toThrow()
  })
})
