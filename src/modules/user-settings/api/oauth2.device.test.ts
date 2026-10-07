import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios"
import type { Router } from "vue-router"

function installStorageStub(name: "localStorage" | "sessionStorage") {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

const DIRECT = "https://direct.example"
const CDN = "https://cdn.example"

type DeviceApi = typeof import("./oauth2.device")
let api: DeviceApi
const ENV_KEYS = ["VITE_HARUKI_TOOLBOX_DIRECT_URL", "VITE_HARUKI_TOOLBOX_CDN_URL"] as const
const savedEnv = new Map<string, string | undefined>()
let originalAdapter: InternalAxiosRequestConfig["adapter"]

beforeAll(async () => {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  // import.meta.env is process.env under bun; the settings store reads these.
  for (const key of ENV_KEYS) {
    savedEnv.set(key, process.env[key])
  }
  process.env.VITE_HARUKI_TOOLBOX_DIRECT_URL = `${DIRECT}/`
  process.env.VITE_HARUKI_TOOLBOX_CDN_URL = CDN
  api = await import("./oauth2.device")
})

// Test files share one process: leave the HTTP client and env as found.
afterAll(async () => {
  const { apiClient } = await import("@/core/http/call-api")
  apiClient.defaults.adapter = originalAdapter
  apiClient.interceptors.request.clear()
  apiClient.interceptors.response.clear()
  for (const [key, value] of savedEnv) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
})

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  if (status === null) {
    return new AxiosError("Network Error", "ERR_NETWORK", config)
  }
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  })
}

// A lookup reply as the backend's deviceReviewCard marshals it: every key is
// always present, times are RFC 3339 to the second, and a public client is
// never first party or initiator-verified.
const LOOKUP = {
  flowHandle: "dfh_abc",
  userCode: "BCDF-GHJK",
  client: { clientId: "haruki-client", clientName: "Haruki Client", clientType: "public", firstParty: false, initiatorVerified: false },
  scopes: [
    { scope: "user:read", risk: "read" },
    { scope: "offline_access", risk: "offline" },
    { scope: "station:room:write", risk: "write" },
  ],
  deviceLabel: "Haruki-Client @ home-server",
  requestedAt: "2026-10-07T08:00:00Z",
  expiresAt: "2026-10-07T08:09:59Z",
  account: { userId: "12345", name: "Seiun" },
  writeWarning: true,
}

describe("normalizeDeviceLookup", () => {
  it("reads the review card of the lookup endpoint", () => {
    expect(api.normalizeDeviceLookup(LOOKUP)).toEqual({
      flowHandle: "dfh_abc",
      userCode: "BCDF-GHJK",
      client: {
        clientId: "haruki-client",
        clientName: "Haruki Client",
        clientType: "public",
        firstParty: false,
        initiatorVerified: false,
      },
      scopes: [
        { scope: "user:read", risk: "read" },
        { scope: "offline_access", risk: "offline" },
        { scope: "station:room:write", risk: "write" },
      ],
      deviceLabel: "Haruki-Client @ home-server",
      requestedAt: "2026-10-07T08:00:00Z",
      expiresAt: "2026-10-07T08:09:59Z",
      account: { userId: "12345", name: "Seiun" },
      writeWarning: true,
    })
  })

  it("never shows a public client as official, whatever the reply says", () => {
    const result = api.normalizeDeviceLookup({
      ...LOOKUP,
      client: { ...LOOKUP.client, firstParty: true, initiatorVerified: true },
    })
    expect(result?.client).toMatchObject({ clientType: "public", firstParty: false, initiatorVerified: false })
  })

  it("keeps the official badge for first-party confidential clients", () => {
    const result = api.normalizeDeviceLookup({
      ...LOOKUP,
      client: { clientId: "c", clientName: "C", clientType: "confidential", firstParty: true, initiatorVerified: true },
    })
    expect(result?.client).toMatchObject({ clientType: "confidential", firstParty: true, initiatorVerified: true })
  })

  it("takes each scope's class from the backend", () => {
    const result = api.normalizeDeviceLookup({
      ...LOOKUP,
      scopes: [
        { scope: "openid", risk: "identity" },
        { scope: "game-data:read", risk: "read" },
        { scope: "station:room:write", risk: "write" },
      ],
    })
    expect(result?.scopes.map((item) => item.risk)).toEqual(["identity", "read", "write"])
  })

  it("never lets a known write scope look harmless", () => {
    const result = api.normalizeDeviceLookup({
      ...LOOKUP,
      scopes: [{ scope: "game-data:write", risk: "read" }, { scope: "game-data:write" }, { scope: "station:room:write" }],
      writeWarning: false,
    })
    expect(result?.scopes).toEqual([
      { scope: "game-data:write", risk: "write" },
      // Without a class from the backend, a scope the page has no fallback for is a write.
      { scope: "station:room:write", risk: "write" },
    ])
    expect(result?.writeWarning).toBe(true)
  })

  it("falls back to the scope table and treats unknown scopes as writes", () => {
    const result = api.normalizeDeviceLookup({
      ...LOOKUP,
      scopes: ["openid", { scope: "profile", risk: "bogus" }, { scope: "future:thing" }, "openid", { scope: "" }],
      writeWarning: false,
    })
    expect(result?.scopes).toEqual([
      { scope: "openid", risk: "identity" },
      { scope: "profile", risk: "identity" },
      { scope: "future:thing", risk: "write" },
    ])
    expect(result?.writeWarning).toBe(true)
  })

  it("rejects replies without a flow handle or client", () => {
    expect(api.normalizeDeviceLookup(null)).toBeNull()
    expect(api.normalizeDeviceLookup({ ...LOOKUP, flowHandle: "" })).toBeNull()
    expect(api.normalizeDeviceLookup({ ...LOOKUP, client: null })).toBeNull()
  })

  it("defaults missing optional fields", () => {
    const result = api.normalizeDeviceLookup({ flowHandle: "dfh_x", client: { clientId: "x" } })
    expect(result).toMatchObject({
      userCode: "",
      client: { clientId: "x", clientName: "", clientType: "public", firstParty: false },
      scopes: [],
      deviceLabel: "",
      account: { userId: "", name: "" },
      writeWarning: false,
    })
  })
})

describe("normalizeDeviceApprove", () => {
  it("reads an approved reply", () => {
    expect(api.normalizeDeviceApprove(200, { status: "approved", clientName: "Haruki Client", consentRequestId: "c1", accountName: "Seiun" }))
      .toEqual({ status: "approved", clientName: "Haruki Client", consentRequestId: "c1", accountName: "Seiun" })
  })

  it("reads an approved reply whose empty fields the backend left out", () => {
    expect(api.normalizeDeviceApprove(200, { status: "approved", clientName: "haruki-client" }))
      .toEqual({ status: "approved", clientName: "haruki-client", consentRequestId: "", accountName: "" })
  })

  it("treats 202 and unexpected bodies as unconfirmed", () => {
    expect(api.normalizeDeviceApprove(202, { status: "unconfirmed" })).toEqual({ status: "unconfirmed" })
    expect(api.normalizeDeviceApprove(202, { status: "approved" })).toEqual({ status: "unconfirmed" })
    expect(api.normalizeDeviceApprove(200, null)).toEqual({ status: "unconfirmed" })
  })
})

describe("readDeviceApiError", () => {
  it("reads code, retryAfter and retryable from updatedData", () => {
    expect(api.readDeviceApiError(axiosError(429, { status: 429, message: "too many requests, retry later", updatedData: { code: "rate_limited", retryAfter: 42 } })))
      .toEqual({ status: 429, code: "rate_limited", retryAfter: 42, retryable: null })
    expect(api.readDeviceApiError(axiosError(502, { status: 502, message: "the authorization could not be completed", updatedData: { code: "approval_failed", retryable: false } })))
      .toEqual({ status: 502, code: "approval_failed", retryAfter: null, retryable: false })
    expect(api.readDeviceApiError(axiosError(409, { status: 409, message: "this request has already been handled", updatedData: { code: "already_handled" } })))
      .toEqual({ status: 409, code: "already_handled", retryAfter: null, retryable: null })
  })

  it("has no code for gateway errors", () => {
    // Oathkeeper's own JSON error, and the session guard's envelope without updatedData.
    expect(api.readDeviceApiError(axiosError(401, { error: { code: 401, status: "Unauthorized", message: "Access credentials are invalid" } })))
      .toEqual({ status: 401, code: "", retryAfter: null, retryable: null })
    expect(api.readDeviceApiError(axiosError(401, { status: 401, message: "user not authenticated" }))).toEqual({ status: 401, code: "", retryAfter: null, retryable: null })
    expect(api.readDeviceApiError(axiosError(404, "Not Found"))).toEqual({ status: 404, code: "", retryAfter: null, retryable: null })
  })

  it("reports network errors and anything else without a status", () => {
    expect(api.readDeviceApiError(axiosError(null))).toEqual({ status: null, code: "", retryAfter: null, retryable: null })
    expect(api.readDeviceApiError(new Error("boom"))).toEqual({ status: null, code: "", retryAfter: null, retryable: null })
  })
})

describe("device requests", () => {
  it("never redirect, toast, prompt or retry", () => {
    expect(api.deviceRequestConfig(DIRECT)).toEqual({
      method: "POST",
      baseURL: DIRECT,
      skipAuthRedirect: true,
      skipErrorToast: true,
      skipAdminReauth: true,
      retry: 0,
      timeout: api.DEVICE_REQUEST_TIMEOUT_MS,
    })
  })

  it("go to the direct API host even when the CDN endpoint is selected", async () => {
    const { createPinia, setActivePinia } = await import("pinia")
    setActivePinia(createPinia())
    const { useSettingsStore } = await import("@/shared/stores/settings")
    const { apiClient, setupInterceptors, request } = await import("@/core/http/call-api")
    originalAdapter = apiClient.defaults.adapter
    useSettingsStore().setPreferredEndpoint("cdn")
    setupInterceptors({ currentRoute: { value: { fullPath: "/device" } } } as unknown as Router)

    const sent: InternalAxiosRequestConfig[] = []
    const replies: Array<{ status: number; data: unknown }> = [
      { status: 200, data: { status: 200, message: "ok", updatedData: LOOKUP } },
      { status: 202, data: { status: 202, message: "device approval outcome unknown", updatedData: { status: "unconfirmed" } } },
      { status: 200, data: { status: 200, message: "device denied", updatedData: { status: "denied" } } },
      { status: 200, data: { status: 200, message: "ok" } },
    ]
    const adapter: AxiosAdapter = async (config) => {
      sent.push(config)
      const reply = replies.shift() ?? { status: 200, data: {} }
      return { ...reply, statusText: "", headers: {}, config }
    }
    apiClient.defaults.adapter = adapter

    const review = await api.lookupDeviceCode("BCDF-GHJK")
    expect(review.flowHandle).toBe("dfh_abc")
    expect(await api.approveDeviceFlow({ flowHandle: "dfh_abc", userCode: "BCDF-GHJK" })).toEqual({ status: "unconfirmed" })
    await api.denyDeviceFlow("dfh_abc", "not_initiated_by_me")
    // Any other request still follows the selected endpoint.
    await request("/api/health")

    expect(sent.map((config) => [config.baseURL, config.url, config.method])).toEqual([
      [DIRECT, api.DEVICE_LOOKUP_PATH, "post"],
      [DIRECT, api.DEVICE_APPROVE_PATH, "post"],
      [DIRECT, api.DEVICE_DENY_PATH, "post"],
      [CDN, "/api/health", "get"],
    ])
    expect(sent.slice(0, 3).map((config) => JSON.parse(String(config.data)))).toEqual([
      { userCode: "BCDF-GHJK" },
      // No label key at all when none was chosen.
      { flowHandle: "dfh_abc", userCode: "BCDF-GHJK", acknowledged: true },
      { flowHandle: "dfh_abc", reason: "not_initiated_by_me" },
    ])
    expect(sent[0]?.headers.get("Content-Type")).toBe("application/json")
  })

  it("send a chosen label with approve and never retry it", async () => {
    const { apiClient } = await import("@/core/http/call-api")
    const sent: InternalAxiosRequestConfig[] = []
    apiClient.defaults.adapter = async (config) => {
      sent.push(config)
      throw new AxiosError("Network Error", "ERR_NETWORK", config)
    }

    const failure = await api.approveDeviceFlow({ flowHandle: "dfh_abc", userCode: "BCDF-GHJK", label: "My NAS" }).catch((error: unknown) => error)
    expect(api.readDeviceApiError(failure)).toEqual({ status: null, code: "", retryAfter: null, retryable: null })
    expect(sent).toHaveLength(1)
    expect(JSON.parse(String(sent[0]?.data))).toEqual({ flowHandle: "dfh_abc", userCode: "BCDF-GHJK", acknowledged: true, label: "My NAS" })
  })
})
