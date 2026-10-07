import type { OAuthClient, OAuthClientDevicePolicy } from "@/types/admin"
import {
  DEFAULT_DEVICE_POLICY,
  GRANT_TYPE_REFRESH_TOKEN,
  type ManagedGrantType,
  canAllowDeviceWrite,
  hasAuthorizationCodeGrant,
  hasDeviceGrant,
  isFirstPartyApplicable,
  isValidMaxCodesPer10m,
  sameGrantTypes,
  toManagedGrantTypes,
} from "@/modules/admin-oauth-clients/lib/grant-types"

type OAuthClientType = NonNullable<OAuthClient["clientType"]>

export const DEFAULT_CLIENT_TYPE: OAuthClientType = "confidential"
export const DEFAULT_SCOPE = "user:read"

export const AVAILABLE_SCOPE_IDS = [
  "user:read",
  "bindings:read",
  "game-data:read",
  "game-data:write",
  "station:room:write",
  "openid",
  "profile",
  "email",
  "offline_access",
] as const

/** Scopes that let a client act, not only read, on the user's behalf. */
export const WRITE_SCOPE_IDS: ReadonlySet<string> = new Set(["game-data:write", "station:room:write"])

type ValidatePayloadParams = {
  clientId?: string
  name: string
  clientType: OAuthClientType
  scopes: string[]
  grantTypes: string[]
  redirectUris: string[]
  postLogoutRedirectUris?: string[]
  /** The policy in the form; it only applies while the device grant is selected. */
  devicePolicy: OAuthClientDevicePolicy
  /** The client's saved policy on edit; the defaults on create. */
  initialDevicePolicy?: OAuthClientDevicePolicy
}

export type ValidatePayloadErrorCode =
  | "clientIdAndNameRequired"
  | "nameRequired"
  | "grantTypeRequired"
  | "redirectUriRequired"
  | "scopeRequired"
  | "oidcScopeRequiresOpenid"
  | "postLogoutRequiresRedirectUris"
  | "offlineAccessRequiresRefreshToken"
  | "deviceRequiresUserRead"
  | "deviceWriteRequiresPublicClient"
  | "invalidDevicePolicy"

type ValidatePayloadResult =
  | {
    normalizedUris: string[]
    normalizedPostLogoutUris: string[]
    grantTypes: ManagedGrantType[]
    devicePolicy: OAuthClientDevicePolicy
  }
  | { errorCode: ValidatePayloadErrorCode }

export function toggleScopeSelection<T extends string>(scopes: T[], scopeId: T, checked: boolean): T[] {
  if (checked) {
    if (scopes.includes(scopeId)) {
      return scopes
    }
    return [...scopes, scopeId]
  }

  return scopes.filter((scope) => scope !== scopeId)
}

/** Grant types toggle like scopes; the payload order comes from toManagedGrantTypes. */
export const toggleGrantTypeSelection = toggleScopeSelection<ManagedGrantType>

export function normalizeRedirectUris(uris: string[]) {
  return uris.map((uri) => uri.trim()).filter(Boolean)
}

type DevicePolicyParams = Pick<ValidatePayloadParams, "clientType" | "grantTypes" | "devicePolicy" | "initialDevicePolicy">

/**
 * The devicePolicy a save sends. With the device grant selected it is the
 * form's. Without it the policy controls are hidden, so their edits must not
 * block a save: the saved policy is sent with allowWrite cleared, because the
 * backend refuses allowWrite on a client without the device grant. firstParty
 * only means something for confidential clients and is sent as false otherwise.
 */
export function resolveDevicePolicy(params: DevicePolicyParams): OAuthClientDevicePolicy {
  const source = hasDeviceGrant(params.grantTypes)
    ? params.devicePolicy
    : { ...(params.initialDevicePolicy ?? DEFAULT_DEVICE_POLICY), allowWrite: false }
  return {
    firstParty: isFirstPartyApplicable(params.clientType) && source.firstParty,
    allowWrite: source.allowWrite,
    maxCodesPer10m: source.maxCodesPer10m,
  }
}

/**
 * Checks a create or edit before it is sent, with the backend's rules
 * (oauth2-integration §10) so the admin gets the reason without a round trip.
 * The backend checks them again on the effective values.
 */
export function validateClientPayload(params: ValidatePayloadParams): ValidatePayloadResult {
  if (params.clientId !== undefined && !params.clientId.trim()) {
    return { errorCode: "clientIdAndNameRequired" }
  }

  if (!params.name.trim()) {
    return { errorCode: params.clientId !== undefined ? "clientIdAndNameRequired" : "nameRequired" }
  }

  // refresh_token alone is no grant: it needs authorization_code or the device grant.
  const grantTypes = toManagedGrantTypes(params.grantTypes)
  if (!hasAuthorizationCodeGrant(grantTypes) && !hasDeviceGrant(grantTypes)) {
    return { errorCode: "grantTypeRequired" }
  }

  // Only the authorization code grant redirects; device-only clients have no callback.
  const normalizedUris = normalizeRedirectUris(params.redirectUris)
  if (hasAuthorizationCodeGrant(grantTypes) && normalizedUris.length === 0) {
    return { errorCode: "redirectUriRequired" }
  }

  if (params.scopes.length === 0) {
    return { errorCode: "scopeRequired" }
  }

  // Hydra rejects `profile` / `email` outside an OIDC (`openid`) request, so
  // registering them without `openid` produces a client that can never use them.
  const wantsOidcClaims = params.scopes.includes("profile") || params.scopes.includes("email")
  if (wantsOidcClaims && !params.scopes.includes("openid")) {
    return { errorCode: "oidcScopeRequiresOpenid" }
  }

  // Hydra refuses post-logout URIs on a client without redirect URIs.
  const normalizedPostLogoutUris = normalizeRedirectUris(params.postLogoutRedirectUris ?? [])
  if (normalizedPostLogoutUris.length > 0 && normalizedUris.length === 0) {
    return { errorCode: "postLogoutRequiresRedirectUris" }
  }

  if (params.scopes.includes("offline_access") && !grantTypes.includes(GRANT_TYPE_REFRESH_TOKEN)) {
    return { errorCode: "offlineAccessRequiresRefreshToken" }
  }

  // The device page tells the user which account they authorized, which needs user:read.
  if (hasDeviceGrant(grantTypes) && !params.scopes.includes("user:read")) {
    return { errorCode: "deviceRequiresUserRead" }
  }

  const devicePolicy = resolveDevicePolicy({ ...params, grantTypes })
  if (devicePolicy.allowWrite && !canAllowDeviceWrite({ clientType: params.clientType, grantTypes, scopes: params.scopes })) {
    return { errorCode: "deviceWriteRequiresPublicClient" }
  }

  if (!isValidMaxCodesPer10m(devicePolicy.maxCodesPer10m)) {
    return { errorCode: "invalidDevicePolicy" }
  }

  return {
    normalizedUris,
    normalizedPostLogoutUris,
    grantTypes,
    devicePolicy,
  }
}

type GrantFields = {
  grantTypes: readonly string[]
  devicePolicy: OAuthClientDevicePolicy
}

function sameDevicePolicy(left: OAuthClientDevicePolicy, right: OAuthClientDevicePolicy) {
  return left.firstParty === right.firstParty
    && left.allowWrite === right.allowWrite
    && left.maxCodesPer10m === right.maxCodesPer10m
}

/**
 * The grant members of an edit: each is sent only when it changed, because the
 * backend keeps the registered value of an omitted member (and an untouched
 * device-only client is then still judged as one).
 */
export function diffGrantFields(next: GrantFields, initial: GrantFields): Pick<OAuthClient, "grantTypes" | "devicePolicy"> {
  const patch: Pick<OAuthClient, "grantTypes" | "devicePolicy"> = {}
  if (!sameGrantTypes(next.grantTypes, toManagedGrantTypes(initial.grantTypes))) {
    patch.grantTypes = [...next.grantTypes]
  }
  if (!sameDevicePolicy(next.devicePolicy, initial.devicePolicy)) {
    patch.devicePolicy = { ...next.devicePolicy }
  }
  return patch
}
