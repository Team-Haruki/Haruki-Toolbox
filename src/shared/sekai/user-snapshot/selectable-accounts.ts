import { asRecord, readBoolean, readOptionalString, readString, type UnknownRecord } from "@/lib/record-utils"
import type { SekaiRegion } from "@/types"
import type { GameAccountBinding } from "@/types/store"

export type GameAccountCapabilityName = "suite" | "mysekai" | "profile" | "recommend"

export type AccessibleGameAccountOwner = {
  userId: string
  name: string
  avatarPath: string | null
}

export type AccessibleGameAccount = {
  server: SekaiRegion
  gameUserId: string
  ownership: "own" | "granted"
  verified: boolean
  isDefault: boolean
  /** Present key = readable data type; a null expiresAt never expires. */
  capabilities: Partial<Record<string, { expiresAt: string | null }>>
  owner: AccessibleGameAccountOwner | null
}

function normalizeCapabilities(value: unknown): AccessibleGameAccount["capabilities"] {
  const record = asRecord(value)
  if (!record) {
    return {}
  }
  const capabilities: AccessibleGameAccount["capabilities"] = {}
  for (const [name, capability] of Object.entries(record)) {
    const capabilityRecord = asRecord(capability)
    capabilities[name] = {
      expiresAt: capabilityRecord ? readOptionalString(capabilityRecord, ["expiresAt", "expires_at"]) ?? null : null,
    }
  }
  return capabilities
}

function normalizeAccessibleGameAccount(record: UnknownRecord): AccessibleGameAccount | null {
  const server = readString(record, ["server"])
  const gameUserId = readString(record, ["gameUserId", "game_user_id"])
  if (!server || !gameUserId) {
    return null
  }
  const ownerRecord = asRecord(record.owner)
  return {
    server: server as SekaiRegion,
    gameUserId,
    ownership: readString(record, ["ownership"]) === "granted" ? "granted" : "own",
    verified: readBoolean(record, ["verified"], false),
    isDefault: readBoolean(record, ["isDefault", "is_default"], false),
    capabilities: normalizeCapabilities(record.capabilities),
    owner: ownerRecord
      ? {
          userId: readString(ownerRecord, ["userId", "user_id"]),
          name: readString(ownerRecord, ["name"]),
          avatarPath: readOptionalString(ownerRecord, ["avatarPath", "avatar_path"]) ?? null,
        }
      : null,
  }
}

export function normalizeAccessibleGameAccounts(updatedData: UnknownRecord): AccessibleGameAccount[] {
  if (!Array.isArray(updatedData.accounts)) {
    return []
  }
  return updatedData.accounts
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .map((item) => normalizeAccessibleGameAccount(item))
    .filter((item): item is AccessibleGameAccount => item !== null)
}

export type SelectableGameAccount = Omit<GameAccountBinding, "userId"> & {
  /**
   * Kept as a string for granted accounts: jp/en game uids are 17-18 digit
   * values above Number.MAX_SAFE_INTEGER, so a Number() round-trip would
   * silently corrupt them. Every consumer (URL building, cache keys,
   * display) interpolates, never computes.
   */
  userId: number | string
  key: string
  ownership: "own" | "granted"
  /** Readable data types; own verified accounts hold every capability. */
  capabilities: ReadonlySet<string>
  owner: AccessibleGameAccountOwner | null
}

export function makeGameAccountKey(account: { server: string; userId: string | number }): string {
  return `${account.server}:${account.userId}`
}

/** Namespaced so a granted account can never collide with a persisted own-account selection. */
export function makeGrantedGameAccountKey(account: Pick<AccessibleGameAccount, "server" | "gameUserId">): string {
  return `grant:${account.server}:${account.gameUserId}`
}

// Mirrors the backend's ownedGameAccountCapabilities: a verified owner may
// read everything, an unverified binding is unreadable even by its owner.
const OWNED_ACCOUNT_CAPABILITIES: readonly GameAccountCapabilityName[] = ["suite", "mysekai", "profile", "recommend"]
const EMPTY_CAPABILITIES: ReadonlySet<string> = new Set()
const FULL_OWNED_CAPABILITIES: ReadonlySet<string> = new Set(OWNED_ACCOUNT_CAPABILITIES)

/**
 * Merges own bindings with granted accounts from the accessible-accounts
 * aggregate into the selector list. Own accounts are always listed (an
 * unverified binding shows as present-but-unusable); granted accounts are
 * filtered by the requested capability — a list means any one of them
 * qualifies (for pages with multiple data sources, each gated separately).
 */
export function buildSelectableGameAccounts(
  bindings: readonly GameAccountBinding[],
  accessible: readonly AccessibleGameAccount[] | null,
  capability?: GameAccountCapabilityName | readonly GameAccountCapabilityName[],
): SelectableGameAccount[] {
  const requiredCapabilities = capability == null
    ? null
    : Array.isArray(capability) ? capability as readonly GameAccountCapabilityName[] : [capability as GameAccountCapabilityName]
  const own: SelectableGameAccount[] = bindings.map((binding) => ({
    ...binding,
    key: makeGameAccountKey(binding),
    ownership: "own",
    capabilities: binding.verified ? FULL_OWNED_CAPABILITIES : EMPTY_CAPABILITIES,
    owner: null,
  }))

  // Defensive dedupe: after a rebinding the aggregate could briefly pair a
  // stale grant with an account the user now owns — own always wins.
  const ownKeys = new Set(own.map((account) => makeGameAccountKey(account)))
  const granted: SelectableGameAccount[] = (accessible ?? [])
    .filter((account) => account.ownership === "granted")
    .filter((account) => !ownKeys.has(`${account.server}:${account.gameUserId}`))
    .filter((account) =>
      requiredCapabilities == null || requiredCapabilities.some((name) => account.capabilities[name] != null))
    .map((account) => ({
      server: account.server,
      userId: account.gameUserId,
      verified: account.verified,
      isDefault: false,
      key: makeGrantedGameAccountKey(account),
      ownership: "granted",
      capabilities: new Set(Object.keys(account.capabilities)),
      owner: account.owner,
    }))

  return [...own, ...granted]
}
