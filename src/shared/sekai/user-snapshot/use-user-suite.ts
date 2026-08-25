import { computed, reactive, shallowRef, ref, watch, type ComputedRef, type Ref } from "vue"
import { isAxiosError } from "axios"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/shared/stores/user"
import { useSettingsStore } from "@/shared/stores/settings"
import {
  ensureAccessibleGameAccountsLoaded,
  getAccessibleGameAccountsRef,
  getAccessibleGameAccountsSettledRef,
  invalidateAccessibleGameAccounts,
  type GameAccountCapabilityName,
} from "./accessible-accounts"
import { buildSelectableGameAccounts, type SelectableGameAccount } from "./selectable-accounts"
import { fetchUserSuiteWithCache, type UserSuiteFetchStrategy } from "./fetch"

export { buildSelectableGameAccounts, makeGameAccountKey, makeGrantedGameAccountKey, type SelectableGameAccount } from "./selectable-accounts"

export type UseGameAccountSelectionOptions = {
  /**
   * Feature gate: granted accounts appear only when this capability was
   * granted. Own accounts are always listed (an unverified own binding is
   * shown as present-but-unusable, matching pre-grant behavior).
   */
  capability?: GameAccountCapabilityName
}

export type UseGameAccountSelectionResult = {
  accounts: ComputedRef<SelectableGameAccount[]>
  selectedAccountKey: ComputedRef<string | null>
  selectedAccount: ComputedRef<SelectableGameAccount | null>
  selectAccount: (key: string | null) => void
}

export type UserSuiteStatus = "idle" | "loading" | "ready" | "error"

export type UseUserSuiteResult = {
  status: Ref<UserSuiteStatus>
  data: Ref<Record<string, unknown> | null>
  uploadTime: Ref<number | null>
  cacheHit: Ref<boolean>
  error: Ref<unknown>
  reload: (strategy?: UserSuiteFetchStrategy) => Promise<void>
}


// Granted accounts whose reads already came back 403 this session; each
// triggers at most one aggregate refresh.
const lapsedGrantKeys = new Set<string>()

// Last known snapshot upload time per account, fed by every useUserSuite
// fetch so layout-level UI (e.g. under the account selector) can show the
// data timestamp without issuing its own suite request.
const uploadTimeByAccount = reactive(new Map<string, number | null>())

export function useAccountUploadTime(
  account: ComputedRef<SelectableGameAccount | null> | Ref<SelectableGameAccount | null>,
): ComputedRef<number | null> {
  return computed(() => {
    const key = account.value?.key
    return key ? uploadTimeByAccount.get(key) ?? null : null
  })
}

export function useGameAccountSelection(options: UseGameAccountSelectionOptions = {}): UseGameAccountSelectionResult {
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()
  const { gameAccountBindings, userId } = storeToRefs(userStore)
  const { selectedGameAccountKey } = storeToRefs(settingsStore)
  const accessibleAccounts = getAccessibleGameAccountsRef()
  const accessibleAccountsSettled = getAccessibleGameAccountsSettledRef()

  watch(
    userId,
    (value) => {
      ensureAccessibleGameAccountsLoaded(value ?? null)
    },
    { immediate: true },
  )

  const accounts = computed<SelectableGameAccount[]>(() =>
    buildSelectableGameAccounts(gameAccountBindings.value ?? [], accessibleAccounts.value, options.capability),
  )

  const selectedAccount = computed<SelectableGameAccount | null>(() => {
    const available = accounts.value
    if (available.length === 0) {
      return null
    }

    const preferred = selectedGameAccountKey.value
    if (preferred) {
      const match = available.find((account) => account.key === preferred)
      if (match) {
        return match
      }
      // A persisted granted selection cannot resolve until the aggregate's
      // first load settles — hold instead of flashing the own default
      // account (and firing its data fetch) for a moment.
      if (preferred.startsWith("grant:") && !accessibleAccountsSettled.value) {
        return null
      }
    }

    // No (valid) local selection yet: start from the server-side default
    // account, then any verified binding, then whatever exists — own
    // accounts before granted ones in every tier.
    const own = available.filter((account) => account.ownership === "own")
    return (
      own.find((account) => account.isDefault && account.verified)
      ?? own.find((account) => account.isDefault)
      ?? own.find((account) => account.verified)
      ?? own[0]
      ?? available[0]
      ?? null
    )
  })

  return {
    accounts,
    selectedAccountKey: computed(() => selectedAccount.value?.key ?? null),
    selectedAccount,
    selectAccount: (key) => settingsStore.setSelectedGameAccountKey(key),
  }
}

export function useUserSuite(
  keys: readonly string[],
  account: ComputedRef<SelectableGameAccount | null> | Ref<SelectableGameAccount | null>,
): UseUserSuiteResult {
  const userStore = useUserStore()
  const { userId } = storeToRefs(userStore)

  const status = ref<UserSuiteStatus>("idle")
  const data = shallowRef<Record<string, unknown> | null>(null)
  const uploadTime = ref<number | null>(null)
  const cacheHit = ref(false)
  const error = shallowRef<unknown>(null)

  let generation = 0

  async function load(strategy: UserSuiteFetchStrategy, options: { silent?: boolean } = {}): Promise<void> {
    const toolboxUserId = userId.value
    const target = account.value
    if (!toolboxUserId || !target) {
      generation += 1
      status.value = "idle"
      data.value = null
      uploadTime.value = null
      cacheHit.value = false
      error.value = null
      return
    }

    // A silent load revalidates behind already-rendered data: no loading
    // state, and failures keep the (stale) data on screen.
    const silent = options.silent === true && status.value === "ready" && data.value != null
    const currentGeneration = ++generation
    if (!silent) {
      status.value = "loading"
      error.value = null
    }
    try {
      const result = await fetchUserSuiteWithCache(
        {
          toolboxUserId,
          server: target.server,
          gameUserId: target.userId,
          keys,
        },
        { strategy },
      )
      if (currentGeneration !== generation) {
        return
      }

      // Skip the data swap when a revalidation confirmed the rendered
      // snapshot is still current, so consumers don't recompute for nothing.
      const unchanged = silent
        && result.cacheHit
        && result.remoteUploadTime != null
        && result.remoteUploadTime === uploadTime.value
      if (!unchanged) {
        data.value = result.data
      }
      uploadTime.value = result.remoteUploadTime
      uploadTimeByAccount.set(target.key, result.remoteUploadTime)
      cacheHit.value = result.cacheHit
      status.value = "ready"
      error.value = null
    } catch (loadError) {
      if (currentGeneration !== generation || silent) {
        return
      }

      // A 403 on a granted account means the grant lapsed after it was
      // listed: refresh the aggregate once so the entry drops out and the
      // selection falls back to an own account automatically. One attempt
      // per account per session — if the backend keeps listing it, don't
      // loop.
      if (
        target.ownership === "granted"
        && isAxiosError(loadError)
        && loadError.response?.status === 403
        && !lapsedGrantKeys.has(target.key)
      ) {
        lapsedGrantKeys.add(target.key)
        invalidateAccessibleGameAccounts()
      }

      error.value = loadError
      status.value = "error"
    }
  }

  async function loadWithRevalidate(): Promise<void> {
    await load("prefer-cache")
    if (status.value === "ready" && cacheHit.value) {
      await load("check-remote", { silent: true })
    }
  }

  watch(
    () => [userId.value, account.value?.key ?? null] as const,
    () => {
      void loadWithRevalidate()
    },
    { immediate: true },
  )

  return {
    status,
    data,
    uploadTime,
    cacheHit,
    error,
    reload: (strategy = "check-remote") => load(strategy),
  }
}
