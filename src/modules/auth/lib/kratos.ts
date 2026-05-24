import { asRecord, readBoolean, readOptionalString } from "@/lib/record-utils"
import { getCurrentUser } from "@/modules/user-settings/api/me"
import type { UserSettings } from "@/types/get-settings"

export type KratosFlowType = "login" | "registration" | "recovery" | "verification" | "settings"
interface KratosBrowserFlowRedirectOptions {
  returnTo?: string
}

export interface KratosUiMessage {
  id?: number
  text?: string
  type?: string
}

export interface KratosUiNodeAttributes {
  name?: string
  type?: string
  value?: unknown
  required?: boolean
  disabled?: boolean
  src?: string
  id?: string
  nonce?: string
  integrity?: string
  crossorigin?: string
  referrerpolicy?: string
  async?: boolean
  defer?: boolean
  onclick?: string
  onclickTrigger?: string
  onload?: string
  onloadTrigger?: string
  autocomplete?: string
  node_type?: string
  [key: string]: unknown
}

export interface KratosUiNode {
  type?: string
  group?: string
  messages?: KratosUiMessage[]
  meta?: {
    label?: {
      text?: string
    }
  }
  attributes?: KratosUiNodeAttributes
}

export interface KratosBrowserFlow {
  id: string
  return_to?: string
  ui: {
    action: string
    method: string
    messages?: KratosUiMessage[]
    nodes: KratosUiNode[]
  }
}

interface KratosLogoutFlow {
  logout_url?: string
}

interface KratosVerifiableAddress {
  value?: string
  verified?: boolean
}

interface KratosWhoAmIResponse {
  id?: string
  active?: boolean
  issued_at?: string
  authenticated_at?: string
  expires_at?: string
  authenticator_assurance_level?: string
  devices?: Array<Record<string, unknown>>
  identity?: {
    id?: string
    external_id?: string
    traits?: Record<string, unknown>
    metadata_public?: Record<string, unknown>
    metadata_admin?: Record<string, unknown>
    verifiable_addresses?: KratosVerifiableAddress[]
  }
}

interface KratosDeleteSessionsCount {
  count?: number
}

export interface KratosFlowError {
  id?: string
  code?: number
  reason?: string
  message?: string
  details?: unknown
}

export interface KratosSessionBootstrap {
  sessionUser: UserSettings | null
  fullUser: UserSettings | null
}

export interface KratosSessionDevice {
  id: string
  ipAddress?: string
  location?: string
  userAgent?: string
}

export interface KratosSessionInfo {
  id: string
  active: boolean
  issuedAt?: string
  authenticatedAt?: string
  expiresAt?: string
  aal?: string
  devices: KratosSessionDevice[]
  current: boolean
}

function normalizeBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") ?? ""
}

export function getKratosPublicUrl(): string {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_HARUKI_TOOLBOX_AUTH_URL)
  if (envUrl) {
    return envUrl
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return ""
}

export function buildKratosUrl(path: string): string {
  const baseUrl = getKratosPublicUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}

export function redirectToKratosBrowserFlow(
  flowType: KratosFlowType,
  options: KratosBrowserFlowRedirectOptions = {}
) {
  if (typeof window === "undefined") {
    return
  }

  const query = new URLSearchParams()
  if (options.returnTo?.trim()) {
    query.set("return_to", options.returnTo.trim())
  }

  const suffix = query.toString()
  const path = suffix
    ? `/self-service/${flowType}/browser?${suffix}`
    : `/self-service/${flowType}/browser`
  window.location.assign(buildKratosUrl(path))
}

export function redirectToKratosLogout() {
  if (typeof window === "undefined") {
    return
  }

  window.location.assign(buildKratosUrl("/self-service/logout/browser"))
}

export async function createKratosLogoutUrl(): Promise<string> {
  const response = await fetch(buildKratosUrl("/self-service/logout/browser"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`kratos logout flow request failed: ${response.status}`)
  }

  const data = await response.json() as KratosLogoutFlow
  if (typeof data.logout_url !== "string" || data.logout_url.trim() === "") {
    throw new Error("kratos logout flow response is missing logout_url")
  }

  return data.logout_url
}

export async function fetchKratosBrowserFlow(flowType: KratosFlowType, flowId: string): Promise<KratosBrowserFlow> {
  const response = await fetch(
    buildKratosUrl(`/self-service/${flowType}/flows?id=${encodeURIComponent(flowId)}`),
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`kratos ${flowType} flow request failed: ${response.status}`)
  }

  return await response.json() as KratosBrowserFlow
}

export async function fetchKratosFlowError(errorId: string): Promise<KratosFlowError> {
  const response = await fetch(
    buildKratosUrl(`/self-service/errors?id=${encodeURIComponent(errorId)}`),
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`kratos error flow request failed: ${response.status}`)
  }

  const payload = await response.json() as unknown
  const root = asRecord(payload)
  const error = asRecord(root?.error)
  if (!error) {
    return {}
  }

  const codeValue = error.code
  const numericCode = typeof codeValue === "number"
    ? codeValue
    : typeof codeValue === "string"
      ? Number.parseInt(codeValue, 10)
      : Number.NaN

  return {
    id: readOptionalString(error, ["id"]),
    code: Number.isFinite(numericCode) ? numericCode : undefined,
    reason: readOptionalString(error, ["reason"]),
    message: readOptionalString(error, ["message"]),
    details: error.details,
  }
}

export async function fetchKratosWhoAmI(): Promise<KratosWhoAmIResponse | null> {
  const response = await fetch(buildKratosUrl("/sessions/whoami"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`kratos whoami request failed: ${response.status}`)
  }

  return await response.json() as KratosWhoAmIResponse
}

function normalizeKratosSessionDevice(value: unknown): KratosSessionDevice | null {
  const device = asRecord(value)
  if (!device) {
    return null
  }

  const id = readOptionalString(device, ["id"]) ?? ""
  if (!id) {
    return null
  }

  return {
    id,
    ipAddress: readOptionalString(device, ["ip_address", "ipAddress"]),
    location: readOptionalString(device, ["location"]),
    userAgent: readOptionalString(device, ["user_agent", "userAgent"]),
  }
}

function normalizeKratosSession(value: unknown, options: { currentId?: string; current?: boolean } = {}): KratosSessionInfo | null {
  const session = asRecord(value)
  if (!session) {
    return null
  }

  const id = readOptionalString(session, ["id"]) ?? ""
  if (!id) {
    return null
  }

  const devicesRaw = Array.isArray(session.devices) ? session.devices : []
  const devices = devicesRaw
    .map((device) => normalizeKratosSessionDevice(device))
    .filter((device): device is KratosSessionDevice => device !== null)

  const explicitCurrent = options.current === true
  const compareCurrent = options.currentId ? id === options.currentId : false

  return {
    id,
    active: readBoolean(session, ["active"], true),
    issuedAt: readOptionalString(session, ["issued_at", "issuedAt"]),
    authenticatedAt: readOptionalString(session, ["authenticated_at", "authenticatedAt"]),
    expiresAt: readOptionalString(session, ["expires_at", "expiresAt"]),
    aal: readOptionalString(session, ["authenticator_assurance_level", "authenticatorAssuranceLevel"]),
    devices,
    current: explicitCurrent || compareCurrent,
  }
}

export async function fetchKratosCurrentSession(): Promise<KratosSessionInfo | null> {
  const session = await fetchKratosWhoAmI()
  if (!session) {
    return null
  }

  return normalizeKratosSession(session, { current: true })
}

export async function fetchKratosMySessions(): Promise<KratosSessionInfo[]> {
  const response = await fetch(buildKratosUrl("/sessions"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  if (response.status === 401) {
    return []
  }

  if (!response.ok) {
    throw new Error(`kratos sessions request failed: ${response.status}`)
  }

  const payload = await response.json() as unknown
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((entry) => normalizeKratosSession(entry))
    .filter((entry): entry is KratosSessionInfo => entry !== null)
}

export async function disableKratosSession(sessionId: string): Promise<void> {
  const response = await fetch(buildKratosUrl(`/sessions/${encodeURIComponent(sessionId)}`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`kratos session revoke failed: ${response.status}`)
  }
}

export async function disableKratosOtherSessions(): Promise<number | null> {
  const response = await fetch(buildKratosUrl("/sessions"), {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`kratos revoke other sessions failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  const payload = await response.json() as KratosDeleteSessionsCount
  return typeof payload.count === "number" ? payload.count : null
}

export function resolveToolboxUserIdFromKratosSession(session: KratosWhoAmIResponse | null): string | null {
  if (!session) {
    return null
  }

  const identity = asRecord(session.identity)
  if (!identity) {
    return null
  }

  const metadataPublic = asRecord(identity.metadata_public)
  const publicUserId = metadataPublic
    ? readOptionalString(metadataPublic, ["public_user_id", "publicUserId"])
    : undefined

  if (publicUserId) {
    return publicUserId
  }

  const metadataAdmin = asRecord(identity.metadata_admin)
  const legacyUserId = metadataAdmin
    ? readOptionalString(metadataAdmin, ["legacy_user_id", "legacyUserId"])
    : undefined

  if (legacyUserId) {
    return legacyUserId
  }

  const externalId = readOptionalString(identity, ["external_id", "externalId"])
  if (externalId) {
    return externalId
  }

  const traits = asRecord(identity.traits)
  const fallback = traits
    ? readOptionalString(traits, ["public_user_id", "publicUserId", "userId", "legacy_user_id", "legacyUserId"])
    : undefined
  return fallback ?? null
}

export function resolveUserSettingsFromKratosSession(session: KratosWhoAmIResponse | null): UserSettings | null {
  const identity = asRecord(session?.identity)
  if (!identity) {
    return null
  }

  const toolboxUserId = resolveToolboxUserIdFromKratosSession(session)
  const traits = asRecord(identity.traits)
  const verifiableAddresses = Array.isArray(identity?.verifiable_addresses)
    ? identity.verifiable_addresses
    : []

  const name = traits ? readOptionalString(traits, ["name", "display_name", "username"]) : undefined
  const emailFromTraits = traits ? readOptionalString(traits, ["email"]) : undefined
  const firstVerifiableAddress = verifiableAddresses.find((item) => typeof item?.value === "string" && item.value.trim() !== "")
  const email = emailFromTraits ?? firstVerifiableAddress?.value
  const emailVerifiedFromTraits = traits?.email_verified
  const emailVerified = typeof emailVerifiedFromTraits === "boolean"
    ? emailVerifiedFromTraits
    : firstVerifiableAddress?.verified === true

  return {
    userId: toolboxUserId ?? undefined,
    kratosIdentityId: readOptionalString(identity, ["id"]),
    name,
    emailInfo: email ? { email, verified: emailVerified } : undefined,
  }
}

export async function bootstrapUserSettingsFromKratosSession(): Promise<KratosSessionBootstrap> {
  try {
    const response = await getCurrentUser({ skipErrorToast: true })
    return {
      sessionUser: response.updatedData ?? null,
      fullUser: response.updatedData ?? null,
    }
  } catch {
    const session = await fetchKratosWhoAmI()
    const sessionUser = resolveUserSettingsFromKratosSession(session)
    return {
      sessionUser,
      fullUser: null,
    }
  }
}
