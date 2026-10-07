import { type UnknownRecord, asRecord, readBoolean, readRecord, readStringArray } from "@/lib/record-utils"
import type { OAuthClient, OAuthClientDevicePolicy } from "@/types/admin"

export const GRANT_TYPE_AUTHORIZATION_CODE = "authorization_code"
export const GRANT_TYPE_REFRESH_TOKEN = "refresh_token"
/** RFC 8628 device authorization grant. */
export const GRANT_TYPE_DEVICE_CODE = "urn:ietf:params:oauth:grant-type:device_code"

/** The grant types the admin form manages, in display and payload order. */
export const AVAILABLE_GRANT_TYPES = [
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_DEVICE_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
] as const

export type ManagedGrantType = (typeof AVAILABLE_GRANT_TYPES)[number]

/**
 * What the backend registers when a create omits `grantTypes`, and what every
 * client created before the device grant existed has.
 */
export const DEFAULT_GRANT_TYPES: readonly ManagedGrantType[] = [GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN]

export const DEVICE_MAX_CODES_PER_10M_MIN = 1
export const DEVICE_MAX_CODES_PER_10M_MAX = 600
export const DEVICE_MAX_CODES_PER_10M_DEFAULT = 60

export const DEFAULT_DEVICE_POLICY: Readonly<OAuthClientDevicePolicy> = {
  firstParty: false,
  allowWrite: false,
  maxCodesPer10m: DEVICE_MAX_CODES_PER_10M_DEFAULT,
}

/** The only scope `devicePolicy.allowWrite` unlocks over the device grant. */
export const DEVICE_WRITE_SCOPE = "game-data:write"

type DeviceFields = Required<Pick<OAuthClient, "grantTypes" | "deviceEnabled" | "devicePolicy">>

function readPositiveInteger(record: UnknownRecord, keys: readonly string[], fallback: number): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value
    }
  }
  return fallback
}

/** Reads `devicePolicy` of a client record; missing members read as the backend's defaults. */
export function readOAuthClientDevicePolicy(item: UnknownRecord): OAuthClientDevicePolicy {
  const policy = readRecord(item, ["devicePolicy", "device_policy"])
  if (!policy) {
    return { ...DEFAULT_DEVICE_POLICY }
  }
  return {
    firstParty: readBoolean(policy, ["firstParty", "first_party"]),
    allowWrite: readBoolean(policy, ["allowWrite", "allow_write"]),
    maxCodesPer10m: readPositiveInteger(policy, ["maxCodesPer10m", "max_codes_per_10m"], DEVICE_MAX_CODES_PER_10M_DEFAULT),
  }
}

/**
 * Reads the grant fields of a client record. A record without `grantTypes`
 * (a backend that predates the device grant) is an authorization code client
 * with refresh tokens, which is what that backend always registered.
 */
export function readOAuthClientDeviceFields(value: unknown): DeviceFields {
  const item = asRecord(value) ?? {}
  const grantTypes = readStringArray(item, ["grantTypes", "grant_types"])
  const effectiveGrantTypes = grantTypes.length > 0 ? grantTypes : [...DEFAULT_GRANT_TYPES]
  return {
    grantTypes: effectiveGrantTypes,
    deviceEnabled: readBoolean(item, ["deviceEnabled", "device_enabled"], effectiveGrantTypes.includes(GRANT_TYPE_DEVICE_CODE)),
    devicePolicy: readOAuthClientDevicePolicy(item),
  }
}

/** The managed grant types of a client, in payload order; unknown grant types are dropped. */
export function toManagedGrantTypes(grantTypes: readonly string[]): ManagedGrantType[] {
  return AVAILABLE_GRANT_TYPES.filter((grantType) => grantTypes.includes(grantType))
}

export function sameGrantTypes(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return leftSet.size === rightSet.size && [...leftSet].every((grantType) => rightSet.has(grantType))
}

export function hasDeviceGrant(grantTypes: readonly string[]): boolean {
  return grantTypes.includes(GRANT_TYPE_DEVICE_CODE)
}

export function hasAuthorizationCodeGrant(grantTypes: readonly string[]): boolean {
  return grantTypes.includes(GRANT_TYPE_AUTHORIZATION_CODE)
}

type DeviceWriteParams = {
  clientType: NonNullable<OAuthClient["clientType"]>
  grantTypes: readonly string[]
  scopes: readonly string[]
}

/**
 * `devicePolicy.allowWrite` is only for public clients with the device grant
 * and the game-data:write scope; the backend answers 400
 * `device_write_requires_public_client` otherwise.
 */
export function canAllowDeviceWrite(params: DeviceWriteParams): boolean {
  return params.clientType === "public" && hasDeviceGrant(params.grantTypes) && params.scopes.includes(DEVICE_WRITE_SCOPE)
}

/** `devicePolicy.firstParty` is a badge the device page shows for confidential clients only. */
export function isFirstPartyApplicable(clientType: NonNullable<OAuthClient["clientType"]>): boolean {
  return clientType === "confidential"
}

export function isValidMaxCodesPer10m(value: number): boolean {
  return Number.isInteger(value) && value >= DEVICE_MAX_CODES_PER_10M_MIN && value <= DEVICE_MAX_CODES_PER_10M_MAX
}
