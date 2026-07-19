import { computed, shallowRef, ref, watch, type ComputedRef, type Ref } from "vue"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/shared/stores/user"
import { useSettingsStore } from "@/shared/stores/settings"
import type { GameAccountBinding } from "@/types/store"
import { fetchUserSuiteWithCache, type UserSuiteFetchStrategy } from "./fetch"

export type SelectableGameAccount = GameAccountBinding & { key: string }

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

export function makeGameAccountKey(account: Pick<GameAccountBinding, "server" | "userId">): string {
  return `${account.server}:${account.userId}`
}

export function useGameAccountSelection(): UseGameAccountSelectionResult {
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()
  const { gameAccountBindings } = storeToRefs(userStore)
  const { selectedGameAccountKey } = storeToRefs(settingsStore)

  const accounts = computed<SelectableGameAccount[]>(() =>
    (gameAccountBindings.value ?? []).map((binding) => ({
      ...binding,
      key: makeGameAccountKey(binding),
    })),
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
    }

    return available.find((account) => account.verified) ?? available[0] ?? null
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

  async function load(strategy: UserSuiteFetchStrategy): Promise<void> {
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

    const currentGeneration = ++generation
    status.value = "loading"
    error.value = null
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

      data.value = result.data
      uploadTime.value = result.remoteUploadTime
      cacheHit.value = result.cacheHit
      status.value = "ready"
    } catch (loadError) {
      if (currentGeneration !== generation) {
        return
      }

      error.value = loadError
      status.value = "error"
    }
  }

  watch(
    () => [userId.value, account.value?.key ?? null] as const,
    () => {
      void load("check-remote")
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
