import { computed, ref, type Ref } from "vue"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"
import type { BindingKeyParts } from "@/modules/admin-game-bindings/lib/management-meta"

type ParseKeyFn = (key: string) => BindingKeyParts | null
type KeyResolver = (binding: GlobalGameBinding) => string

export function useGameBindingSelection(
  bindings: Ref<GlobalGameBinding[]>,
  resolveKey: KeyResolver,
  parseKey: ParseKeyFn
) {
  const selected = ref<Set<string>>(new Set())

  const selectAll = computed(() => {
    if (bindings.value.length === 0) {
      return false
    }
    return bindings.value.every((binding) => selected.value.has(resolveKey(binding)))
  })

  function resetSelection() {
    selected.value = new Set()
  }

  function toggleSelect(key: string) {
    const nextSelected = new Set(selected.value)
    if (nextSelected.has(key)) {
      nextSelected.delete(key)
    } else {
      nextSelected.add(key)
    }
    selected.value = nextSelected
  }

  function toggleSelectAll() {
    if (selectAll.value) {
      resetSelection()
      return
    }
    selected.value = new Set(bindings.value.map((binding) => resolveKey(binding)))
  }

  function parseSelectedBindings() {
    return Array.from(selected.value)
      .map((key) => parseKey(key))
      .filter((item): item is BindingKeyParts => item !== null && !!item.server && !!item.gameUserId)
  }

  return {
    selected,
    selectAll,
    resetSelection,
    toggleSelect,
    toggleSelectAll,
    parseSelectedBindings,
  }
}
