import { isAxiosError, type AxiosRequestConfig } from "axios"
import { requestWithResponse } from "@/core/http/call-api"
import { asRecord, readString, type UnknownRecord } from "@/lib/record-utils"
import { useSettingsStore } from "@/shared/stores/settings"
import type { APIResponse } from "@/types"

// Browser endpoints of the OAuth2 device authorization grant (backend
// `hydra_device_browser.go`): claim a user code (lookup), then approve or deny
// the flow. They answer in the usual {status, message, updatedData} envelope:
// lookup 200 with the review card; approve 200 {status: "approved", …} or 202
// {status: "unconfirmed"}; deny 200 {status: "denied"}. An error carries its
// machine-readable code in updatedData.code (plus retryAfter on 429 and
// retryable on 502 approval_failed); the page never shows the message.

export const DEVICE_LOOKUP_PATH = "/api/oauth2/device/lookup"
export const DEVICE_APPROVE_PATH = "/api/oauth2/device/approve"
export const DEVICE_DENY_PATH = "/api/oauth2/device/deny"

/** Above the backend's 15 s approve deadline, below the app's 60 s default. */
export const DEVICE_REQUEST_TIMEOUT_MS = 30_000

export type DeviceScopeRisk = "identity" | "offline" | "read" | "write"
export type DeviceClientType = "public" | "confidential"
export type DeviceDenyReason = "user_denied" | "not_initiated_by_me"

export interface DeviceLookupClient {
  clientId: string
  clientName: string
  clientType: DeviceClientType
  /** Only ever true for confidential clients (`firstParty` ∧ confidential). */
  firstParty: boolean
  initiatorVerified: boolean
}

export interface DeviceLookupScope {
  scope: string
  risk: DeviceScopeRisk
}

export interface DeviceLookupAccount {
  userId: string
  name: string
}

export interface DeviceLookupResult {
  flowHandle: string
  userCode: string
  client: DeviceLookupClient
  scopes: DeviceLookupScope[]
  deviceLabel: string
  requestedAt: string
  expiresAt: string
  account: DeviceLookupAccount
  writeWarning: boolean
}

/** The backend leaves out an empty clientName, consentRequestId or accountName; they read as "". */
export type DeviceApproveResult =
  | { status: "approved"; clientName: string; consentRequestId: string; accountName: string }
  | { status: "unconfirmed" }

export interface DeviceApprovePayload {
  flowHandle: string
  userCode: string
  label?: string
}

/** A failed device endpoint call, reduced to what the page branches on. */
export interface DeviceApiError {
  /** HTTP status, or null when no response arrived (network error, timeout). */
  status: number | null
  /** `updatedData.code`, or "" when the response had none. */
  code: string
  /** `updatedData.retryAfter` in seconds; the page cannot read Retry-After (CORS). */
  retryAfter: number | null
  /** `updatedData.retryable`, when present. */
  retryable: boolean | null
}

// The backend classifies every scope on the review card (`deviceScopeRisks`)
// and the page shows the class it sends: station:room:write is red because
// BE-12 registered it as write there. The page keeps only two things of its
// own: the scope it has always known to be a write, which a reply can never
// downgrade, and the classes to fall back to when a reply carries no usable
// class (an unknown scope then counts as a write, the most cautious class).
const KNOWN_WRITE_SCOPES: ReadonlySet<string> = new Set(["game-data:write"])

const FALLBACK_RISKS: Record<string, DeviceScopeRisk> = {
  "openid": "identity",
  "profile": "identity",
  "offline_access": "offline",
  "user:read": "read",
  "bindings:read": "read",
  "game-data:read": "read",
}

const RISKS: readonly DeviceScopeRisk[] = ["identity", "offline", "read", "write"]

function isRisk(value: unknown): value is DeviceScopeRisk {
  return typeof value === "string" && (RISKS as readonly string[]).includes(value)
}

/**
 * The risk class of a scope: the backend's `risk`, except that a known write
 * scope is never downgraded. Without a usable class, known scopes use the
 * fallback table and unknown ones count as writes, the most cautious class.
 */
export function resolveScopeRisk(scope: string, reported?: unknown): DeviceScopeRisk {
  if (KNOWN_WRITE_SCOPES.has(scope)) {
    return "write"
  }
  if (isRisk(reported)) {
    return reported
  }
  return FALLBACK_RISKS[scope] ?? "write"
}

function readBoolean(record: UnknownRecord | null, key: string): boolean {
  return record?.[key] === true
}

function normalizeScopes(value: unknown): DeviceLookupScope[] {
  if (!Array.isArray(value)) {
    return []
  }
  const scopes: DeviceLookupScope[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const record = asRecord(item)
    const scope = typeof item === "string" ? item.trim() : record ? readString(record, ["scope"]).trim() : ""
    if (!scope || seen.has(scope)) {
      continue
    }
    seen.add(scope)
    scopes.push({ scope, risk: resolveScopeRisk(scope, record?.risk) })
  }
  return scopes
}

/**
 * The review card data of a lookup reply, or null when it lacks what the page
 * needs to continue (a flow handle and a client id).
 */
export function normalizeDeviceLookup(value: unknown): DeviceLookupResult | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const clientRecord = asRecord(record.client)
  const flowHandle = readString(record, ["flowHandle"]).trim()
  const clientId = clientRecord ? readString(clientRecord, ["clientId"]).trim() : ""
  if (!flowHandle || !clientId) {
    return null
  }
  const clientType: DeviceClientType = clientRecord?.clientType === "confidential" ? "confidential" : "public"
  const scopes = normalizeScopes(record.scopes)
  const accountRecord = asRecord(record.account)
  return {
    flowHandle,
    userCode: readString(record, ["userCode"]).trim(),
    client: {
      clientId,
      clientName: clientRecord ? readString(clientRecord, ["clientName"]).trim() : "",
      clientType,
      // A public client_id can be used by anyone: it is never "official".
      firstParty: clientType === "confidential" && readBoolean(clientRecord, "firstParty"),
      initiatorVerified: clientType === "confidential" && readBoolean(clientRecord, "initiatorVerified"),
    },
    scopes,
    deviceLabel: readString(record, ["deviceLabel"]),
    requestedAt: readString(record, ["requestedAt"]).trim(),
    expiresAt: readString(record, ["expiresAt"]).trim(),
    account: {
      userId: accountRecord ? readString(accountRecord, ["userId"]).trim() : "",
      name: accountRecord ? readString(accountRecord, ["name"]).trim() : "",
    },
    writeWarning: record.writeWarning === true || scopes.some((scope) => scope.risk === "write"),
  }
}

/**
 * The outcome of an approve reply. 202 means the last hop's result is
 * unknown (the device may still receive tokens), whatever the body says.
 */
export function normalizeDeviceApprove(httpStatus: number, value: unknown): DeviceApproveResult {
  const record = asRecord(value)
  if (httpStatus === 202 || !record || readString(record, ["status"]) !== "approved") {
    return { status: "unconfirmed" }
  }
  return {
    status: "approved",
    clientName: readString(record, ["clientName"]).trim(),
    consentRequestId: readString(record, ["consentRequestId"]).trim(),
    accountName: readString(record, ["accountName"]).trim(),
  }
}

function readRetryAfter(value: unknown): number | null {
  const seconds = typeof value === "string" ? Number(value) : value
  return typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

/** Reduces anything a device endpoint call threw to a DeviceApiError. */
export function readDeviceApiError(error: unknown): DeviceApiError {
  if (!isAxiosError(error) || !error.response) {
    return { status: null, code: "", retryAfter: null, retryable: null }
  }
  const updatedData = asRecord(asRecord(error.response.data)?.updatedData)
  const retryable = updatedData?.retryable
  return {
    status: error.response.status,
    code: updatedData ? readString(updatedData, ["code"]).trim() : "",
    retryAfter: readRetryAfter(updatedData?.retryAfter),
    retryable: typeof retryable === "boolean" ? retryable : null,
  }
}

/**
 * Request options shared by every device endpoint: the direct API host (design
 * Q6), no login redirect or toast on errors (the page maps every code itself),
 * no admin re-auth prompt and never an automatic retry — a retried approve
 * could act twice.
 */
export function deviceRequestConfig(baseURL: string): AxiosRequestConfig {
  return {
    method: "POST",
    baseURL,
    skipAuthRedirect: true,
    skipErrorToast: true,
    skipAdminReauth: true,
    retry: 0,
    timeout: DEVICE_REQUEST_TIMEOUT_MS,
  }
}

/** Device endpoints always use the direct API host, never the CDN host. */
function resolveDeviceApiBaseURL(): string {
  const settingsStore = useSettingsStore()
  return settingsStore.getEndpointUrl("direct") || settingsStore.currentEndpoint
}

async function postDevice<T>(path: string, data: Record<string, unknown>) {
  return await requestWithResponse<APIResponse<T>>(path, {
    ...deviceRequestConfig(resolveDeviceApiBaseURL()),
    data,
  })
}

/** Claims a user code for the signed-in account and returns the review card. */
export async function lookupDeviceCode(userCode: string): Promise<DeviceLookupResult> {
  const response = await postDevice<unknown>(DEVICE_LOOKUP_PATH, { userCode })
  const result = normalizeDeviceLookup(response.data?.updatedData)
  if (!result) {
    throw new Error("device lookup returned no flow")
  }
  return result
}

export async function approveDeviceFlow(payload: DeviceApprovePayload): Promise<DeviceApproveResult> {
  const body: Record<string, unknown> = {
    flowHandle: payload.flowHandle,
    userCode: payload.userCode,
    acknowledged: true,
  }
  if (payload.label) {
    body.label = payload.label
  }
  const response = await postDevice<unknown>(DEVICE_APPROVE_PATH, body)
  return normalizeDeviceApprove(response.status, response.data?.updatedData)
}

export async function denyDeviceFlow(flowHandle: string, reason: DeviceDenyReason): Promise<void> {
  await postDevice<unknown>(DEVICE_DENY_PATH, { flowHandle, reason })
}
