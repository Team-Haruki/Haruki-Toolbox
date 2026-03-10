import type { OAuthClient } from "@/types/admin"

export const DEFAULT_CLIENT_TYPE: NonNullable<OAuthClient["clientType"]> = "confidential"
export const DEFAULT_SCOPE = "user:read"

export const AVAILABLE_SCOPE_IDS = [
  "user:read",
  "bindings:read",
  "game-data:read",
] as const

type ValidatePayloadParams = {
  clientId?: string
  name: string
  scopes: string[]
  redirectUris: string[]
}

export type ValidatePayloadErrorCode =
  | "clientIdAndNameRequired"
  | "nameRequired"
  | "redirectUriRequired"
  | "scopeRequired"

type ValidatePayloadResult =
  | { normalizedUris: string[] }
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

  return { normalizedUris }
}
