import { ref, shallowRef } from "vue"
import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { UnknownRecord } from "@/lib/record-utils"
import type { APIResponse } from "@/types"
import { normalizeAccessibleGameAccounts, type AccessibleGameAccount } from "./selectable-accounts"

/**
 * Read model behind every game-account selector: one entry per account the
 * current user may read data for — own bindings and live data grants merged,
 * pre-filtered by the backend with the same predicates the read path applies
 * (`GET /api/user/:id/accessible-game-accounts`).
 */

export type {
  AccessibleGameAccount,
  AccessibleGameAccountOwner,
  GameAccountCapabilityName,
} from "./selectable-accounts"

export async function fetchAccessibleGameAccounts(toolboxUserId: string): Promise<AccessibleGameAccount[]> {
  const res = await request<APIResponse<UnknownRecord>>(
    buildUserApiPath(toolboxUserId, "accessible-game-accounts"),
    { method: "GET" },
  )
  return normalizeAccessibleGameAccounts(unwrapUpdatedData(res))
}

// Shared across every selector instance: the aggregate is fetched once per
// login and refreshed only when a grant or binding mutation invalidates it.
const accessibleAccounts = shallowRef<AccessibleGameAccount[] | null>(null)
// The first load attempt (success OR failure) for the current user has
// finished — selection logic uses this to hold a persisted granted
// selection instead of flashing the own default account mid-load.
const accessibleAccountsSettled = ref(false)
const loadedForUserId = ref<string | null>(null)
let inflightForUserId: string | null = null
// Bumped whenever the current state is superseded (logout, invalidate) so a
// stale in-flight response can never commit.
let loadGeneration = 0

/**
 * Idempotent lazy load; safe to call from every selector instantiation. A
 * failure leaves the state null — selectors then simply show own bindings,
 * matching the pre-grant behavior.
 */
export function ensureAccessibleGameAccountsLoaded(toolboxUserId: string | null | undefined): void {
  if (!toolboxUserId) {
    loadGeneration += 1
    accessibleAccounts.value = null
    accessibleAccountsSettled.value = false
    loadedForUserId.value = null
    inflightForUserId = null
    return
  }
  if (loadedForUserId.value === toolboxUserId || inflightForUserId === toolboxUserId) {
    return
  }
  const generation = ++loadGeneration
  inflightForUserId = toolboxUserId
  fetchAccessibleGameAccounts(toolboxUserId)
    .then((accounts) => {
      if (loadGeneration !== generation) {
        return
      }
      accessibleAccounts.value = accounts
      loadedForUserId.value = toolboxUserId
    })
    .catch(() => {
      // Silent: the aggregate is an enhancement over own bindings.
    })
    .finally(() => {
      if (loadGeneration === generation) {
        accessibleAccountsSettled.value = true
        inflightForUserId = null
      }
    })
}

/** Call after any grant or binding mutation so open selectors refresh. */
export function invalidateAccessibleGameAccounts(): void {
  const userId = loadedForUserId.value ?? inflightForUserId
  loadGeneration += 1
  loadedForUserId.value = null
  inflightForUserId = null
  if (userId) {
    ensureAccessibleGameAccountsLoaded(userId)
  }
}

export function getAccessibleGameAccountsRef() {
  return accessibleAccounts
}

export function getAccessibleGameAccountsSettledRef() {
  return accessibleAccountsSettled
}
