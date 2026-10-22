import { beforeAll, describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import enUSCore from "@/shared/i18n/messages/en-US/en-US-core"
import { AdminReauthCancelledError } from "./admin-reauth"
import { classifyTransportError, describeError, extractErrorMessage, getApiErrorMessage, isNotFoundError, readApiErrorCode, readApiErrorStatus, shouldReportError } from "./error-utils"

function axiosError(options: {
  url?: string
  status?: number
  data?: unknown
  code?: string
  message?: string
}): AxiosError {
  const config = { url: options.url ?? "/api/user/1/upload", headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response = options.status === undefined
    ? undefined
    : ({ data: options.data, status: options.status, statusText: "", headers: {}, config } as AxiosResponse)
  return new AxiosError(
    options.message ?? (response ? `Request failed with status code ${response.status}` : "Network Error"),
    options.code ?? (response ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_NETWORK),
    config,
    undefined,
    response
  )
}

const backend = (status: number, message: string) => axiosError({ status, data: { status, message } })

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  i18n.global.mergeLocaleMessage("en-US", enUSCore)
  await setI18nLocale("zh-CN")
})

describe("getApiErrorMessage", () => {
  test("reads the backend envelope's message fields in order", () => {
    expect(getApiErrorMessage({ message: "a", detail: "b" })).toBe("a")
    expect(getApiErrorMessage({ error_description: "desc" })).toBe("desc")
    expect(getApiErrorMessage({ detail: "d" })).toBe("d")
    expect(getApiErrorMessage({ error: "e" })).toBe("e")
    expect(getApiErrorMessage("<html>502</html>")).toBeUndefined()
    expect(getApiErrorMessage(null)).toBeUndefined()
  })
})

describe("classifyTransportError", () => {
  test("recognises network, timeout, rate-limit and server failures", () => {
    expect(classifyTransportError(axiosError({ code: "ERR_NETWORK" }))).toEqual({ kind: "network" })
    expect(classifyTransportError(axiosError({ code: "ECONNABORTED", message: "timeout of 60000ms exceeded" }))).toEqual({ kind: "timeout" })
    expect(classifyTransportError(axiosError({ code: "ETIMEDOUT", message: "timeout exceeded" }))).toEqual({ kind: "timeout" })
    expect(classifyTransportError(backend(429, "rate limited"))).toEqual({ kind: "rateLimited", status: 429 })
    expect(classifyTransportError(backend(502, "bad gateway"))).toEqual({ kind: "serverUnavailable", status: 502 })
    expect(classifyTransportError(axiosError({ status: 404, data: "<html>not found</html>" }))).toEqual({ kind: "serverUnavailable", status: 404 })
  })

  test("leaves ordinary API failures, cancellations and non-transport errors alone", () => {
    expect(classifyTransportError(backend(400, "bad input"))).toBeNull()
    expect(classifyTransportError(axiosError({ code: "ERR_CANCELED", message: "canceled" }))).toBeNull()
    expect(classifyTransportError(new Error("boom"))).toBeNull()
    expect(classifyTransportError(new TypeError("Failed to fetch"))).toEqual({ kind: "network" })
    expect(classifyTransportError(null)).toBeNull()
  })
})

describe("describeError", () => {
  test("translates known backend messages with a next step", () => {
    const described = describeError(backend(400, "verification code missing in game profile"), "fallback")
    expect(described.message).toBe(zhCNCore.backendMessages.verificationCodeMissing)
    expect(described.detail).toBeUndefined()
  })

  test("translates a known message even on a 5xx or 401", () => {
    expect(describeError(backend(502, "game server unavailable"), "fallback").message).toBe(zhCNCore.backendMessages.gameServerUnavailable)
    expect(describeError(backend(401, "user not authenticated"), "fallback").message).toBe(zhCNCore.backendMessages.notAuthenticated)
  })

  test("interpolates captured parameters", () => {
    expect(describeError(backend(400, "inherit failed: 403"), "fallback").message).toContain("403")
    expect(describeError(backend(400, "inherit failed"), "fallback").message).toBe(zhCNCore.backendMessages.inheritFailed)
  })

  test("never shows axios' own messages", () => {
    expect(describeError(axiosError({ code: "ERR_NETWORK" }), "fallback")).toEqual({ message: zhCNCore.core.errors.network })
    expect(describeError(axiosError({ code: "ECONNABORTED", message: "timeout of 60000ms exceeded" }), "fallback")).toEqual({ message: zhCNCore.core.errors.timeout })
    expect(describeError(axiosError({ status: 502, data: "<html>502 Bad Gateway</html>" }), "fallback")).toEqual({
      message: zhCNCore.core.errors.serverUnavailable.replace("{status}", "502"),
    })
    expect(describeError(backend(429, "slow down"), "fallback")).toEqual({ message: zhCNCore.core.errors.rateLimited, detail: "slow down" })
  })

  test("keeps an unknown backend message as detail under the caller's fallback", () => {
    expect(describeError(backend(400, "something nobody mapped"), "操作失败了")).toEqual({
      message: "操作失败了",
      detail: "something nobody mapped",
    })
    expect(describeError(backend(500, "db exploded"), "fallback")).toEqual({
      message: zhCNCore.core.errors.serverUnavailable.replace("{status}", "500"),
      detail: "db exploded",
    })
    expect(describeError(backend(400, ""), "fallback")).toEqual({ message: "fallback" })
  })

  test("passes app-authored Error text through and maps known strings", () => {
    expect(describeError(new Error("已翻译的提示"), "fallback")).toEqual({ message: "已翻译的提示" })
    expect(describeError(new Error("ticket is closed"), "fallback").message).toBe(zhCNCore.backendMessages.ticketClosed)
    expect(describeError(new Error(""), "fallback")).toEqual({ message: "fallback" })
    expect(describeError(new TypeError("Failed to fetch"), "fallback")).toEqual({ message: zhCNCore.core.errors.network })
  })

  test("falls back for non-error values", () => {
    expect(describeError(undefined, "fallback")).toEqual({ message: "fallback" })
    expect(describeError(42, "fallback")).toEqual({ message: "fallback" })
    expect(describeError("raw string", "fallback")).toEqual({ message: "fallback", detail: "raw string" })
  })

  test("reports a cancelled admin re-authentication", () => {
    const error = axiosError({ url: "/api/admin/config/runtime", status: 403, data: { status: 403, message: "reauthentication required" } })
    expect(describeError(error, "fallback")).toEqual({ message: zhCNCore.core.auth.reauthRequired })
  })

  test("truncates very long raw details", () => {
    const long = "x".repeat(600)
    const { detail } = describeError(backend(400, long), "fallback")
    expect(detail?.length).toBeLessThan(260)
    expect(detail?.endsWith("…")).toBe(true)
  })
})

describe("extractErrorMessage", () => {
  test("returns the translated message alone when nothing is left to explain", () => {
    expect(extractErrorMessage(backend(400, "upload not allowed"))).toBe(zhCNCore.backendMessages.uploadNotAllowed)
    expect(extractErrorMessage(axiosError({ code: "ERR_NETWORK" }), "fallback")).toBe(zhCNCore.core.errors.network)
  })

  test("appends an unknown raw message on a details line", () => {
    expect(extractErrorMessage(backend(400, "weird thing"), "操作失败")).toBe("操作失败\n详情：weird thing")
  })

  test("uses the generic fallback by default", () => {
    expect(extractErrorMessage(undefined)).toBe(zhCNCore.common.actionFailed)
  })

  test("follows the active locale", async () => {
    await setI18nLocale("en-US")
    try {
      expect(extractErrorMessage(backend(400, "weird thing"), "Failed")).toBe("Failed\nDetails: weird thing")
      expect(extractErrorMessage(backend(400, "ticket not found"))).toBe(enUSCore.backendMessages.ticketNotFound)
    } finally {
      await setI18nLocale("zh-CN")
    }
  })
})

describe("shouldReportError", () => {
  test("is false only for a cancelled admin reauth", () => {
    expect(shouldReportError(new AdminReauthCancelledError(new Error("403")))).toBe(false)
    expect(shouldReportError(new Error("boom"))).toBe(true)
    expect(shouldReportError(backend(403, "forbidden"))).toBe(true)
    expect(shouldReportError(undefined)).toBe(true)
  })

  test("a cancelled admin reauth still describes as a reauth requirement for call sites that report it", () => {
    const original = axiosError({ url: "/api/admin/users/1/role", status: 403, data: { status: 403, message: "reauthentication required" } })
    expect(extractErrorMessage(new AdminReauthCancelledError(original), "fallback")).toBe(zhCNCore.core.auth.reauthRequired)
  })
})

describe("readApiErrorCode", () => {
  test("reads updatedData.code and trims it", () => {
    expect(readApiErrorCode(axiosError({ status: 400, data: { updatedData: { code: " some_code " } } }))).toBe("some_code")
    expect(readApiErrorCode(new Error("x"))).toBe("")
  })
})

describe("isNotFoundError", () => {
  test("is true only for a 404 response", () => {
    expect(isNotFoundError(axiosError({ status: 404, data: { message: "user not found" } }))).toBe(true)
    expect(readApiErrorStatus(axiosError({ status: 404, data: { message: "user not found" } }))).toBe(404)
    expect(isNotFoundError(axiosError({ status: 500, data: { message: "boom" } }))).toBe(false)
    expect(isNotFoundError(new Error("boom"))).toBe(false)
    expect(readApiErrorStatus(new Error("boom"))).toBeNull()
    expect(isNotFoundError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(false)
  })
})
