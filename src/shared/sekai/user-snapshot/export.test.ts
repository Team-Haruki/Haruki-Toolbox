import { describe, expect, it } from "bun:test"
import type { request } from "@/core/http/call-api"

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

const account = { toolboxUserId: "toolbox-1", server: "jp" as const, gameUserId: "28808221489823746" }

function dependencies(json: string, calls: Parameters<typeof request>[] = []) {
  return {
    request: async <T>(...args: Parameters<typeof request>): Promise<T> => {
      calls.push(args)
      return json as T
    },
    now: () => new Date(2026, 0, 2, 3, 4, 5).getTime(),
  }
}

describe("fetchUserSuiteExport", () => {
  it("requests the full Suite as text and preserves all numeric IDs verbatim", async () => {
    const calls: Parameters<typeof request>[] = []
    const uploadedAt = new Date(2026, 10, 13, 18, 27, 13).getTime()
    const json = `{"upload_time":${uploadedAt / 1000},"userGamedata":{"userId":28808221489823746},"userCards":[{"id":9223372036854775807,"cardId":1}]}`
    const file = await fetchUserSuiteExport(account, dependencies(json, calls))

    expect(calls).toEqual([[
      "/api/user/toolbox-1/game-account/jp/28808221489823746/suite",
      { responseType: "text" },
    ]])
    expect(file.fileName).toBe("suite-jp-28808221489823746-20261113-182713.json")
    expect(file.json).toBe(json)
    // Demonstrate why a parse/stringify round-trip cannot produce the file.
    expect(JSON.stringify(JSON.parse(json))).not.toBe(json)
  })

  it("names the file by the current time when the upload time is unknown", async () => {
    const file = await fetchUserSuiteExport(account, dependencies('{"userCards":[]}'))
    expect(file.fileName).toBe("suite-jp-28808221489823746-20260102-030405.json")
  })

  it("rejects empty, invalid, and non-object responses", async () => {
    for (const raw of ["", "not json", "null", "[]", "42"]) {
      await expect(fetchUserSuiteExport(account, dependencies(raw))).rejects.toThrow()
    }
  })
})
