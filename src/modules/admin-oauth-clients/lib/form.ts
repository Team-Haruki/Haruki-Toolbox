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

/** The form controls an inline validation message can point at. */
export type OAuthClientFormField =
  | "clientId"
  | "name"
  | "grantTypes"
  | "redirectUris"
  | "scopes"
  | "postLogoutRedirectUris"
  | "deviceAllowWrite"
  | "deviceMaxCodes"

export type OAuthClientFormErrors = Partial<Record<OAuthClientFormField, string>>

/** DOM ids of the form controls, for `aria-describedby` and focusing the first invalid one. */
export const OAUTH_CLIENT_FIELD_IDS: Record<OAuthClientFormField, string> = {
  clientId: "oauth-client-create-id",
  name: "oauth-client-form-name",
  grantTypes: "oauth-client-form-grant-types",
  redirectUris: "oauth-client-form-redirect-uri-0",
  scopes: "oauth-client-form-scopes",
  postLogoutRedirectUris: "oauth-client-form-post-logout-uri-0",
  deviceAllowWrite: "oauth-client-form-device-allow-write",
  deviceMaxCodes: "oauth-client-form-device-max-codes",
}

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
  /**
   * The client's registered scopes and grant types on edit. When neither
   * changed, the scope rules are not re-judged: the backend keeps what is
   * registered, so an existing client must stay saveable as it is.
   */
  initialScopes?: string[]
  initialGrantTypes?: string[]
}

export type ValidatePayloadErrorCode =
  | "clientIdAndNameRequired"
  | "clientIdRequired"
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

export type ValidatePayloadError = { errorCode: ValidatePayloadErrorCode; field: OAuthClientFormField }

type ValidatePayloadResult =
  | {
    normalizedUris: string[]
    normalizedPostLogoutUris: string[]
    grantTypes: ManagedGrantType[]
    devicePolicy: OAuthClientDevicePolicy
  }
  | ValidatePayloadError

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

function sameScopeSet(left: readonly string[], right: readonly string[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  if (leftSet.size !== rightSet.size) return false
  for (const scope of leftSet) {
    if (!rightSet.has(scope)) return false
  }
  return true
}

/**
 * Checks a create or edit before it is sent, with the backend's rules
 * (oauth2-integration §10) so the admin gets the reason without a round trip.
 * Required-field checks come first, then the rules that relate fields, so the
 * first message is always about something the admin can simply fill in. The
 * backend checks them again on the effective values.
 */
export function validateClientPayload(params: ValidatePayloadParams): ValidatePayloadResult {
  const clientIdMissing = params.clientId !== undefined && !params.clientId.trim()
  const nameMissing = !params.name.trim()
  if (clientIdMissing && nameMissing) {
    return { errorCode: "clientIdAndNameRequired", field: "clientId" }
  }
  if (clientIdMissing) {
    return { errorCode: "clientIdRequired", field: "clientId" }
  }
  if (nameMissing) {
    return { errorCode: "nameRequired", field: "name" }
  }

  // refresh_token alone is no grant: it needs authorization_code or the device grant.
  const grantTypes = toManagedGrantTypes(params.grantTypes)
  if (!hasAuthorizationCodeGrant(grantTypes) && !hasDeviceGrant(grantTypes)) {
    return { errorCode: "grantTypeRequired", field: "grantTypes" }
  }

  // Only the authorization code grant redirects; device-only clients have no callback.
  const normalizedUris = normalizeRedirectUris(params.redirectUris)
  if (hasAuthorizationCodeGrant(grantTypes) && normalizedUris.length === 0) {
    return { errorCode: "redirectUriRequired", field: "redirectUris" }
  }

  if (params.scopes.length === 0) {
    return { errorCode: "scopeRequired", field: "scopes" }
  }

  // Hydra refuses post-logout URIs on a client without redirect URIs.
  const normalizedPostLogoutUris = normalizeRedirectUris(params.postLogoutRedirectUris ?? [])
  if (normalizedPostLogoutUris.length > 0 && normalizedUris.length === 0) {
    return { errorCode: "postLogoutRequiresRedirectUris", field: "postLogoutRedirectUris" }
  }

  // An edit that touched neither scopes nor grant types keeps the registered
  // combination; the backend accepts it as is, so it is not re-judged here.
  const grantRegistrationUnchanged = params.initialScopes !== undefined
    && params.initialGrantTypes !== undefined
    && sameScopeSet(params.scopes, params.initialScopes)
    && sameGrantTypes(grantTypes, toManagedGrantTypes(params.initialGrantTypes))

  if (!grantRegistrationUnchanged) {
    // Hydra rejects `profile` / `email` outside an OIDC (`openid`) request, so
    // registering them without `openid` produces a client that can never use them.
    const wantsOidcClaims = params.scopes.includes("profile") || params.scopes.includes("email")
    if (wantsOidcClaims && !params.scopes.includes("openid")) {
      return { errorCode: "oidcScopeRequiresOpenid", field: "scopes" }
    }

    if (params.scopes.includes("offline_access") && !grantTypes.includes(GRANT_TYPE_REFRESH_TOKEN)) {
      return { errorCode: "offlineAccessRequiresRefreshToken", field: "scopes" }
    }

    // The device page tells the user which account they authorized, which needs user:read.
    if (hasDeviceGrant(grantTypes) && !params.scopes.includes("user:read")) {
      return { errorCode: "deviceRequiresUserRead", field: "scopes" }
    }
  }

  const devicePolicy = resolveDevicePolicy({ ...params, grantTypes })
  if (devicePolicy.allowWrite && !canAllowDeviceWrite({ clientType: params.clientType, grantTypes, scopes: params.scopes })) {
    return { errorCode: "deviceWriteRequiresPublicClient", field: "deviceAllowWrite" }
  }

  if (!isValidMaxCodesPer10m(devicePolicy.maxCodesPer10m)) {
    return { errorCode: "invalidDevicePolicy", field: "deviceMaxCodes" }
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
