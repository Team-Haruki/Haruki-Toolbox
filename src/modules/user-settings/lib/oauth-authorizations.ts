import type { OAuthAuthorization } from "@/modules/user-settings/api/oauth2"

interface AuthorizationKeySource {
  clientId: string
  consentRequestId?: string
}

/**
 * v-for key for an authorized-app row. Every consent session is its own row and
 * one client can hold several of them, so the consent request id is the key.
 * The backend omits an empty id, which falls back to the client id plus the
 * row position.
 */
export function oauthAuthorizationKey(authorization: AuthorizationKeySource, index: number): string {
  const consentRequestId = authorization.consentRequestId?.trim() ?? ""
  return consentRequestId || `${authorization.clientId}#${index}`
}

/** True for a grant made through the device flow; a missing or unknown flowType is a browser grant. */
export function isDeviceAuthorization(authorization: Pick<OAuthAuthorization, "flowType">): boolean {
  return authorization.flowType === "device"
}

/** One grant (consent session) of a client, with its stable row key. */
export interface OAuthAuthorizationRow {
  key: string
  authorization: OAuthAuthorization
}

/** All grants of one client: browser grants and, each on its own row, devices. */
export interface OAuthAuthorizationGroup {
  key: string
  clientId: string
  clientName: string
  clientType: string
  browserGrants: OAuthAuthorizationRow[]
  deviceGrants: OAuthAuthorizationRow[]
}

function timeOf(createdAt: string): number {
  const time = Date.parse(createdAt)
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

function newestFirst(a: OAuthAuthorizationRow, b: OAuthAuthorizationRow): number {
  const delta = timeOf(b.authorization.createdAt) - timeOf(a.authorization.createdAt)
  return Number.isNaN(delta) ? 0 : delta
}

function latestTime(group: OAuthAuthorizationGroup): number {
  let latest = Number.NEGATIVE_INFINITY
  for (const row of [...group.browserGrants, ...group.deviceGrants]) {
    latest = Math.max(latest, timeOf(row.authorization.createdAt))
  }
  return latest
}

/**
 * Groups the authorization list by client. Inside a group each list is newest
 * first; groups are ordered by their newest grant. Ties keep the backend's
 * order (the sorts are stable). Row keys come from the position in the
 * backend's list, so they do not change with the grouping.
 */
export function groupOAuthAuthorizations(authorizations: readonly OAuthAuthorization[]): OAuthAuthorizationGroup[] {
  const groups = new Map<string, OAuthAuthorizationGroup>()
  authorizations.forEach((authorization, index) => {
    const clientId = authorization.clientId?.trim() ?? ""
    const groupKey = clientId || `#${index}`
    let group = groups.get(groupKey)
    if (!group) {
      group = {
        key: groupKey,
        clientId,
        clientName: authorization.clientName?.trim() || clientId,
        clientType: authorization.clientType,
        browserGrants: [],
        deviceGrants: [],
      }
      groups.set(groupKey, group)
    }
    const row = { key: oauthAuthorizationKey(authorization, index), authorization }
    if (isDeviceAuthorization(authorization)) {
      group.deviceGrants.push(row)
    } else {
      group.browserGrants.push(row)
    }
  })

  const result = [...groups.values()]
  for (const group of result) {
    group.browserGrants.sort(newestFirst)
    group.deviceGrants.sort(newestFirst)
  }
  const latest = new Map(result.map((group) => [group, latestTime(group)]))
  return result.sort((a, b) => {
    const delta = (latest.get(b) ?? 0) - (latest.get(a) ?? 0)
    return Number.isNaN(delta) ? 0 : delta
  })
}

/** The label a device row shows: the backend's label, trimmed; "" means unnamed. */
export function deviceAuthorizationLabel(authorization: Pick<OAuthAuthorization, "deviceLabel">): string {
  return authorization.deviceLabel?.trim() ?? ""
}
