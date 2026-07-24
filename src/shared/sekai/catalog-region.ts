import { computed, type ComputedRef } from "vue"
import { storeToRefs } from "pinia"
import type { SekaiRegion } from "@/types"
import { isSekaiRegion } from "@/lib/sekai-region"
import { useSettingsStore, type SekaiCatalogRegionMode } from "@/shared/stores/settings"
import { useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"

export const SEKAI_CATALOG_REGION_FOLLOW_VALUE = "follow"

export function resolveEffectiveCatalogRegion(
  mode: SekaiCatalogRegionMode,
  manualRegion: SekaiRegion,
  accountServer: SekaiRegion | null | undefined,
): SekaiRegion {
  if (mode === "follow" && accountServer) {
    return accountServer
  }

  return manualRegion
}

export type UseEffectiveCatalogRegionResult = {
  /** The region catalog pages should actually read masterdata from. */
  region: ComputedRef<SekaiRegion>
  mode: ComputedRef<SekaiCatalogRegionMode>
  /** Selector model value: the follow sentinel or the manual region. */
  selectorValue: ComputedRef<string>
  /** Applies a selector change: the follow sentinel or a concrete region. */
  updateSelectorValue: (value: unknown) => void
}

export function useEffectiveCatalogRegion(): UseEffectiveCatalogRegionResult {
  const settingsStore = useSettingsStore()
  const { sekaiCatalogRegion, sekaiCatalogRegionMode } = storeToRefs(settingsStore)
  const { selectedAccount } = useGameAccountSelection()

  const region = computed(() =>
    resolveEffectiveCatalogRegion(
      sekaiCatalogRegionMode.value,
      sekaiCatalogRegion.value,
      selectedAccount.value?.server ?? null,
    ),
  )

  return {
    region,
    mode: computed(() => sekaiCatalogRegionMode.value),
    selectorValue: computed(() =>
      sekaiCatalogRegionMode.value === "follow" ? SEKAI_CATALOG_REGION_FOLLOW_VALUE : sekaiCatalogRegion.value,
    ),
    updateSelectorValue: (value: unknown) => {
      if (value === SEKAI_CATALOG_REGION_FOLLOW_VALUE) {
        settingsStore.setSekaiCatalogRegionFollowAccount()
        return
      }
      if (isSekaiRegion(value)) {
        settingsStore.setSekaiCatalogRegion(value)
      }
    },
  }
}
