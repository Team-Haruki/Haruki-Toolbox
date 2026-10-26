import { translate } from "@/shared/i18n"

const scopeLabelKeys: Record<string, string> = {
    "user:read": "oauth.scope.userRead",
    "bindings:read": "oauth.scope.bindingsRead",
    "game-data:read": "oauth.scope.gameDataRead",
    "game-data:write": "oauth.scope.gameDataWrite",
    "station:room:write": "oauth.scope.stationRoomWrite",
    "openid": "oauth.scope.openid",
    "profile": "oauth.scope.profile",
    "email": "oauth.scope.email",
    "offline_access": "oauth.scope.offlineAccess",
}

// Scopes whose consequences deserve a second line on the consent page.
// read and write are explained separately: granting one never implies the other.
const scopeDescriptionKeys: Record<string, string> = {
    "game-data:read": "oauth.scopeDescription.gameDataRead",
    "game-data:write": "oauth.scopeDescription.gameDataWrite",
    "station:room:write": "oauth.scopeDescription.stationRoomWrite",
    "offline_access": "oauth.scopeDescription.offlineAccess",
}

export type OAuthScopeGroup = "read" | "write" | "other"

/** Scopes the toolbox recognises; anything else renders as "other permission". */
export function isKnownScope(scope: string): boolean {
    return Object.hasOwn(scopeLabelKeys, scope)
}

export function getScopeLabel(scope: string): string {
    const key = isKnownScope(scope) ? scopeLabelKeys[scope] : undefined
    return key ? translate(key) : translate("oauth.scope.unknown", { scope })
}

export function getScopeDescription(scope: string): string | null {
    const key = Object.hasOwn(scopeDescriptionKeys, scope) ? scopeDescriptionKeys[scope] : undefined
    return key ? translate(key) : null
}

/**
 * Where a scope sits on the consent page: anything that lets the app change
 * or submit data on the user's behalf is "write"; identity and read-only
 * scopes are "read"; offline access and unknown scopes are "other".
 */
export function getScopeGroup(scope: string): OAuthScopeGroup {
    if (!isKnownScope(scope)) return "other"
    if (scope === "offline_access") return "other"
    return scope.endsWith(":write") ? "write" : "read"
}

export const OAUTH_SCOPE_GROUP_ORDER: readonly OAuthScopeGroup[] = ["read", "write", "other"]

export function groupScopes(scopes: readonly string[]): Array<{ group: OAuthScopeGroup; scopes: string[] }> {
    const buckets = new Map<OAuthScopeGroup, string[]>()
    for (const scope of scopes) {
        const group = getScopeGroup(scope)
        const bucket = buckets.get(group)
        if (bucket) {
            bucket.push(scope)
        } else {
            buckets.set(group, [scope])
        }
    }
    return OAUTH_SCOPE_GROUP_ORDER
        .filter((group) => buckets.has(group))
        .map((group) => ({ group, scopes: buckets.get(group) ?? [] }))
}
