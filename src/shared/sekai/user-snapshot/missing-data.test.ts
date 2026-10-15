import { describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders } from "axios"
import { getMissingUploadDataType } from "./missing-data"

function responseError(status: number, message: unknown, path = "/api/user/u/game-account/jp/123/suite") {
  const config = { url: path, headers: new AxiosHeaders() }
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, undefined, {
    status, statusText: "", data: { message }, headers: new AxiosHeaders(), config,
  })
}

describe("missing uploaded game data", () => {
  test("recognizes Suite and MySekai missing snapshots with query strings or absolute URLs", () => {
    expect(getMissingUploadDataType(responseError(404, "Player data not found."))).toBe("suite")
    expect(getMissingUploadDataType(responseError(404, "Player data not found.", "https://api.example/api/user/u/game-account/cn/123/mysekai?known_upload_time=1"))).toBe("mysekai")
    expect(getMissingUploadDataType(responseError(404, "suite data not found"))).toBe("suite")
  })

  test("does not confuse missing bindings, profiles, masterdata, or generic proxy 404s with uploads", () => {
    for (const message of ["binding not found", "game account not found", "Not Found", undefined, {}]) {
      expect(getMissingUploadDataType(responseError(404, message))).toBeNull()
    }
    for (const path of ["/api/user/u/game-account/jp/123/profile", "/v1/master/jp/current", "/missing"]) {
      expect(getMissingUploadDataType(responseError(404, "Player data not found.", path))).toBeNull()
    }
  })

  test("keeps authentication, permission, server and network failures as errors", () => {
    for (const status of [401, 403, 500, 502]) {
      expect(getMissingUploadDataType(responseError(status, "Player data not found."))).toBeNull()
    }
    expect(getMissingUploadDataType(new AxiosError("Network Error"))).toBeNull()
    expect(getMissingUploadDataType(new Error("404"))).toBeNull()
    expect(getMissingUploadDataType(null)).toBeNull()
  })
})
