import type { OAuthClient } from "@/types/admin"

export const DEFAULT_CLIENT_TYPE: NonNullable<OAuthClient["clientType"]> = "confidential"
export const DEFAULT_SCOPE = "user:read"

export const AVAILABLE_SCOPE_IDS = [
  "user:read",
  "bindings:read",
  "game-data:read",
  "game-data:write",
  "openid",
  "profile",
  "email",
  "offline_access",
] as const

type ValidatePayloadParams = {
  clientId?: string
  name: string
  scopes: string[]
  redirectUris: string[]
  postLogoutRedirectUris?: string[]
}

export type ValidatePayloadErrorCode =
  | "clientIdAndNameRequired"
  | "nameRequired"
  | "redirectUriRequired"
  | "scopeRequired"
  | "oidcScopeRequiresOpenid"

type ValidatePayloadResult =
  | { normalizedUris: string[]; normalizedPostLogoutUris: string[] }
  | { errorCode: ValidatePayloadErrorCode }

export function toggleScopeSelection(scopes: string[], scopeId: string, checked: boolean) {
  if (checked) {
    if (scopes.includes(scopeId)) {
      return scopes
    }
    return [...scopes, scopeId]
  }

  return scopes.filter((scope) => scope !== scopeId)
}

export function normalizeRedirectUris(uris: string[]) {
  return uris.map((uri) => uri.trim()).filter(Boolean)
}

export function validateClientPayload(params: ValidatePayloadParams): ValidatePayloadResult {
  if (params.clientId !== undefined && !params.clientId.trim()) {
    return { errorCode: "clientIdAndNameRequired" }
  }

  if (!params.name.trim()) {
    return { errorCode: params.clientId !== undefined ? "clientIdAndNameRequired" : "nameRequired" }
  }

  const normalizedUris = normalizeRedirectUris(params.redirectUris)
  if (normalizedUris.length === 0) {
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

  return {
    normalizedUris,
    normalizedPostLogoutUris: normalizeRedirectUris(params.postLogoutRedirectUris ?? []),
  }
}
