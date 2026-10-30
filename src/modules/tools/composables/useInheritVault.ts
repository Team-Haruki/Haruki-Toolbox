import { ref, shallowRef, watch } from "vue"
import {
  destroyInheritVaultEntry,
  fetchInheritVaultKey,
  listInheritVaultEntries,
  reissueInheritVaultCode,
  resetInheritVault,
  revealInheritVaultCode,
  toInheritApiError,
  type InheritApiError,
} from "@/modules/tools/api/inherit"
import type { InheritNewPasswordMode } from "@/modules/tools/lib/inherit-job"
import type {
  InheritRevealedCode,
  InheritUnlockInput,
  InheritVaultEntry,
  InheritVaultKeyStatus,
} from "@/modules/tools/lib/inherit-vault"

export type InheritRevealSource = "reveal" | "reissue"

export interface InheritRevealedEntryCode extends InheritRevealedCode {
  source: InheritRevealSource
}

/**
 * The owner's inherit vault: key status, entry metadata, and the step-up
 * actions on an entry. Revealed codes live in memory only, per entry, and
 * are dropped when hidden, destroyed or when the vault is reset.
 */
export function useInheritVault(userId: () => string | null | undefined) {
  const keyStatus = shallowRef<InheritVaultKeyStatus | null>(null)
  const entries = ref<InheritVaultEntry[]>([])
  const loading = ref(false)
  const loadError = shallowRef<InheritApiError | null>(null)
  const revealed = ref<Record<string, InheritRevealedEntryCode>>({})
  let generation = 0

  async function refresh() {
    if (!userId()) {
      keyStatus.value = null
      entries.value = []
      return
    }
    const run = ++generation
    loading.value = true
    try {
      const [key, list] = await Promise.all([fetchInheritVaultKey(), listInheritVaultEntries()])
      if (run !== generation) return
      keyStatus.value = key
      entries.value = list
      loadError.value = null
      // Codes of entries that are gone (destroyed elsewhere, expired) go too.
      const ids = new Set(list.map((entry) => entry.id))
      revealed.value = Object.fromEntries(Object.entries(revealed.value).filter(([id]) => ids.has(id)))
    } catch (error) {
      if (run !== generation) return
      loadError.value = toInheritApiError(error)
    } finally {
      if (run === generation) loading.value = false
    }
  }

  async function reveal(entryId: string, unlock: InheritUnlockInput): Promise<InheritRevealedEntryCode> {
    try {
      const code = { ...(await revealInheritVaultCode(entryId, unlock)), source: "reveal" as const }
      revealed.value = { ...revealed.value, [entryId]: code }
      // A password change was just carried over: the key status moved on.
      if (unlock.previousPassword) void refresh()
      return code
    } catch (error) {
      throw toInheritApiError(error)
    }
  }

  async function reissue(entryId: string, unlock: InheritUnlockInput, mode: InheritNewPasswordMode): Promise<InheritRevealedEntryCode> {
    try {
      const code = { ...(await reissueInheritVaultCode(entryId, unlock, mode)), source: "reissue" as const }
      revealed.value = { ...revealed.value, [entryId]: code }
      void refresh()
      return code
    } catch (error) {
      throw toInheritApiError(error)
    }
  }

  function hide(entryId: string) {
    const next = { ...revealed.value }
    delete next[entryId]
    revealed.value = next
  }

  async function destroy(entryId: string): Promise<void> {
    try {
      await destroyInheritVaultEntry(entryId)
    } catch (error) {
      throw toInheritApiError(error)
    }
    hide(entryId)
    entries.value = entries.value.filter((entry) => entry.id !== entryId)
    void refresh()
  }

  async function reset(password?: string): Promise<number> {
    try {
      const destroyed = await resetInheritVault(password)
      revealed.value = {}
      await refresh()
      return destroyed
    } catch (error) {
      throw toInheritApiError(error)
    }
  }

  watch(
    () => userId() ?? null,
    (owner, previous) => {
      if (owner !== previous) {
        revealed.value = {}
        entries.value = []
        keyStatus.value = null
      }
      void refresh()
    },
    { immediate: true },
  )

  return {
    keyStatus,
    entries,
    loading,
    loadError,
    revealed,
    refresh,
    reveal,
    reissue,
    hide,
    destroy,
    reset,
  }
}

export type InheritVaultController = ReturnType<typeof useInheritVault>
