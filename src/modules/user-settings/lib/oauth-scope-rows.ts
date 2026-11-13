// The permission list of the consent page and of the device review card: one
// row per requested scope, in the order the page shows them, with the rows
// that deserve a second look marked. Labels and descriptions stay with
// `oauth-scopes.ts`; nothing here decides what is granted.

import type { DeviceLookupScope, DeviceScopeRisk } from "@/modules/user-settings/api/oauth2.device"
import { groupScopes, isKnownScope } from "@/modules/user-settings/lib/oauth-scopes"

/**
 * Why a row is marked: the app may change or submit data as the user
 * (`write`), or keeps its access while the user is away (`offline`).
 */
export type OAuthScopeAttention = "write" | "offline"

export interface OAuthScopeRow {
  /** Unique within one list even when a scope is requested twice. */
  key: string
  scope: string
  /** False for a scope the toolbox has no label for. */
  known: boolean
  attention: OAuthScopeAttention | null
  /** The backend's own classification; the device page only. */
  risk?: DeviceScopeRisk
}

const OFFLINE_SCOPE = "offline_access"

/**
 * Rows of the consent page: every requested scope once per request entry, in
 * the page's read → write → other order (`groupScopes`).
 */
export function buildConsentScopeRows(scopes: readonly string[]): OAuthScopeRow[] {
  const rows: OAuthScopeRow[] = []
  for (const bucket of groupScopes(scopes)) {
    for (const scope of bucket.scopes) {
      let attention: OAuthScopeAttention | null = null
      if (bucket.group === "write") {
        attention = "write"
      } else if (scope === OFFLINE_SCOPE) {
        attention = "offline"
      }
      rows.push({ key: `${rows.length}:${scope}`, scope, known: isKnownScope(scope), attention })
    }
  }
  return rows
}

/**
 * Rows of the device review card, in the backend's order. The backend
 * classifies every scope itself, so its `risk` decides what is marked.
 */
export function buildDeviceScopeRows(scopes: readonly DeviceLookupScope[]): OAuthScopeRow[] {
  return scopes.map((item, index) => {
    let attention: OAuthScopeAttention | null = null
    if (item.risk === "write") {
      attention = "write"
    } else if (item.risk === "offline") {
      attention = "offline"
    }
    return { key: `${index}:${item.scope}`, scope: item.scope, known: isKnownScope(item.scope), attention, risk: item.risk }
  })
}
