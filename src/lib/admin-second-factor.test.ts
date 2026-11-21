import { describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { isAdminSecondFactorRequiredError } from "./admin-second-factor"

function apiError(url: string, status: number, message: string): AxiosError {
  const config = { url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response = {
    data: { status, message },
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse
  return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, undefined, response)
}

const MESSAGE = "administrator access requires two-factor authentication"

describe("isAdminSecondFactorRequiredError", () => {
  test("matches the 403 of an admin route by status, prefix and message", () => {
    expect(isAdminSecondFactorRequiredError(apiError("/api/admin/statistics/dashboard", 403, MESSAGE))).toBe(true)
    expect(isAdminSecondFactorRequiredError(apiError("https://api.example/api/admin/users?page=1", 403, `  ${MESSAGE.toUpperCase()} `))).toBe(true)
  })

  test("leaves other refusals alone", () => {
    // The re-authentication prompt and a plain denial are different 403s.
    expect(isAdminSecondFactorRequiredError(apiError("/api/admin/config/runtime", 403, "reauthentication required"))).toBe(false)
    expect(isAdminSecondFactorRequiredError(apiError("/api/admin/users", 403, "permission denied"))).toBe(false)
    // Same words outside the admin API, or with another status.
    expect(isAdminSecondFactorRequiredError(apiError("/api/user/me", 403, MESSAGE))).toBe(false)
    expect(isAdminSecondFactorRequiredError(apiError("/api/admin/users", 401, MESSAGE))).toBe(false)
    expect(isAdminSecondFactorRequiredError(new Error(MESSAGE))).toBe(false)
    expect(isAdminSecondFactorRequiredError(null)).toBe(false)
  })

  test("reads a response without a message as no match", () => {
    const error = apiError("/api/admin/users", 403, MESSAGE)
    error.response!.data = "forbidden"
    expect(isAdminSecondFactorRequiredError(error)).toBe(false)
  })
})
