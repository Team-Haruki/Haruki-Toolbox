import { expect, test } from "bun:test"
import { AxiosError, AxiosHeaders } from "axios"

const storage = {
  length: 0, clear: () => undefined, getItem: () => null, key: () => null,
  removeItem: () => undefined, setItem: () => undefined,
}
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })
const { refreshDeckRecommendSuitesForBoundAccounts } = await import("./user-data")

function missingDataError(message: string) {
  const config = { url: "/api/user/u/game-account/jp/2/suite", headers: new AxiosHeaders() }
  return new AxiosError("Request failed with status code 404", undefined, config, undefined, {
    status: 404, statusText: "Not Found", data: { message }, config, headers: new AxiosHeaders(),
  })
}

test("prefetch counts missing uploads separately from real failures and continues across accounts", async () => {
  const progress: number[] = []
  const result = await refreshDeckRecommendSuitesForBoundAccounts({
    toolboxUserId: "u",
    accounts: [1, 2, 3, 4, 5, 1].map((userId) => ({ server: "jp" as const, userId })),
    onProgress: (value) => progress.push(value.completed),
  }, async (params) => {
    if (Number(params.gameUserId) === 2) throw missingDataError("Player data not found.")
    if (Number(params.gameUserId) === 3) throw missingDataError("binding not found")
    if (Number(params.gameUserId) === 4) throw new Error("Network Error")
    return {
      data: { server: "jp", gameUserId: String(params.gameUserId), mode: "suite", userData: {} },
      cacheHit: Number(params.gameUserId) === 5, cacheable: true, remoteUploadTime: 1, cacheUpdatedAt: 1,
    }
  })
  expect(result).toEqual({ refreshed: 2, updated: 1, missing: 1, failed: 2, total: 5 })
  expect(progress).toEqual([1, 2, 3, 4, 5])
})

test("all missing snapshots are actionable missing uploads rather than refresh failures", async () => {
  const result = await refreshDeckRecommendSuitesForBoundAccounts({
    toolboxUserId: "u", accounts: [{ server: "jp", userId: "2" }],
  }, async () => { throw missingDataError("Player data not found.") })
  expect(result).toEqual({ refreshed: 0, updated: 0, missing: 1, failed: 0, total: 1 })
})
