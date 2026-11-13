import { describe, expect, it } from "bun:test"
import type { UserSuiteSubsetParams, UserSuiteSubsetReadResult } from "./api"

// The HTTP client behind `./api` reads the session stores when it loads.
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

const { fetchUserSuiteExport } = await import("./export")

const account = { toolboxUserId: "toolbox-1", server: "jp" as const, gameUserId: "123456" }

function dependencies(result: UserSuiteSubsetReadResult, calls: UserSuiteSubsetParams[] = []) {
  return {
    fetchSubset: async (params: UserSuiteSubsetParams) => {
      calls.push(params)
      return result
    },
    now: () => new Date(2026, 0, 2, 3, 4, 5).getTime(),
  }
}

describe("fetchUserSuiteExport", () => {
  it("asks for every table and names the file by the upload time", async () => {
    const calls: UserSuiteSubsetParams[] = []
    const uploadedAt = new Date(2026, 10, 13, 18, 27, 13).getTime()
    const data = { upload_time: uploadedAt / 1000, userCards: [{ cardId: 1 }] }
    const file = await fetchUserSuiteExport(
      account,
      dependencies({ kind: "data", data, uploadTime: uploadedAt / 1000 }, calls),
    )

    expect(calls).toEqual([{ ...account, keys: [] }])
    expect(file.fileName).toBe("suite-jp-123456-20261113-182713.json")
    expect(JSON.parse(file.json)).toEqual(data)
  })

  it("names the file by the current time when the upload time is unknown", async () => {
    const file = await fetchUserSuiteExport(
      account,
      dependencies({ kind: "data", data: { userCards: [] }, uploadTime: null }),
    )
    expect(file.fileName).toBe("suite-jp-123456-20260102-030405.json")
  })

  it("fails when the server sends no data", async () => {
    await expect(
      fetchUserSuiteExport(account, dependencies({ kind: "not-modified", uploadTime: 1 })),
    ).rejects.toThrow("suite export received no data")
  })
})
